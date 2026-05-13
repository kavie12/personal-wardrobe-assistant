"""
Phase 2 - Context-aware outfit recommendation tests
====================================================
Tests POST /recommendation/get-recommendation with combined weather + context.

Test groups in test_recommendation_cases.json:
  SC-xx  Schedule-dominant  mild neutral weather, varied context/occasion
  WC-xx  Weather-dominant   vague context, varied weather conditions
  CC-xx  Combined           weather and context both actively relevant
  EX-xx  Edge cases         empty context, boundary temps, minimal cues

Scoring rules:
  outfit_complete   (strict)   topwear, bottomwear, footwear all non-null
  outerwear_rule    (strict)   "required" → outerwear != null  (temp < 15)
                               "absent"   → outerwear == null  (temp >= 15)
                               "optional" → no assertion made
  reason_present    (strict)   reason is a non-empty string
  occasion_match    (lenient)  each selected item's occasions must overlap
                               with expected_occasions (null = skip check)
  temperature_match (lenient)  each selected item's temperatures must include
                               the expected label (null = skip check)

Usage:
    pytest test_recommendation.py -v
    python test_recommendation.py
"""

import dotenv
dotenv.load_dotenv()

import os
import sys
import json
import time
import requests
from pathlib import Path
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_URL       = "http://localhost:8000/api/v1"
RECOMMEND_EP   = f"{BASE_URL}/recommendation/get-recommendation"
AUTH_TOKEN     = os.environ.get("AUTH_TOKEN", "YOUR_FIREBASE_ID_TOKEN_HERE")
TEST_DATA_FILE = Path(__file__).parent / "data/test_recommendation_cases.json"

# ---------------------------------------------------------------------------
# Load test cases
# ---------------------------------------------------------------------------

def _load_cases() -> List[Dict[str, Any]]:
    if not TEST_DATA_FILE.exists():
        raise FileNotFoundError(f"Test data not found: {TEST_DATA_FILE}")
    with open(TEST_DATA_FILE) as f:
        data = json.load(f)
    return data["tests"]

TEST_CASES = _load_cases()

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class CheckResult:
    name:    str
    passed:  bool
    detail:  str

@dataclass
class CaseResult:
    case_id:     str
    description: str
    group:       str
    passed:      bool
    response_ms: float
    checks:      List[CheckResult] = field(default_factory=list)
    error:       Optional[str] = None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _headers() -> dict:
    return {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type":  "application/json",
    }

def _call_api(weather_data: dict, context: str) -> tuple[dict, float]:
    payload = {"weather_data": weather_data, "context": context}
    t0      = time.perf_counter()
    resp    = requests.post(RECOMMEND_EP, json=payload,
                            headers=_headers(), timeout=30)
    elapsed = (time.perf_counter() - t0) * 1000
    resp.raise_for_status()
    return resp.json(), elapsed

# ---------------------------------------------------------------------------
# Individual checks
# ---------------------------------------------------------------------------

def check_outfit_complete(outfit: dict) -> CheckResult:
    missing = [k for k in ("topwear", "bottomwear", "footwear")
               if outfit.get(k) is None]
    passed  = len(missing) == 0
    detail  = "all present" if passed else f"missing: {missing}"
    return CheckResult("outfit_complete", passed, detail)

def check_outerwear_rule(outfit: dict, rule: str, temperature: int) -> CheckResult:
    outerwear = outfit.get("outerwear")
    if rule == "required":
        passed = outerwear is not None
        detail = ("outerwear present" if passed
                  else f"outerwear missing (temp={temperature}°C, rule=required)")
    elif rule == "absent":
        passed = outerwear is None
        detail = ("outerwear correctly absent" if passed
                  else f"unexpected outerwear at temp={temperature}°C")
    else:  # "optional"
        passed = True
        detail = f"outerwear={'present' if outerwear else 'absent'} (optional, not checked)"
    return CheckResult("outerwear_rule", passed, detail)

def check_reason_present(data: dict) -> CheckResult:
    reason = data.get("reason", "")
    passed = isinstance(reason, str) and len(reason.strip()) > 0
    detail = f"reason: '{reason[:80]}'" if passed else "reason is empty or missing"
    return CheckResult("reason_present", passed, detail)

