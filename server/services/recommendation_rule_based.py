import uuid
import base64
import random
from typing import List, Dict, Any, Optional, Set

from config.firebase import db
from services.wardrobe import collection_ref as wardrobe_ref
from google.cloud.firestore_v1.base_query import FieldFilter


# ---------------------------------------------------------------------------
# Color compatibility
# ---------------------------------------------------------------------------

COLOR_GROUPS: Dict[str, str] = {
    "Black": "neutral", "White": "neutral", "Gray": "neutral", "Beige": "neutral",
    "Brown": "warm",    "Red":   "warm",    "Orange": "warm",
    "Yellow": "earthy", "Green": "earthy",
    "Blue":   "cool",   "Purple": "cool",   "Pink": "cool",
}

COMPATIBLE_PAIRS = {
    frozenset({"Blue",   "White"}),  frozenset({"Blue",   "Gray"}),
    frozenset({"Blue",   "Beige"}),  frozenset({"Blue",   "Brown"}),
    frozenset({"Black",  "White"}),  frozenset({"Black",  "Red"}),
    frozenset({"Black",  "Pink"}),   frozenset({"Black",  "Yellow"}),
    frozenset({"Green",  "Beige"}),  frozenset({"Green",  "Brown"}),
    frozenset({"Brown",  "Beige"}),  frozenset({"White",  "Red"}),
    frozenset({"White",  "Pink"}),   frozenset({"White",  "Green"}),
    frozenset({"Gray",   "Blue"}),   frozenset({"Gray",   "Pink"}),
    frozenset({"Gray",   "Purple"}), frozenset({"Beige",  "Brown"}),
    frozenset({"Purple", "Gray"}),
}

CLASHING_PAIRS = {
    frozenset({"Red", "Pink"}),    frozenset({"Red",    "Orange"}),
    frozenset({"Orange", "Purple"}), frozenset({"Yellow", "Purple"}),
    frozenset({"Green", "Red"}),
}


def color_pair_score(a: str, b: str) -> float:
    pair = frozenset({a, b})
    if a == b:                         return 0.6
    if pair in CLASHING_PAIRS:         return -1.0
    if pair in COMPATIBLE_PAIRS:       return 1.0
    if "neutral" in (COLOR_GROUPS.get(a), COLOR_GROUPS.get(b)): return 0.8
    if COLOR_GROUPS.get(a) == COLOR_GROUPS.get(b):              return 0.5
    return 0.0


def item_color_harmony(item_colors: List[str], chosen_colors: List[str]) -> float:
    if not chosen_colors or not item_colors:
        return 0.0
    scores = [color_pair_score(ic, cc) for ic in item_colors for cc in chosen_colors]
    return sum(scores) / len(scores)


# ---------------------------------------------------------------------------
# Temperature
# ---------------------------------------------------------------------------

def weather_to_temp_label(t: float) -> str:
    if t >= 25: return "Hot"
    if t >= 15: return "Mild"
    return "Cold"


def temp_score(item_temperatures: List[str], label: str) -> float:
    return 1.0 if label in item_temperatures else 0.0


# ---------------------------------------------------------------------------
# Occasion
# ---------------------------------------------------------------------------

OCCASION_KEYWORDS: Dict[str, List[str]] = {
    "Formal":       ["formal", "interview", "suit", "gala", "ceremony", "dinner", "wedding", "black tie"],
    "Work":         ["work", "office", "meeting", "presentation", "conference", "business"],
    "Smart casual": ["smart casual", "smart-casual", "brunch", "lunch", "date", "semi"],
    "Party":        ["party", "club", "night out", "celebration", "birthday", "bar"],
    "Sportswear":   ["gym", "sport", "workout", "run", "running", "exercise", "yoga", "hike", "hiking"],
    "Casual":       ["casual", "errand", "chill", "relaxed", "home", "weekend", "everyday"],
}

OCCASION_BLOCKED_TYPES: Dict[str, List[str]] = {
    "Formal":       ["Shorts", "Flip-flops", "Sandals", "T-shirt", "Hoodie", "Joggers", "Leggings"],
    "Work":         ["Shorts", "Flip-flops", "Joggers", "Leggings"],
    "Smart casual": ["Shorts", "Flip-flops", "Joggers", "Leggings"],
    "Party":        ["Flip-flops", "Joggers", "Leggings"],
    "Sportswear":   ["Blazer", "Formal shoes", "Heels", "Dress", "Suit"],
    "Casual":       [],
}


