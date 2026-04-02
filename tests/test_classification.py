"""
Phase 1 - LLM clothing classification tests
============================================
Usage:
    1. Set your Firebase ID token in the AUTH_TOKEN constant below (or pass via
       the WARDROBE_TOKEN environment variable).
    2. Place your test images in the folder defined by IMAGES_DIR.
    3. Fill in / extend TEST_ITEMS with the file names and their expected labels.
    4. Run:  pytest test_classification.py -v
              or
              python test_classification.py          (standalone summary mode)

Each test image is submitted to POST /wardrobe/add.
Results are evaluated in two modes:
  - strict : predicted value must exactly match the expected value.
  - lenient: expected value(s) must be a subset of the predicted value(s).
             Used for multi-value fields (colors, occasions, temperatures)
             because the LLM may correctly add extra valid values.

A final summary table and overall accuracy scores are printed at the end.
"""

import os
import sys
import json
import time
import requests
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Optional

# ---------------------------------------------------------------------------
# Configuration — edit these to match your environment
# ---------------------------------------------------------------------------

BASE_URL    = "http://localhost:8000"          # FastAPI server URL
WARDROBE_EP = f"{BASE_URL}/wardrobe/add"

# Firebase ID token — set here or export WARDROBE_TOKEN=<token> before running
AUTH_TOKEN  = os.environ.get("WARDROBE_TOKEN", "YOUR_FIREBASE_ID_TOKEN_HERE")

# Folder that contains your test clothing images
IMAGES_DIR  = Path(__file__).parent / "test_images"

# ---------------------------------------------------------------------------
# Test data
# ---------------------------------------------------------------------------
# Each entry maps an image filename to its expected classification labels.
#
# Rules for expected values:
#   category   : exactly one string  (strict match)
#   type       : exactly one string  (strict match)
#   colors     : list of strings     (lenient — your list must be a SUBSET of
#                                     the LLM's output, not necessarily equal)
#   occasions  : list of strings     (lenient)
#   temperatures: list of strings    (lenient)
#
# Allowed values mirror ClassificationResponse in wardrobe.py exactly.
# ---------------------------------------------------------------------------