def check_occasion_match(outfit: dict, expected_occasions: Optional[List[str]]) -> CheckResult:
    if expected_occasions is None:
        return CheckResult("occasion_match", True, "skipped (no expected occasions set)")

    exp_set  = set(expected_occasions)
    failures = []

    for slot, item in outfit.items():
        if item is None:
            continue
        item_occasions = set(item.get("occasions", []))
        if not item_occasions.intersection(exp_set):
            failures.append(
                f"{slot} ({item.get('type')}) has occasions={list(item_occasions)}, "
                f"none in expected={expected_occasions}"
            )

    passed = len(failures) == 0
    detail = "all items match" if passed else "; ".join(failures)
    return CheckResult("occasion_match", passed, detail)

def check_temperature_match(outfit: dict, expected_temp_label: Optional[str]) -> CheckResult:
    if expected_temp_label is None:
        return CheckResult("temperature_match", True, "skipped")

    failures = []
    for slot, item in outfit.items():
        if item is None:
            continue
        item_temps = item.get("temperatures", [])
        if expected_temp_label not in item_temps:
            failures.append(
                f"{slot} ({item.get('type')}) temps={item_temps}, "
                f"missing '{expected_temp_label}'"
            )

    passed = len(failures) == 0
    detail = "all items match" if passed else "; ".join(failures)
    return CheckResult("temperature_match", passed, detail)

def check_preference_match(outfit: dict, preferences: Optional[dict]) -> CheckResult:
    if not preferences:
        return CheckResult("preference_match", True, "skipped (no preferences)")

    failures = []

    for slot, pref in preferences.items():
        if not pref:
            continue
        item = outfit.get(slot)
        if not item:
            continue

        # Check type
        if pref.get("type") and item.get("type") != pref["type"]:
            failures.append(f"{slot} type mismatch (expected {pref['type']}, got {item.get('type')})")

        # Check colors
        if pref.get("colors"):
            item_colors = item.get("colors", [])
            if not any(c in item_colors for c in pref["colors"]):
                failures.append(f"{slot} color mismatch (expected {pref['colors']}, got {item_colors})")

    passed = len(failures) == 0
    detail = "preferences satisfied" if passed else "; ".join(failures)

    return CheckResult("preference_match", passed, detail)

# ---------------------------------------------------------------------------
# Run a single test case
# ---------------------------------------------------------------------------

def run_case(tc: dict) -> CaseResult:
    case_id     = tc["id"]
    description = tc["description"]
    group       = tc.get("_group", "")
    weather     = tc["weather_data"]
    context     = tc["context"]
    expected    = tc["expected"]

    try:
        data, elapsed_ms = _call_api(weather, context)
    except requests.HTTPError as e:
        msg = f"HTTP {e.response.status_code}: {e.response.text[:200]}"
        return CaseResult(case_id=case_id, description=description, group=group,
                          passed=False, response_ms=0, error=msg)
    except Exception as e:
        return CaseResult(case_id=case_id, description=description, group=group,
                          passed=False, response_ms=0, error=str(e))

    outfit = data.get("outfit", {})
    checks = [
        check_outfit_complete(outfit),
        check_outerwear_rule(outfit, expected["outerwear_rule"], weather["temperature"]),
        check_reason_present(data),
        check_occasion_match(outfit, expected.get("occasion_match")),
        check_temperature_match(outfit, expected.get("temperature_match")),
        check_preference_match(outfit, tc.get("item_preferences"))
    ]

    all_passed = all(c.passed for c in checks)
    return CaseResult(case_id=case_id, description=description, group=group,
                      passed=all_passed, response_ms=elapsed_ms, checks=checks)

# ---------------------------------------------------------------------------
# Run all tests
# ---------------------------------------------------------------------------

def run_all_tests() -> List[CaseResult]:
    results = []
    for tc in TEST_CASES:
        case_id = tc["id"]
        print(f"\n  [{case_id}] {tc['description']}")
        print(f"    weather : {tc['weather_data']['temperature']}°C  "
              f"{tc['weather_data']['description']}")
        print(f"    context : {tc['context'] or '(empty)'}")

        result = run_case(tc)

        if result.error:
            print(f"    [FAIL] Error — {result.error}")
        else:
            print(f"    Response time : {result.response_ms:.0f} ms")
            for c in result.checks:
                status = "PASS" if c.passed else "FAIL"
                print(f"    [{status}] {c.name:<20}  {c.detail}")

        results.append(result)
    return results

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

