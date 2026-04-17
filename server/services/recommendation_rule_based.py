import uuid
import base64
import random
from typing import List, Dict, Any, Optional

from config.firebase import db
from services.wardrobe import collection_ref as wardrobe_ref
from google.cloud.firestore_v1.base_query import FieldFilter


# ---------------------------------------------------------------------------
# Color compatibility matrix
# ---------------------------------------------------------------------------
# Groups: neutral, warm, cool, earthy
# A pair (a, b) is compatible if they share a group OR appear in COMPATIBLE_PAIRS.

COLOR_GROUPS: Dict[str, str] = {
    "Black":  "neutral",
    "White":  "neutral",
    "Gray":   "neutral",
    "Beige":  "neutral",
    "Brown":  "warm",
    "Red":    "warm",
    "Orange": "warm",
    "Yellow": "earthy",
    "Green":  "earthy",
    "Blue":   "cool",
    "Purple": "cool",
    "Pink":   "cool",
}

# Explicitly good cross-group pairings (order-independent)
COMPATIBLE_PAIRS = {
    frozenset({"Blue",   "White"}),
    frozenset({"Blue",   "Gray"}),
    frozenset({"Blue",   "Beige"}),
    frozenset({"Blue",   "Brown"}),
    frozenset({"Navy",   "White"}),
    frozenset({"Black",  "White"}),
    frozenset({"Black",  "Red"}),
    frozenset({"Black",  "Pink"}),
    frozenset({"Black",  "Yellow"}),
    frozenset({"Green",  "Beige"}),
    frozenset({"Green",  "Brown"}),
    frozenset({"Brown",  "Beige"}),
    frozenset({"White",  "Red"}),
    frozenset({"White",  "Pink"}),
    frozenset({"White",  "Green"}),
    frozenset({"Gray",   "Blue"}),
    frozenset({"Gray",   "Pink"}),
    frozenset({"Gray",   "Purple"}),
    frozenset({"Beige",  "Brown"}),
    frozenset({"Purple", "Gray"}),
}

# Pairs that actively clash
CLASHING_PAIRS = {
    frozenset({"Red",    "Pink"}),
    frozenset({"Red",    "Orange"}),
    frozenset({"Orange", "Purple"}),
    frozenset({"Yellow", "Purple"}),
    frozenset({"Green",  "Red"}),
    frozenset({"Brown",  "Black"}),   # not a clash per se but tends to look heavy
}


def color_pair_score(color_a: str, color_b: str) -> float:
    """
    Returns a score in [-1, 1] for how well two colors pair together.
      1.0  = explicitly compatible
      0.5  = same color group (analogous)
      0.0  = no strong opinion either way
     -1.0  = explicitly clashing
    """
    pair = frozenset({color_a, color_b})
    if pair in CLASHING_PAIRS:
        return -1.0
    if pair in COMPATIBLE_PAIRS:
        return 1.0
    # Neutral colors go with anything
    if COLOR_GROUPS.get(color_a) == "neutral" or COLOR_GROUPS.get(color_b) == "neutral":
        return 0.8
    # Same group
    if COLOR_GROUPS.get(color_a) == COLOR_GROUPS.get(color_b):
        return 0.5
    return 0.0


def item_color_harmony(item_colors: List[str], chosen_colors: List[str]) -> float:
    """
    Average pairwise score between an item's colors and all already-chosen colors.
    Returns 0 if there are no chosen colors yet (nothing to compare against).
    """
    if not chosen_colors or not item_colors:
        return 0.0
    scores = [
        color_pair_score(ic, cc)
        for ic in item_colors
        for cc in chosen_colors
    ]
    return sum(scores) / len(scores)


# ---------------------------------------------------------------------------
# Temperature mapping
# ---------------------------------------------------------------------------

def weather_to_temp_label(temperature_c: float) -> str:
    if temperature_c >= 25:
        return "Hot"
    if temperature_c >= 15:
        return "Mild"
    return "Cold"


def temp_score(item_temperatures: List[str], temp_label: str) -> float:
    """1.0 if the item suits the weather, 0.0 otherwise."""
    return 1.0 if temp_label in item_temperatures else 0.0


# ---------------------------------------------------------------------------
# Occasion / context matching
# ---------------------------------------------------------------------------

# Maps keywords that might appear in context → canonical occasion labels
OCCASION_KEYWORDS: Dict[str, List[str]] = {
    "Formal":       ["formal", "interview", "suit", "gala", "ceremony", "dinner", "wedding", "black tie"],
    "Work":         ["work", "office", "meeting", "presentation", "conference", "business"],
    "Smart casual": ["smart casual", "smart-casual", "brunch", "lunch", "date", "semi"],
    "Party":        ["party", "club", "night out", "celebration", "birthday", "bar"],
    "Sportswear":   ["gym", "sport", "workout", "run", "running", "exercise", "yoga", "hike", "hiking"],
    "Casual":       ["casual", "errand", "chill", "relaxed", "home", "weekend", "everyday"],
}