def infer_occasions(context: str) -> List[str]:
    ctx = context.lower()
    matched = {
        occ: sum(1 for kw in kws if kw in ctx)
        for occ, kws in OCCASION_KEYWORDS.items()
    }
    matched = {o: s for o, s in matched.items() if s > 0}
    return sorted(matched, key=lambda o: matched[o], reverse=True) or ["Casual"]


def occasion_score(item_occasions: List[str], inferred: List[str]) -> float:
    for rank, occ in enumerate(inferred):
        if occ in item_occasions:
            return 1.0 / (rank + 1)
    return 0.0


def is_blocked(item: Dict[str, Any], top_occasion: str) -> bool:
    return item.get("type") in OCCASION_BLOCKED_TYPES.get(top_occasion, [])


# ---------------------------------------------------------------------------
# Per-slot preference scoring
# ---------------------------------------------------------------------------

def slot_preference_score(item: Dict[str, Any], slot_pref: Optional[Dict]) -> float:
    """
    Returns a score in [0, 1] based on how well the item matches the
    explicit per-slot preference (colors and/or type) the user requested.
    0.0 means no preference was expressed — neutral, does not penalise.
    """
    if not slot_pref:
        return 0.0

    score = 0.0
    hits  = 0

    # Color match — partial credit: each preferred color found adds to score
    pref_colors: List[str] = slot_pref.get("colors") or []
    if pref_colors:
        item_colors = item.get("colors", [])
        matched = sum(1 for pc in pref_colors if pc in item_colors)
        score += matched / len(pref_colors)   # 0..1
        hits  += 1

    # Type match — binary
    pref_type: Optional[str] = slot_pref.get("type")
    if pref_type:
        score += 1.0 if item.get("type") == pref_type else 0.0
        hits  += 1

    return score / hits if hits else 0.0


# ---------------------------------------------------------------------------
# Weights
# ---------------------------------------------------------------------------

WEIGHT_TEMP        = 0.8
WEIGHT_OCCASION    = 2.0
WEIGHT_COLOR_HARM  = 0.6
WEIGHT_PREFERENCE  = 3.0   # explicit user request wins decisively


def score_item(
    item: Dict[str, Any],
    temp_label: str,
    inferred_occasions: List[str],
    chosen_colors: List[str],
    slot_pref: Optional[Dict],
) -> float:
    return (
        WEIGHT_TEMP       * temp_score(item.get("temperatures", []), temp_label) +
        WEIGHT_OCCASION   * occasion_score(item.get("occasions", []), inferred_occasions) +
        WEIGHT_COLOR_HARM * item_color_harmony(item.get("colors", []), chosen_colors) +
        WEIGHT_PREFERENCE * slot_preference_score(item, slot_pref)
    )


def best_item(
    candidates: List[Dict[str, Any]],
    temp_label: str,
    inferred_occasions: List[str],
    chosen_colors: List[str],
    slot_pref: Optional[Dict],
    top_occasion: str,
    excluded_ids: Set[str],
) -> Optional[Dict[str, Any]]:
    # Remove previously seen items
    pool = [c for c in candidates if c["id"] not in excluded_ids]

    # Hard occasion filter
    allowed = [c for c in pool if not is_blocked(c, top_occasion)]
    pool = allowed if allowed else pool   # fall back if wardrobe is limited

    if not pool:
        return None

    # Add small random jitter to scores so ties never produce the same result
    def jittered_score(item):
        return score_item(item, temp_label, inferred_occasions, chosen_colors, slot_pref) \
               + random.uniform(0, 0.05)

    return max(pool, key=jittered_score)


# ---------------------------------------------------------------------------
# Reason builder
# ---------------------------------------------------------------------------

REASON_TEMPLATES = [
    "A {occasion_adj} outfit in {colors} — perfect for {temp_desc} weather and {context_snippet}.",
    "These {colors} tones work well together and suit the {temp_desc} conditions for {context_snippet}.",
    "A coordinated {occasion_adj} look chosen for {temp_desc} weather and {context_snippet}.",
    "Picked for colour harmony and {occasion_adj} appropriateness given the {temp_desc} forecast.",
]

OCCASION_ADJ  = {"Formal": "formal", "Work": "work-appropriate", "Smart casual": "smart-casual",
                 "Party": "party-ready", "Sportswear": "athletic", "Casual": "casual"}
TEMP_DESC     = {"Hot": "warm", "Mild": "mild", "Cold": "cold"}


def build_reason(items, inferred_occasions, temp_label, context) -> str:
    colors = list(dict.fromkeys(c for item in items for c in item.get("colors", [])))
    top    = inferred_occasions[0] if inferred_occasions else "Casual"
    snippet = " ".join(context.strip().split()[:4]).lower().rstrip(".,;:")
    color_str = colors[0] if len(colors) == 1 \
        else f"{', '.join(colors[:-1])} and {colors[-1]}" if colors else "neutral"
    return random.choice(REASON_TEMPLATES).format(
        occasion_adj=OCCASION_ADJ.get(top, "stylish"),
        colors=color_str,
        temp_desc=TEMP_DESC.get(temp_label, "current"),
        context_snippet=snippet,
    )