def print_summary(results: List[CaseResult]):
    total  = len(results)
    passed = sum(1 for r in results if r.passed)
    errors = sum(1 for r in results if r.error)
    valid  = [r for r in results if not r.error]
    n      = len(valid) or 1

    # Per-check accuracy
    check_names = ("outfit_complete", "outerwear_rule", "reason_present",
                   "occasion_match", "temperature_match", "preference_match")
    check_pass = {c: 0 for c in check_names}
    for r in valid:
        for c in r.checks:
            if c.passed:
                check_pass[c.name] += 1

    # Per-group accuracy
    groups: Dict[str, List[CaseResult]] = {}
    for r in results:
        key = r.group.split("—")[0].strip() if "—" in r.group else r.group
        groups.setdefault(key, []).append(r)

    avg_ms = sum(r.response_ms for r in valid) / n
    min_ms = min((r.response_ms for r in valid), default=0)
    max_ms = max((r.response_ms for r in valid), default=0)

    print("\n" + "=" * 68)
    print("  RECOMMENDATION TEST SUMMARY")
    print("=" * 68)
    print(f"  Total cases            : {total}")
    print(f"  Errors / skipped       : {errors}")
    print(f"  Overall pass           : {passed}/{total}  ({passed/total*100:.1f}%)")
    print(f"\n  Response time  avg={avg_ms:.0f}ms  min={min_ms:.0f}ms  max={max_ms:.0f}ms")

    print(f"\n  {'Check':<22}  {'Pass rate':>10}")
    print(f"  {'-'*22}  {'-'*10}")
    for c in check_names:
        rate = check_pass[c] / n * 100
        print(f"  {c:<22}  {rate:>9.1f}%")

    print(f"\n  {'Group':<38}  {'Pass rate':>10}")
    print(f"  {'-'*38}  {'-'*10}")
    for group_key, group_results in groups.items():
        gp = sum(1 for r in group_results if r.passed)
        gt = len(group_results)
        print(f"  {group_key:<38}  {gp}/{gt}  ({gp/gt*100:.0f}%)")

    print("\n  Per-case results:")
    for r in results:
        icon = "PASS" if r.passed else ("ERR" if r.error else "FAIL")
        note = f"  ({r.error})" if r.error else f"  {r.response_ms:.0f}ms"
        print(f"  [{icon}]  {r.case_id:<7}  {r.description}{note}")

    print("=" * 68)

    out_path = Path(__file__).parent / "results/recommendation_results.json"
    with open(out_path, "w") as f:
        json.dump(
            [{
                "case_id":     r.case_id,
                "description": r.description,
                "group":       r.group,
                "passed":      r.passed,
                "response_ms": round(r.response_ms, 1),
                "error":       r.error,
                "checks": [{
                    "name":   c.name,
                    "passed": c.passed,
                    "detail": c.detail,
                } for c in r.checks],
            } for r in results],
            f, indent=2,
        )
    print(f"\n  Full results saved to: {out_path}")

# ---------------------------------------------------------------------------
# pytest integration
# ---------------------------------------------------------------------------

try:
    import pytest

    @pytest.mark.parametrize("tc", TEST_CASES, ids=[t["id"] for t in TEST_CASES])
    def test_recommendation(tc):
        result = run_case(tc)
        if result.error:
            pytest.fail(f"[{result.case_id}] API error: {result.error}")

        failed_checks = [c for c in result.checks if not c.passed]
        if failed_checks:
            msg = "\n".join(f"  {c.name}: {c.detail}" for c in failed_checks)
            pytest.fail(f"[{result.case_id}] {result.description}\n{msg}")

except ImportError:
    pass

# ---------------------------------------------------------------------------
# Standalone entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("\nWardrobe Assistant — Phase 2 Recommendation Tests")
    print(f"Endpoint   : {RECOMMEND_EP}")
    print(f"Test cases : {len(TEST_CASES)} (loaded from {TEST_DATA_FILE.name})")

    if AUTH_TOKEN == "YOUR_FIREBASE_ID_TOKEN_HERE":
        print("\n[ERROR] Set AUTH_TOKEN or export WARDROBE_TOKEN=<token>")
        sys.exit(1)

    results = run_all_tests()
    print_summary(results)
    sys.exit(sum(1 for r in results if not r.passed))