# Formality weights used when no keyword matches — biases toward Casual
OCCASION_FORMALITY: Dict[str, float] = {
    "Formal":       1.0,
    "Work":         0.8,
    "Smart casual": 0.6,
    "Party":        0.5,
    "Casual":       0.3,
    "Sportswear":   0.2,
}


def infer_occasions(context: str) -> List[str]:
    """
    Returns a ranked list of occasion labels inferred from the context string.
    Falls back to ["Casual"] if nothing matches.
    """
    context_lower = context.lower()
    matched: Dict[str, int] = {}
    for occasion, keywords in OCCASION_KEYWORDS.items():
        hits = sum(1 for kw in keywords if kw in context_lower)
        if hits:
            matched[occasion] = hits
    if not matched:
        return ["Casual"]
    # Sort by number of keyword hits, descending
    return sorted(matched, key=lambda o: matched[o], reverse=True)


def occasion_score(item_occasions: List[str], inferred_occasions: List[str]) -> float:
    """
    Score in [0, 1] based on overlap between item's occasion tags and inferred occasions.
    First match in the ranked list carries more weight.
    """
    if not inferred_occasions:
        return 0.0
    for rank, occ in enumerate(inferred_occasions):
        if occ in item_occasions:
            return 1.0 / (rank + 1)   # 1.0 for rank-0, 0.5 for rank-1, etc.
    return 0.0


# ---------------------------------------------------------------------------
# Core scoring
# ---------------------------------------------------------------------------

WEIGHT_TEMP    = 1.0
WEIGHT_OCCASION = 1.5
WEIGHT_COLOR   = 0.8


def score_item(
    item: Dict[str, Any],
    temp_label: str,
    inferred_occasions: List[str],
    chosen_colors: List[str],
) -> float:
    t = temp_score(item.get("temperatures", []), temp_label)
    o = occasion_score(item.get("occasions", []), inferred_occasions)
    c = item_color_harmony(item.get("colors", []), chosen_colors)
    return WEIGHT_TEMP * t + WEIGHT_OCCASION * o + WEIGHT_COLOR * c


def best_item(
    candidates: List[Dict[str, Any]],
    temp_label: str,
    inferred_occasions: List[str],
    chosen_colors: List[str],
    *,
    shuffle: bool = True,
) -> Optional[Dict[str, Any]]:
    """
    Return the highest-scoring item from candidates.
    shuffle=True breaks ties randomly (adds variety to repeated requests).
    """
    if not candidates:
        return None
    if shuffle:
        candidates = random.sample(candidates, len(candidates))
    return max(
        candidates,
        key=lambda item: score_item(item, temp_label, inferred_occasions, chosen_colors),
    )


# ---------------------------------------------------------------------------
# Reason builder
# ---------------------------------------------------------------------------

REASON_TEMPLATES = [
    "A {occasion_adj} outfit in {colors} — perfect for {temp_desc} weather and {context_snippet}.",
    "These {colors} tones work well together and suit the {temp_desc} conditions for {context_snippet}.",
    "A coordinated {occasion_adj} look chosen for {temp_desc} weather and {context_snippet}.",
    "Picked for colour harmony and {occasion_adj} appropriateness given the {temp_desc} forecast.",
]

OCCASION_ADJ: Dict[str, str] = {
    "Formal":       "formal",
    "Work":         "work-appropriate",
    "Smart casual": "smart-casual",
    "Party":        "party-ready",
    "Sportswear":   "athletic",
    "Casual":       "casual",
}

TEMP_DESC: Dict[str, str] = {
    "Hot":  "warm",
    "Mild": "mild",
    "Cold": "cold",
}


def build_reason(
    selected_items: List[Dict[str, Any]],
    inferred_occasions: List[str],
    temp_label: str,
    context: str,
) -> str:
    all_colors: List[str] = []
    for item in selected_items:
        all_colors.extend(item.get("colors", []))
    unique_colors = list(dict.fromkeys(all_colors))   # preserve order, dedupe

    top_occasion = inferred_occasions[0] if inferred_occasions else "Casual"
    occ_adj = OCCASION_ADJ.get(top_occasion, "stylish")
    temp_desc = TEMP_DESC.get(temp_label, "current")

    # Shorten context to a readable snippet (max ~4 words)
    words = context.strip().split()
    context_snippet = " ".join(words[:4]).lower().rstrip(".,;:")

    color_str = (
        unique_colors[0] if len(unique_colors) == 1
        else f"{', '.join(unique_colors[:-1])} and {unique_colors[-1]}"
        if unique_colors else "neutral"
    )

    template = random.choice(REASON_TEMPLATES)
    return template.format(
        occasion_adj=occ_adj,
        colors=color_str,
        temp_desc=temp_desc,
        context_snippet=context_snippet,
    )


# ---------------------------------------------------------------------------
# Wardrobe data helpers  (mirrors original)
# ---------------------------------------------------------------------------

