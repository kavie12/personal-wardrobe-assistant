"""
Phase 3 – Chat assistant & end-to-end pipeline tests
======================================================
Tests POST /assistant/chat and (for pipeline cases) POST /recommendation/get-recommendation.

Two test modes:
  Chat-only  (CH-01 to CH-17):
      Drives a multi-turn conversation by sending each turn in sequence.
      Calls POST /assistant/reset before each test to get a clean session.
      Evaluates the final ready response for correctness.

  Pipeline   (CH-18 to CH-20):
      Same as chat-only, but after ready_to_generate is true the script
      assembles the fullContext string (matching client logic) and calls the
      recommendation endpoint, then evaluates the outfit returned.

Test cases are loaded from test_chat_cases.json.

Usage:
    pytest test_chat.py -v
    python test_chat.py
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
CHAT_EP        = f"{BASE_URL}/assistant/chat"
RESET_EP       = f"{BASE_URL}/assistant/reset"
RECOMMEND_EP   = f"{BASE_URL}/recommendation/get-recommendation"
AUTH_TOKEN     = os.environ.get("AUTH_TOKEN", "YOUR_FIREBASE_ID_TOKEN_HERE")
TEST_DATA_FILE = Path(__file__).parent / "data/test_chat_cases.json"

ALLOWED_FORMALITY = {"Casual", "Smart casual", "Formal", "Sportswear", "Party", "Work"}

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
    name:   str
    passed: bool
    detail: str

@dataclass
class TurnLog:
    turn:       int
    message:    str
    response:   dict
    elapsed_ms: float

@dataclass
class CaseResult:
    case_id:          str
    description:      str
    group:            str
    passed:           bool
    turns_taken:      int
    total_elapsed_ms: float
    checks:           List[CheckResult] = field(default_factory=list)
    turn_log:         List[TurnLog]     = field(default_factory=list)
    error:            Optional[str]     = None

# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def _headers() -> dict:
    return {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type":  "application/json",
    }

def _reset_chat() -> None:
    requests.post(RESET_EP, headers=_headers(), timeout=10).raise_for_status()

def _send_message(message: str) -> tuple[dict, float]:
    t0   = time.perf_counter()
    resp = requests.post(CHAT_EP, json={"message": message},
                         headers=_headers(), timeout=30)
    ms   = (time.perf_counter() - t0) * 1000
    resp.raise_for_status()
    return resp.json(), ms

def _get_recommendation(weather_data: dict, full_context: str) -> tuple[dict, float]:
    t0   = time.perf_counter()
    resp = requests.post(RECOMMEND_EP,
                         json={"weather_data": weather_data, "context": full_context},
                         headers=_headers(), timeout=30)
    ms   = (time.perf_counter() - t0) * 1000
    resp.raise_for_status()
    return resp.json(), ms

# ---------------------------------------------------------------------------
# Chat checks
# ---------------------------------------------------------------------------

def check_reaches_ready(reached: bool) -> CheckResult:
    return CheckResult(
        "reaches_ready",
        reached,
        "ready_to_generate became true" if reached else "never reached ready_to_generate=true",
    )

def check_context_not_null(response: dict) -> CheckResult:
    missing = [f for f in ("context", "time", "formality") if not response.get(f)]
    passed  = len(missing) == 0
    detail  = "all fields present" if passed else f"null fields: {missing}"
    return CheckResult("context_not_null", passed, detail)

def check_formality_valid(response: dict) -> CheckResult:
    formality = response.get("formality", "")
    passed    = formality in ALLOWED_FORMALITY
    detail    = f"'{formality}'" if passed else f"'{formality}' not in allowed values"
    return CheckResult("formality_valid", passed, detail)

def check_formality_match(response: dict, expected: Optional[str]) -> CheckResult:
    if not expected:
        return CheckResult("formality_match", True, "skipped (no expected formality set)")
    actual = response.get("formality", "")
    passed = (actual == expected)
    detail = f"got '{actual}'" if passed else f"expected '{expected}', got '{actual}'"
    return CheckResult("formality_match", passed, detail)

def check_context_keywords(response: dict, keywords: Optional[List[str]]) -> CheckResult:
    if not keywords:
        return CheckResult("context_keywords", True, "skipped")
    context_str = (response.get("context") or "").lower()
    missing     = [kw for kw in keywords if kw.lower() not in context_str]
    passed      = len(missing) == 0
    detail      = f"all keywords found in '{context_str}'" if passed \
                  else f"missing keywords {missing} in context '{context_str}'"
    return CheckResult("context_keywords", passed, detail)

def check_turns(taken: int, expected: int) -> CheckResult:
    passed = (taken <= expected)
    detail = f"took {taken} turn(s), expected {expected}"
    return CheckResult("no_unnecessary_turns", passed, detail)

# ---------------------------------------------------------------------------
# Pipeline checks
# ---------------------------------------------------------------------------

def check_pipeline(outfit_data: dict, pipeline_checks: dict) -> List[CheckResult]:
    results = []
    outfit  = outfit_data.get("outfit", {})

    if "outfit_complete" in pipeline_checks:
        missing = [k for k in ("topwear", "bottomwear", "footwear") if not outfit.get(k)]
        passed  = len(missing) == 0
        results.append(CheckResult(
            "pipeline_outfit_complete",
            passed,
            "all present" if passed else f"missing: {missing}",
        ))

    if "reason_present" in pipeline_checks:
        reason = outfit_data.get("reason", "")
        passed = isinstance(reason, str) and len(reason.strip()) > 0
        results.append(CheckResult(
            "pipeline_reason_present",
            passed,
            f"reason: '{reason[:80]}'" if passed else "reason missing or empty",
        ))

    if "outerwear_present" in pipeline_checks:
        expected_present = pipeline_checks["outerwear_present"]
        actual_present   = outfit.get("outerwear") is not None
        passed  = (actual_present == expected_present)
        detail  = (f"outerwear {'present' if actual_present else 'absent'} "
                   f"(expected {'present' if expected_present else 'absent'})")
        results.append(CheckResult("pipeline_outerwear", passed, detail))

    return results

# ---------------------------------------------------------------------------
# Run a single test case
# ---------------------------------------------------------------------------

def run_case(tc: dict) -> CaseResult:
    case_id     = tc["id"]
    description = tc["description"]
    group       = tc.get("_group", "")
    turns       = tc["turns"]
    expected    = tc["expected"]
    max_turns   = expected.get("max_turns", 5)

    try:
        _reset_chat()
    except Exception as e:
        return CaseResult(case_id=case_id, description=description, group=group,
                          passed=False, turns_taken=0, total_elapsed_ms=0,
                          error=f"Reset failed: {e}")

    turn_log:        List[TurnLog] = []
    final_response:  Optional[dict] = None
    reached_ready    = False
    total_elapsed_ms = 0.0

    # Send each scripted turn in sequence; stop early if ready_to_generate fires
    for i, message in enumerate(turns):
        if reached_ready:
            break
        try:
            resp, ms = _send_message(message)
        except Exception as e:
            return CaseResult(case_id=case_id, description=description, group=group,
                              passed=False, turns_taken=i + 1,
                              total_elapsed_ms=total_elapsed_ms,
                              turn_log=turn_log,
                              error=f"Turn {i+1} failed: {e}")

        total_elapsed_ms += ms
        turn_log.append(TurnLog(turn=i + 1, message=message, response=resp, elapsed_ms=ms))
        final_response = resp

        if resp.get("ready_to_generate") is True:
            reached_ready = True

    turns_taken = len(turn_log)

    # Build checks
    checks: List[CheckResult] = [
        check_reaches_ready(reached_ready),
    ]

    if reached_ready and final_response:
        checks += [
            check_context_not_null(final_response),
            check_formality_valid(final_response),
            check_formality_match(final_response, expected.get("expected_formality")),
            check_context_keywords(final_response, expected.get("context_keywords")),
            check_turns(turns_taken, expected.get("expected_turns", max_turns)),
        ]

        # Pipeline — forward extracted context to recommendation endpoint
        if expected.get("run_pipeline") and final_response:
            context    = final_response.get("context",   "")
            time_str   = final_response.get("time",      "")
            formality  = final_response.get("formality", "")
            full_ctx   = f"{context} | {time_str} | {formality}"
            weather    = expected.get("pipeline_weather", {"temperature": 22, "description": "clear"})

            try:
                outfit_data, pipe_ms = _get_recommendation(weather, full_ctx)
                total_elapsed_ms    += pipe_ms
                turn_log.append(TurnLog(
                    turn=turns_taken + 1,
                    message=f"[pipeline] context='{full_ctx}'",
                    response=outfit_data,
                    elapsed_ms=pipe_ms,
                ))
                checks += check_pipeline(outfit_data, expected.get("pipeline_checks", {}))
            except Exception as e:
                checks.append(CheckResult("pipeline_call", False, f"Error: {e}"))

    all_passed = all(c.passed for c in checks)
    return CaseResult(
        case_id=case_id, description=description, group=group,
        passed=all_passed, turns_taken=turns_taken,
        total_elapsed_ms=total_elapsed_ms,
        checks=checks, turn_log=turn_log,
    )

# ---------------------------------------------------------------------------
# Run all
# ---------------------------------------------------------------------------

def run_all_tests() -> List[CaseResult]:
    results = []
    for tc in TEST_CASES:
        print(f"\n  [{tc['id']}] {tc['description']}")
        print(f"    turns   : {len(tc['turns'])}")
        result = run_case(tc)

        if result.error:
            print(f"    [FAIL] Error — {result.error}")
        else:
            print(f"    Total time : {result.total_elapsed_ms:.0f} ms  "
                  f"({result.turns_taken} turn(s))")
            for tl in result.turn_log:
                ready = result.turn_log[-1].response.get("ready_to_generate", False) \
                        if tl == result.turn_log[-1] else False
                prefix = "[pipeline]" if tl.message.startswith("[pipeline]") else f"turn {tl.turn}"
                msg_display = (tl.message[:60] + "…") if len(tl.message) > 60 else tl.message
                print(f"    {prefix:>10} : {msg_display}")
                if not tl.message.startswith("[pipeline]"):
                    print(f"               → ready={tl.response.get('ready_to_generate')}  "
                          f"formality={tl.response.get('formality')}  "
                          f"msg='{(tl.response.get('message') or '')[:60]}'")
            for c in result.checks:
                status = "PASS" if c.passed else "FAIL"
                print(f"    [{status}] {c.name:<30}  {c.detail}")

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

    check_names = (
        "reaches_ready", "context_not_null", "formality_valid",
        "formality_match", "context_keywords", "no_unnecessary_turns",
        "pipeline_outfit_complete", "pipeline_reason_present", "pipeline_outerwear",
    )
    check_pass = {c: 0 for c in check_names}
    check_seen = {c: 0 for c in check_names}
    for r in valid:
        for c in r.checks:
            if c.name in check_pass:
                check_seen[c.name] += 1
                if c.passed:
                    check_pass[c.name] += 1

    groups: Dict[str, List[CaseResult]] = {}
    for r in results:
        key = r.group.split("—")[0].strip() if "—" in r.group else r.group
        groups.setdefault(key, []).append(r)

    avg_ms = sum(r.total_elapsed_ms for r in valid) / n
    avg_turns = sum(r.turns_taken for r in valid) / n

    print("\n" + "=" * 70)
    print("  CHAT ASSISTANT TEST SUMMARY")
    print("=" * 70)
    print(f"  Total cases        : {total}")
    print(f"  Errors / skipped   : {errors}")
    print(f"  Overall pass       : {passed}/{total}  ({passed/total*100:.1f}%)")
    print(f"\n  Avg total time     : {avg_ms:.0f} ms")
    print(f"  Avg turns taken    : {avg_turns:.1f}")

    print(f"\n  {'Check':<32}  {'Pass rate':>10}")
    print(f"  {'-'*32}  {'-'*10}")
    for c in check_names:
        seen = check_seen[c]
        if seen == 0:
            continue
        rate = check_pass[c] / seen * 100
        print(f"  {c:<32}  {check_pass[c]}/{seen} ({rate:.0f}%)")

    print(f"\n  {'Group':<36}  {'Pass rate':>10}")
    print(f"  {'-'*36}  {'-'*10}")
    for group_key, group_results in groups.items():
        gp = sum(1 for r in group_results if r.passed)
        gt = len(group_results)
        print(f"  {group_key:<36}  {gp}/{gt}  ({gp/gt*100:.0f}%)")

    print("\n  Per-case results:")
    for r in results:
        icon = "PASS" if r.passed else ("ERR" if r.error else "FAIL")
        note = (f"  ({r.error})" if r.error
                else f"  {r.turns_taken} turn(s)  {r.total_elapsed_ms:.0f}ms")
        print(f"  [{icon}]  {r.case_id:<7}  {r.description}{note}")
    print("=" * 70)

    out_path = Path(__file__).parent / "results/chat_results.json"
    with open(out_path, "w") as f:
        json.dump(
            [{
                "case_id":          r.case_id,
                "description":      r.description,
                "group":            r.group,
                "passed":           r.passed,
                "turns_taken":      r.turns_taken,
                "total_elapsed_ms": round(r.total_elapsed_ms, 1),
                "error":            r.error,
                "checks": [{
                    "name":   c.name,
                    "passed": c.passed,
                    "detail": c.detail,
                } for c in r.checks],
                "turn_log": [{
                    "turn":       tl.turn,
                    "message":    tl.message,
                    "response":   tl.response,
                    "elapsed_ms": round(tl.elapsed_ms, 1),
                } for tl in r.turn_log],
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
    def test_chat(tc):
        result = run_case(tc)
        if result.error:
            pytest.fail(f"[{result.case_id}] Error: {result.error}")
        failed = [c for c in result.checks if not c.passed]
        if failed:
            msg = "\n".join(f"  {c.name}: {c.detail}" for c in failed)
            pytest.fail(f"[{result.case_id}] {result.description}\n{msg}")

except ImportError:
    pass

# ---------------------------------------------------------------------------
# Standalone entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("\nWardrobe Assistant — Phase 3 Chat Tests")
    print(f"Chat endpoint      : {CHAT_EP}")
    print(f"Reset endpoint     : {RESET_EP}")
    print(f"Recommend endpoint : {RECOMMEND_EP}")
    print(f"Test cases         : {len(TEST_CASES)} (loaded from {TEST_DATA_FILE.name})")

    if AUTH_TOKEN == "YOUR_FIREBASE_ID_TOKEN_HERE":
        print("\n[ERROR] Set AUTH_TOKEN or export WARDROBE_TOKEN=<token>")
        sys.exit(1)

    results = run_all_tests()
    print_summary(results)
    sys.exit(sum(1 for r in results if not r.passed))