TEST_ITEMS = {
    # ── Topwear ──────────────────────────────────────────────────────────────
    "white_tshirt.jpg": {
        "category":     "Topwear",
        "type":         "T-shirt",
        "colors":       ["White"],
        "occasions":    ["Casual"],
        "temperatures": ["Hot", "Mild"],
    },
    "blue_formal_shirt.jpg": {
        "category":     "Topwear",
        "type":         "Shirt",
        "colors":       ["Blue"],
        "occasions":    ["Formal", "Work"],
        "temperatures": ["Mild"],
    },
    "black_hoodie.jpg": {
        "category":     "Topwear",
        "type":         "Hoodie",
        "colors":       ["Black"],
        "occasions":    ["Casual"],
        "temperatures": ["Cold", "Mild"],
    },
    "grey_blazer.jpg": {
        "category":     "Topwear",
        "type":         "Blazer",
        "colors":       ["Gray"],
        "occasions":    ["Formal", "Work", "Smart casual"],
        "temperatures": ["Mild"],
    },
    "red_polo_shirt.jpg": {
        "category":     "Topwear",
        "type":         "Polo shirt",
        "colors":       ["Red"],
        "occasions":    ["Casual", "Smart casual"],
        "temperatures": ["Hot", "Mild"],
    },

    # ── Bottomwear ───────────────────────────────────────────────────────────
    "blue_jeans.jpg": {
        "category":     "Bottomwear",
        "type":         "Jeans",
        "colors":       ["Blue"],
        "occasions":    ["Casual", "Smart casual"],
        "temperatures": ["Mild", "Cold"],
    },
    "black_trousers.jpg": {
        "category":     "Bottomwear",
        "type":         "Trousers",
        "colors":       ["Black"],
        "occasions":    ["Formal", "Work"],
        "temperatures": ["Mild"],
    },
    "khaki_shorts.jpg": {
        "category":     "Bottomwear",
        "type":         "Shorts",
        "colors":       ["Beige"],
        "occasions":    ["Casual"],
        "temperatures": ["Hot"],
    },
    "black_leggings.jpg": {
        "category":     "Bottomwear",
        "type":         "Leggings",
        "colors":       ["Black"],
        "occasions":    ["Sportswear", "Casual"],
        "temperatures": ["Mild", "Cold"],
    },

    # ── One-piece ─────────────────────────────────────────────────────────────
    "black_dress.jpg": {
        "category":     "One-piece",
        "type":         "Dress",
        "colors":       ["Black"],
        "occasions":    ["Party", "Smart casual", "Formal"],
        "temperatures": ["Hot", "Mild"],
    },
    "floral_jumpsuit.jpg": {
        "category":     "One-piece",
        "type":         "Jumpsuit",
        "colors":       ["White"],
        "occasions":    ["Casual", "Party"],
        "temperatures": ["Hot", "Mild"],
    },

    # ── Footwear ──────────────────────────────────────────────────────────────
    "white_sneakers.jpg": {
        "category":     "Footwear",
        "type":         "Sneakers",
        "colors":       ["White"],
        "occasions":    ["Casual", "Sportswear"],
        "temperatures": ["Hot", "Mild"],
    },
    "black_formal_shoes.jpg": {
        "category":     "Footwear",
        "type":         "Formal shoes",
        "colors":       ["Black"],
        "occasions":    ["Formal", "Work"],
        "temperatures": ["Mild", "Cold"],
    },
    "brown_boots.jpg": {
        "category":     "Footwear",
        "type":         "Boots",
        "colors":       ["Brown"],
        "occasions":    ["Casual", "Smart casual"],
        "temperatures": ["Cold", "Mild"],
    },

    # ── Edge cases ────────────────────────────────────────────────────────────
    # Uncomment and add files as needed
    # "blurry_jacket.jpg": {
    #     "category":     "Topwear",
    #     "type":         "Jacket",
    #     "colors":       ["Black"],
    #     "occasions":    ["Casual"],
    #     "temperatures": ["Cold"],
    # },
    # "patterned_shirt.jpg": {
    #     "category":     "Topwear",
    #     "type":         "Shirt",
    #     "colors":       ["Blue", "White"],
    #     "occasions":    ["Casual", "Smart casual"],
    #     "temperatures": ["Hot", "Mild"],
    # },
}

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class FieldResult:
    field_name:  str
    expected:    object
    predicted:   object
    strict_pass: bool
    lenient_pass: bool

@dataclass
class ItemResult:
    filename:     str
    passed:       bool           # True if all fields pass (lenient mode)
    response_ms:  float
    fields:       List[FieldResult] = field(default_factory=list)
    error:        Optional[str] = None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

MULTI_VALUE_FIELDS = {"colors", "occasions", "temperatures"}

def _headers() -> dict:
    return {"Authorization": f"Bearer {AUTH_TOKEN}"}

def _evaluate_field(fname: str, expected, predicted) -> FieldResult:
    """Compare expected vs predicted for a single field."""
    if fname in MULTI_VALUE_FIELDS:
        exp_set  = set(expected)  if isinstance(expected,  list) else {expected}
        pred_set = set(predicted) if isinstance(predicted, list) else {predicted}
        strict_pass  = exp_set == pred_set
        lenient_pass = exp_set.issubset(pred_set)     # all expected values present
    else:
        strict_pass  = (expected == predicted)
        lenient_pass = strict_pass

    return FieldResult(
        field_name=fname,
        expected=expected,
        predicted=predicted,
        strict_pass=strict_pass,
        lenient_pass=lenient_pass,
    )