# ---------------------------------------------------------------------------
# Wardrobe helpers
# ---------------------------------------------------------------------------

async def get_wardrobe_data(user_id: str) -> List[Dict[str, Any]]:
    try:
        docs = (wardrobe_ref
                .where(filter=FieldFilter("user_id", "==", user_id))
                .select(["category", "type", "colors", "occasions", "temperatures"])
                .get())
        return [_convert_doc(d) for d in docs]
    except Exception as e:
        print(f"Error fetching wardrobe for {user_id}: {e}")
        return []


def _convert_doc(doc) -> Dict[str, Any]:
    d = doc.to_dict()
    return {
        "id":           doc.id,
        "category":     d.get("category"),
        "type":         d.get("type"),
        "colors":       d.get("colors", []),
        "occasions":    d.get("occasions", []),
        "temperatures": d.get("temperatures", []),
    }


async def get_wardrobe_items_images(item_ids: List[str]) -> Dict[str, str]:
    try:
        valid = [i for i in item_ids if i]
        if not valid:
            return {}
        docs = db.get_all([wardrobe_ref.document(i) for i in valid], field_paths=["image"])
        return {
            doc.id: base64.b64encode(doc.to_dict()["image"]).decode()
            for doc in docs
            if doc.exists and doc.to_dict().get("image")
        }
    except Exception as e:
        print(f"Error fetching images: {e}")
        return {}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def get_recommendation(
    user_id: str,
    weather_data: Dict[str, Any],
    context: str,
    item_preferences: Optional[Dict] = None,
    excluded_item_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    print(
        f"Recommendation | user={user_id} | "
        f"{weather_data.get('temperature')}°C | context={context} | "
        f"prefs={item_preferences} | excluded={excluded_item_ids}"
    )

    wardrobe = await get_wardrobe_data(user_id)
    if not wardrobe:
        return {"error": "Wardrobe is empty. Add some clothes first!"}

    temp_c           = float(weather_data.get("temperature", 20))
    temp_label       = weather_to_temp_label(temp_c)
    inferred_occ     = infer_occasions(context)
    top_occasion     = inferred_occ[0]
    excluded         = set(excluded_item_ids or [])
    prefs            = item_preferences or {}

    by_cat: Dict[str, List] = {
        "Topwear": [], "Bottomwear": [], "Footwear": [],
        "Outerwear": [], "One-piece": [],
    }
    for item in wardrobe:
        cat = item.get("category", "")
        if cat in by_cat:
            by_cat[cat].append(item)

    chosen_colors: List[str] = []
    selected: Dict[str, Optional[Dict]] = {}

    def pick(category: str) -> Optional[Dict]:
        return best_item(
            by_cat[category], temp_label, inferred_occ,
            chosen_colors, prefs.get(category.lower()),
            top_occasion, excluded,
        )

    # Topwear
    topwear = pick("Topwear")
    if topwear:
        selected["topwear"] = topwear
        chosen_colors.extend(topwear.get("colors", []))
    elif by_cat["One-piece"]:
        op = pick("One-piece")
        selected["topwear"] = op
        if op:
            chosen_colors.extend(op.get("colors", []))
        selected["bottomwear"] = None

    # Bottomwear
    if "bottomwear" not in selected:
        bw = pick("Bottomwear")
        selected["bottomwear"] = bw
        if bw:
            chosen_colors.extend(bw.get("colors", []))

    # Footwear
    fw = pick("Footwear")
    selected["footwear"] = fw
    if fw:
        chosen_colors.extend(fw.get("colors", []))

    # Outerwear
    selected["outerwear"] = pick("Outerwear") if temp_c < 15 else None

    # Images
    ids = [v["id"] for v in selected.values() if v]
    images_map = await get_wardrobe_items_images(ids)

    def assemble(item):
        if not item:
            return None
        item["image"] = images_map.get(item["id"])
        return item

    non_null = [v for v in selected.values() if v]
    return {
        "id": str(uuid.uuid4()),
        "outfit": {
            "topwear":    assemble(selected.get("topwear")),
            "bottomwear": assemble(selected.get("bottomwear")),
            "footwear":   assemble(selected.get("footwear")),
            "outerwear":  assemble(selected.get("outerwear")),
        },
        "reason": build_reason(non_null, inferred_occ, temp_label, context),
    }