async def get_wardrobe_data(user_id: str) -> List[Dict[str, Any]]:
    try:
        docs = (
            wardrobe_ref
            .where(filter=FieldFilter("user_id", "==", user_id))
            .select(["category", "type", "colors", "occasions", "temperatures"])
            .get()
        )
        return [_convert_doc(doc) for doc in docs]
    except Exception as e:
        print(f"Error fetching wardrobe for {user_id}: {e}")
        return []


def _convert_doc(doc) -> Dict[str, Any]:
    data = doc.to_dict()
    return {
        "id":           doc.id,
        "category":     data.get("category"),
        "type":         data.get("type"),
        "colors":       data.get("colors", []),
        "occasions":    data.get("occasions", []),
        "temperatures": data.get("temperatures", []),
    }


async def get_wardrobe_items_images(item_ids: List[str]) -> Dict[str, str]:
    try:
        valid_ids = [i for i in item_ids if i]
        if not valid_ids:
            return {}
        doc_refs = [wardrobe_ref.document(i) for i in valid_ids]
        docs = db.get_all(doc_refs, field_paths=["image"])
        images_map: Dict[str, str] = {}
        for doc in docs:
            if doc.exists:
                img_bytes = doc.to_dict().get("image")
                if img_bytes:
                    images_map[doc.id] = base64.b64encode(img_bytes).decode("utf-8")
        return images_map
    except Exception as e:
        print(f"Error fetching images: {e}")
        return {}


# ---------------------------------------------------------------------------
# Public API  (same signature as the original)
# ---------------------------------------------------------------------------

async def get_recommendation(
    user_id: str,
    weather_data: Dict[str, Any],
    context: str,
) -> Dict[str, Any]:
    print(
        f"Getting recommendation for user {user_id} | "
        f"{weather_data.get('temperature')}°C {weather_data.get('description')} | "
        f"context: {context}"
    )

    wardrobe = await get_wardrobe_data(user_id)
    if not wardrobe:
        return {"error": "Wardrobe is empty. Add some clothes first!"}

    temperature_c: float = float(weather_data.get("temperature", 20))
    temp_label = weather_to_temp_label(temperature_c)
    inferred_occasions = infer_occasions(context)
    needs_outerwear = temperature_c < 15

    # Bucket items by category
    by_category: Dict[str, List[Dict[str, Any]]] = {
        "Topwear":    [],
        "Bottomwear": [],
        "Footwear":   [],
        "Outerwear":  [],
        "One-piece":  [],
    }
    for item in wardrobe:
        cat = item.get("category", "")
        if cat in by_category:
            by_category[cat].append(item)

    chosen_colors: List[str] = []
    selected: Dict[str, Optional[Dict[str, Any]]] = {}

    # --- Topwear (or One-piece fallback) ---
    topwear = best_item(by_category["Topwear"], temp_label, inferred_occasions, chosen_colors)
    if topwear:
        selected["topwear"] = topwear
        chosen_colors.extend(topwear.get("colors", []))
    elif by_category["One-piece"]:
        # One-piece covers top + bottom; skip bottomwear selection
        one_piece = best_item(by_category["One-piece"], temp_label, inferred_occasions, chosen_colors)
        selected["topwear"] = one_piece   # surface under "topwear" key for compatibility
        if one_piece:
            chosen_colors.extend(one_piece.get("colors", []))
        selected["bottomwear"] = None

    # --- Bottomwear (skip if one-piece was chosen) ---
    if "bottomwear" not in selected:
        bottomwear = best_item(by_category["Bottomwear"], temp_label, inferred_occasions, chosen_colors)
        selected["bottomwear"] = bottomwear
        if bottomwear:
            chosen_colors.extend(bottomwear.get("colors", []))

    # --- Footwear ---
    footwear = best_item(by_category["Footwear"], temp_label, inferred_occasions, chosen_colors)
    selected["footwear"] = footwear
    if footwear:
        chosen_colors.extend(footwear.get("colors", []))

    # --- Outerwear (only when cold) ---
    if needs_outerwear:
        outerwear = best_item(by_category["Outerwear"], temp_label, inferred_occasions, chosen_colors)
        selected["outerwear"] = outerwear
    else:
        selected["outerwear"] = None

    # --- Fetch images for selected items ---
    selected_ids = [item["id"] for item in selected.values() if item]
    images_map = await get_wardrobe_items_images(selected_ids)

    def assemble_item(item: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not item:
            return None
        item["image"] = images_map.get(item["id"])
        return item

    non_null_selected = [v for v in selected.values() if v]
    reason = build_reason(non_null_selected, inferred_occasions, temp_label, context)

    return {
        "id": str(uuid.uuid4()),
        "outfit": {
            "topwear":    assemble_item(selected.get("topwear")),
            "bottomwear": assemble_item(selected.get("bottomwear")),
            "footwear":   assemble_item(selected.get("footwear")),
            "outerwear":  assemble_item(selected.get("outerwear")),
        },
        "reason": reason,
    }