def _classify_image(image_path: Path) -> tuple[dict, float]:
    """POST image to /wardrobe/add, return (response_json, elapsed_ms)."""
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

        # Skip missing files gracefully
        if not image_path.exists():
            print(f"    [SKIP] Image file not found: {image_path}")
            results.append(ItemResult(filename=filename, passed=False,
                                      response_ms=0, error="Image file not found"))
            continue

        # Call the API
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

        # Evaluate each field
        field_results = []
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
            filename=filename,
            passed=all_lenient_pass,
            response_ms=elapsed_ms,
            fields=field_results,
        ))

    return results

# ---------------------------------------------------------------------------
# Summary report
# ---------------------------------------------------------------------------

def print_summary(results: List[ItemResult]):
    total    = len(results)
    passed   = sum(1 for r in results if r.passed)
    errors   = sum(1 for r in results if r.error)
    valid    = [r for r in results if not r.error]

    # Per-field accuracy
    field_names = ("category", "type", "colors", "occasions", "temperatures")
    field_strict  = {f: 0 for f in field_names}
    field_lenient = {f: 0 for f in field_names}

    for r in valid:
        for fr in r.fields:
            if fr.strict_pass:
                field_strict[fr.field_name] += 1
            if fr.lenient_pass:
                field_lenient[fr.field_name] += 1

    n = len(valid) or 1   # avoid division by zero

    print("\n" + "=" * 62)
    print("  CLASSIFICATION TEST SUMMARY")
    print("=" * 62)
    print(f"  Images tested          : {total}")
    print(f"  Skipped / errors       : {errors}")
    print(f"  Overall pass (lenient) : {passed}/{total}  "
          f"({passed/total*100:.1f}%)")

    avg_ms = sum(r.response_ms for r in valid) / n if valid else 0
    min_ms = min((r.response_ms for r in valid), default=0)
    max_ms = max((r.response_ms for r in valid), default=0)
    print(f"\n  Response time  avg={avg_ms:.0f}ms  "
          f"min={min_ms:.0f}ms  max={max_ms:.0f}ms")

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

    # Save full results to JSON for thesis evidence
    out_path = Path(__file__).parent / "classification_results.json"
    with open(out_path, "w") as f:
        json.dump(
            [
                {
                    "filename":    r.filename,
                    "passed":      r.passed,
                    "response_ms": round(r.response_ms, 1),
                    "error":       r.error,
                    "fields": [
                        {
                            "field":        fr.field_name,
                            "expected":     fr.expected,
                            "predicted":    fr.predicted,
                            "strict_pass":  fr.strict_pass,
                            "lenient_pass": fr.lenient_pass,
                        }
                        for fr in r.fields
                    ],
                }
                for r in results
            ],
            f,
            indent=2,
        )
    print(f"\n  Full results saved to: {out_path}")

# ---------------------------------------------------------------------------
# pytest integration
# ---------------------------------------------------------------------------
# Each item in TEST_ITEMS becomes an individual pytest test so you can see
# pass/fail per image in pytest's output.

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
                    f"{filename} — {fname}: expected {exp} to be subset of {pred}"
                )
            else:
                assert fr.strict_pass, (
                    f"{filename} — {fname}: expected '{exp}', got '{pred}'"
                )

        # Performance assertion — warn if slow but don't fail the test
        if elapsed_ms > 8000:
            pytest.warns(UserWarning,
                         match=f"{filename} response took {elapsed_ms:.0f}ms (>8s)")

except ImportError:
    pass   # pytest not installed — standalone mode still works

# ---------------------------------------------------------------------------
# Standalone entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("\nWardrobe Assistant — Phase 1 Classification Tests")
    print(f"Endpoint : {WARDROBE_EP}")
    print(f"Images   : {IMAGES_DIR}")
    print(f"Items    : {len(TEST_ITEMS)}")

    if AUTH_TOKEN == "YOUR_FIREBASE_ID_TOKEN_HERE":
        print("\n[ERROR] Set AUTH_TOKEN or export WARDROBE_TOKEN=<token>")
        sys.exit(1)

    results = run_all_tests()
    print_summary(results)

    # Exit with non-zero code if any test failed (useful in CI pipelines)
    failures = sum(1 for r in results if not r.passed)
    sys.exit(failures)