import json
from pathlib import Path
from collections import defaultdict

# -----------------------------------------------------------
# FILE PATHS
# -----------------------------------------------------------

BASE = Path("results")

FILES = {
    "recommendation": BASE / "recommendation_results.json",
    "chat": BASE / "chat_results.json",
    "classification": BASE / "classification_results.json"
}

# -----------------------------------------------------------
# GENERIC ANALYSIS
# -----------------------------------------------------------

def analyze_common(results, is_chat=False):
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    errors = sum(1 for r in results if r.get("error"))

    valid = [r for r in results if not r.get("error")]
    n = len(valid) or 1

    print(f"Total test cases     : {total}")
    print(f"Passed               : {passed}")
    print(f"Failed               : {total - passed}")
    print(f"Errors               : {errors}")
    print(f"Pass rate            : {passed/total*100:.2f}%")

    # ---------------- RESPONSE TIME ----------------

    if is_chat:
        times = [r["total_elapsed_ms"] for r in valid]
    else:
        times = [r.get("response_ms", 0) for r in valid if "response_ms" in r]

    if times:
        print("\nResponse Time:")
        print(f"  Avg                : {sum(times)/len(times):.2f} ms")
        print(f"  Min                : {min(times):.2f} ms")
        print(f"  Max                : {max(times):.2f} ms")

    return valid


# -----------------------------------------------------------
# CHECK-LEVEL ANALYSIS
# -----------------------------------------------------------

def analyze_checks(valid):
    stats = defaultdict(lambda: {"pass": 0, "total": 0})

    for r in valid:
        for c in r.get("checks", []):
            stats[c["name"]]["total"] += 1
            if c["passed"]:
                stats[c["name"]]["pass"] += 1

    print("\nPer-check Accuracy:")
    for name, s in stats.items():
        rate = s["pass"] / s["total"] * 100
        print(f"  {name:<30} {s['pass']}/{s['total']} ({rate:.1f}%)")


# -----------------------------------------------------------
# GROUP ANALYSIS
# -----------------------------------------------------------

def analyze_groups(results):
    groups = defaultdict(lambda: {"pass": 0, "total": 0})

    for r in results:
        g = r.get("group", "Unknown")
        groups[g]["total"] += 1
        if r["passed"]:
            groups[g]["pass"] += 1

    print("\nGroup-wise Accuracy:")
    for g, s in groups.items():
        rate = s["pass"] / s["total"] * 100
        print(f"  {g:<30} {s['pass']}/{s['total']} ({rate:.1f}%)")


# -----------------------------------------------------------
# CLASSIFICATION-SPECIFIC ANALYSIS
# -----------------------------------------------------------

def analyze_classification(results):
    print("\n--- Classification Metrics ---")

    label_accuracy = []
    extra_labels = 0
    missing_labels = 0

    for r in results:
        for c in r.get("checks", []):
            if c["name"] == "label_match":
                if c["passed"]:
                    label_accuracy.append(1)
                else:
                    label_accuracy.append(0)

            if c["name"] == "extra_labels":
                if not c["passed"]:
                    extra_labels += 1

            if c["name"] == "missing_labels":
                if not c["passed"]:
                    missing_labels += 1

    if label_accuracy:
        acc = sum(label_accuracy) / len(label_accuracy) * 100
        print(f"Label Accuracy        : {acc:.2f}%")

    print(f"Cases with extra labels   : {extra_labels}")
    print(f"Cases with missing labels : {missing_labels}")


# -----------------------------------------------------------
# FAILURE REPORT
# -----------------------------------------------------------

def analyze_failures(results):
    print("\nFailed Test Cases:")

    for r in results:
        if not r.get("passed", False):

            case_id = r.get("case_id") or r.get("id") or "UNKNOWN"

            description = (
                r.get("description")
                or r.get("input")
                or r.get("text")
                or "No description"
            )

            print(f"  [{case_id}] {description}")


# -----------------------------------------------------------
# MAIN DRIVER
# -----------------------------------------------------------

def run_analysis(name, path):
    if not path.exists():
        print(f"\n[WARNING] {name} file not found: {path}")
        return

    with open(path) as f:
        results = json.load(f)

    print("\n" + "=" * 70)
    print(f" ANALYSIS: {name.upper()}")
    print("=" * 70)

    if name == "chat":
        valid = analyze_common(results, is_chat=True)
    else:
        valid = analyze_common(results, is_chat=False)

    analyze_checks(valid)
    analyze_groups(results)

    if name == "classification":
        analyze_classification(results)

    analyze_failures(results)

    print("=" * 70)


# -----------------------------------------------------------
# ENTRY
# -----------------------------------------------------------

if __name__ == "__main__":
    for name, path in FILES.items():
        run_analysis(name, path)