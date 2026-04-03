"""
Phase 1 - LLM clothing classification tests
============================================
Test data is loaded from test_images_data.json in the same folder.
Add or edit test cases there without touching this script.

Usage:
    pytest test_classification.py -v          (recommended)
    python test_classification.py             (standalone summary mode)

Authentication:
    export WARDROBE_TOKEN=your_firebase_id_token
    Or edit AUTH_TOKEN below directly.
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
from typing import List, Optional

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_URL       = "http://localhost:8000/api/v1"
WARDROBE_EP    = f"{BASE_URL}/wardrobe/add"
AUTH_TOKEN     = os.environ.get("AUTH_TOKEN", "YOUR_FIREBASE_ID_TOKEN_HERE")
IMAGES_DIR     = Path(__file__).parent / "test_images"
TEST_DATA_FILE = Path(__file__).parent / "test_classification_cases.json"

# ---------------------------------------------------------------------------
# Load test data from JSON
# ---------------------------------------------------------------------------

def _load_test_items() -> dict:
    if not TEST_DATA_FILE.exists():
        raise FileNotFoundError(f"Test data file not found: {TEST_DATA_FILE}")
    with open(TEST_DATA_FILE, "r") as f:
        raw = json.load(f)
    # Strip metadata keys (those starting with "_")
    return {
        filename: {k: v for k, v in labels.items() if not k.startswith("_")}
        for filename, labels in raw.items()
        if not filename.startswith("_")
    }

TEST_ITEMS = _load_test_items()

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class FieldResult:
    field_name:   str
    expected:     object
    predicted:    object
    strict_pass:  bool
    lenient_pass: bool

@dataclass
class ItemResult:
    filename:    str
    passed:      bool
    response_ms: float
    fields:      List[FieldResult] = field(default_factory=list)
    error:       Optional[str] = None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

MULTI_VALUE_FIELDS = {"colors", "occasions", "temperatures"}

def _headers() -> dict:
    return {"Authorization": f"Bearer {AUTH_TOKEN}"}

def _evaluate_field(fname: str, expected, predicted) -> FieldResult:
    if fname in MULTI_VALUE_FIELDS:
        exp_set  = set(expected)  if isinstance(expected,  list) else {expected}
        pred_set = set(predicted) if isinstance(predicted, list) else {predicted}
        strict_pass  = (exp_set == pred_set)
        lenient_pass = exp_set.issubset(pred_set)
    else:
        strict_pass  = (expected == predicted)
        lenient_pass = strict_pass
    return FieldResult(
        field_name=fname, expected=expected, predicted=predicted,
        strict_pass=strict_pass, lenient_pass=lenient_pass,
    )

def _classify_image(image_path: Path) -> tuple[dict, float]:
    with open(image_path, "rb") as f:
        files = {"clothing_item": (image_path.name, f, "image/jpeg")}
        t0 = time.perf_counter()
        resp = requests.post(WARDROBE_EP, files=files, headers=_headers(), timeout=30)
        elapsed_ms = (time.perf_counter() - t0) * 1000
    resp.raise_for_status()
    return resp.json(), elapsed_ms

# ---------------------------------------------------------------------------
# Core test runner
# ---------------------------------------------------------------------------

def run_all_tests() -> List[ItemResult]:
    results = []
    for filename, expected_labels in TEST_ITEMS.items():
        image_path = IMAGES_DIR / filename
        print(f"\n  Testing : {filename}")

        if not image_path.exists():
            print(f"    [SKIP] Image not found: {image_path}")
            results.append(ItemResult(filename=filename, passed=False,
                                      response_ms=0, error="Image file not found"))
            continue

        try:
            data, elapsed_ms = _classify_image(image_path)
        except requests.HTTPError as e:
            msg = f"HTTP {e.response.status_code}: {e.response.text[:200]}"
            print(f"    [FAIL] API error — {msg}")
            results.append(ItemResult(filename=filename, passed=False,
                                      response_ms=0, error=msg))
            continue
        except Exception as e:
            print(f"    [FAIL] Unexpected error — {e}")
            results.append(ItemResult(filename=filename, passed=False,
                                      response_ms=0, error=str(e)))
            continue

        print(f"    Response time : {elapsed_ms:.0f} ms")
        field_results    = []
        all_lenient_pass = True

        for fname in ("category", "type", "colors", "occasions", "temperatures"):
            exp  = expected_labels.get(fname)
            pred = data.get(fname)
            fr   = _evaluate_field(fname, exp, pred)
            field_results.append(fr)
            status = "PASS" if fr.lenient_pass else "FAIL"
            mode   = "(strict)" if fname not in MULTI_VALUE_FIELDS else "(lenient)"
            print(f"    [{status}] {fname:<14} {mode}")
            print(f"           expected  : {exp}")
            print(f"           predicted : {pred}")
            if not fr.lenient_pass:
                all_lenient_pass = False

        results.append(ItemResult(
            filename=filename, passed=all_lenient_pass,
            response_ms=elapsed_ms, fields=field_results,
        ))
    return results

# ---------------------------------------------------------------------------
# Summary report
# ---------------------------------------------------------------------------

def print_summary(results: List[ItemResult]):
    total  = len(results)
    passed = sum(1 for r in results if r.passed)
    errors = sum(1 for r in results if r.error)
    valid  = [r for r in results if not r.error]
    n      = len(valid) or 1

    field_names   = ("category", "type", "colors", "occasions", "temperatures")
    field_strict  = {f: 0 for f in field_names}
    field_lenient = {f: 0 for f in field_names}

    for r in valid:
        for fr in r.fields:
            if fr.strict_pass:  field_strict[fr.field_name]  += 1
            if fr.lenient_pass: field_lenient[fr.field_name] += 1

    avg_ms = sum(r.response_ms for r in valid) / n
    min_ms = min((r.response_ms for r in valid), default=0)
    max_ms = max((r.response_ms for r in valid), default=0)

    print("\n" + "=" * 62)
    print("  CLASSIFICATION TEST SUMMARY")
    print("=" * 62)
    print(f"  Total items tested     : {total}")
    print(f"  Skipped / errors       : {errors}")
    print(f"  Overall pass (lenient) : {passed}/{total}  ({passed/total*100:.1f}%)")
    print(f"\n  Response time  avg={avg_ms:.0f}ms  min={min_ms:.0f}ms  max={max_ms:.0f}ms")
    print(f"\n  {'Field':<14}  {'Strict':>8}  {'Lenient':>8}")
    print(f"  {'-'*14}  {'-'*8}  {'-'*8}")
    for f in field_names:
        s = field_strict[f]  / n * 100
        l = field_lenient[f] / n * 100
        print(f"  {f:<14}  {s:>7.1f}%  {l:>7.1f}%")

    print("\n  Per-image results:")
    for r in results:
        icon = "PASS" if r.passed else ("SKIP" if r.error else "FAIL")
        note = f"  ({r.error})" if r.error else f"  {r.response_ms:.0f}ms"
        print(f"  [{icon}]  {r.filename}{note}")
    print("=" * 62)

    out_path = Path(__file__).parent / "classification_results.json"
    with open(out_path, "w") as f:
        json.dump(
            [{
                "filename":    r.filename,
                "passed":      r.passed,
                "response_ms": round(r.response_ms, 1),
                "error":       r.error,
                "fields": [{
                    "field":        fr.field_name,
                    "expected":     fr.expected,
                    "predicted":    fr.predicted,
                    "strict_pass":  fr.strict_pass,
                    "lenient_pass": fr.lenient_pass,
                } for fr in r.fields],
            } for r in results],
            f, indent=2,
        )
    print(f"\n  Full results saved to: {out_path}")

# ---------------------------------------------------------------------------
# pytest integration
# ---------------------------------------------------------------------------

try:
    import pytest

    @pytest.mark.parametrize("filename,expected_labels", TEST_ITEMS.items())
    def test_classify_item(filename, expected_labels):
        image_path = IMAGES_DIR / filename
        if not image_path.exists():
            pytest.skip(f"Image not found: {image_path}")

        data, elapsed_ms = _classify_image(image_path)

        for fname in ("category", "type", "colors", "occasions", "temperatures"):
            exp  = expected_labels.get(fname)
            pred = data.get(fname)
            fr   = _evaluate_field(fname, exp, pred)
            if fname in MULTI_VALUE_FIELDS:
                assert fr.lenient_pass, (
                    f"{filename} — {fname}: expected {exp} to be a subset of {pred}"
                )
            else:
                assert fr.strict_pass, (
                    f"{filename} — {fname}: expected '{exp}', got '{pred}'"
                )

        if elapsed_ms > 8000:
            pytest.warns(UserWarning,
                         match=f"{filename} took {elapsed_ms:.0f}ms (>8s)")

except ImportError:
    pass

# ---------------------------------------------------------------------------
# Standalone entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("\nWardrobe Assistant — Phase 1 Classification Tests")
    print(f"Endpoint   : {WARDROBE_EP}")
    print(f"Images dir : {IMAGES_DIR}")
    print(f"Test items : {len(TEST_ITEMS)} (loaded from {TEST_DATA_FILE.name})")

    if AUTH_TOKEN == "YOUR_FIREBASE_ID_TOKEN_HERE":
        print("\n[ERROR] Set AUTH_TOKEN or export WARDROBE_TOKEN=<token>")
        sys.exit(1)

    results = run_all_tests()
    print_summary(results)
    sys.exit(sum(1 for r in results if not r.passed))