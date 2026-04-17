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

COMPATIBLE_PAIRS = {
    frozenset({"Blue",   "White"}),
    frozenset({"Blue",   "Gray"}),
    frozenset({"Blue",   "Beige"}),
    frozenset({"Blue",   "Brown"}),
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

CLASHING_PAIRS = {
    frozenset({"Red",    "Pink"}),
    frozenset({"Red",    "Orange"}),
    frozenset({"Orange", "Purple"}),
    frozenset({"Yellow", "Purple"}),
    frozenset({"Green",  "Red"}),
}

# Maps fuzzy user-facing color words → canonical wardrobe color labels
# Supports approximate terms like "blueish", "light blue", "navy", "dark"
COLOR_ALIASES: Dict[str, str] = {
    "black": "Black", "all black": "Black", "dark": "Black",
    "white": "White", "bright": "White", "light": "White",
    "grey": "Gray", "gray": "Gray",
    "beige": "Beige", "cream": "Beige", "nude": "Beige", "tan": "Beige", "khaki": "Beige",
    "brown": "Brown", "chocolate": "Brown", "caramel": "Brown",
    "red": "Red", "crimson": "Red", "burgundy": "Red", "maroon": "Red",
    "orange": "Orange", "rust": "Orange", "terracotta": "Orange",
    "yellow": "Yellow", "mustard": "Yellow", "gold": "Yellow",
    "green": "Green", "olive": "Green", "forest": "Green", "sage": "Green", "mint": "Green",
    "blue": "Blue", "navy": "Blue", "cobalt": "Blue", "denim": "Blue", "teal": "Blue",
    "blueish": "Blue", "bluish": "Blue", "light blue": "Blue", "dark blue": "Blue",
    "purple": "Purple", "violet": "Purple", "lavender": "Purple", "lilac": "Purple",
    "pink": "Pink", "rose": "Pink", "blush": "Pink", "fuchsia": "Pink",
}


def color_pair_score(color_a: str, color_b: str) -> float:
    pair = frozenset({color_a, color_b})
    if color_a == color_b:
        return 0.6   # monochrome is fine but not always ideal
    if pair in CLASHING_PAIRS:
        return -1.0
    if pair in COMPATIBLE_PAIRS:
        return 1.0
    if COLOR_GROUPS.get(color_a) == "neutral" or COLOR_GROUPS.get(color_b) == "neutral":
        return 0.8
    if COLOR_GROUPS.get(color_a) == COLOR_GROUPS.get(color_b):
        return 0.5
    return 0.0


def item_color_harmony(item_colors: List[str], chosen_colors: List[str]) -> float:
    if not chosen_colors or not item_colors:
        return 0.0
    scores = [color_pair_score(ic, cc) for ic in item_colors for cc in chosen_colors]
    return sum(scores) / len(scores)


# ---------------------------------------------------------------------------
# Color preference extraction from context string
# ---------------------------------------------------------------------------

def extract_color_preferences(context: str) -> List[str]:
    """
    Parse canonical color names out of a free-text context string.
    Handles multi-word aliases ("light blue"), suffix forms ("blueish"),
    and the special "all <color>" pattern.
    Longest match wins so "dark blue" beats "blue".
    """
    context_lower = context.lower()
    found: List[str] = []

    # Sort aliases longest-first so multi-word phrases take priority
    for alias, canonical in sorted(COLOR_ALIASES.items(), key=lambda x: -len(x[0])):
        if alias in context_lower and canonical not in found:
            found.append(canonical)

    return found


def preference_score(item_colors: List[str], preferred_colors: List[str]) -> float:
    """
    Returns 1.0 if the item contains at least one preferred color,
    0.0 otherwise. This is intentionally binary — a black shirt fully
    satisfies a "black outfit" request regardless of harmony scores.
    """
    if not preferred_colors:
        return 0.0
    return 1.0 if any(pc in item_colors for pc in preferred_colors) else 0.0


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
    return 1.0 if temp_label in item_temperatures else 0.0


# ---------------------------------------------------------------------------
# Occasion / context matching
# ---------------------------------------------------------------------------

OCCASION_KEYWORDS: Dict[str, List[str]] = {
    "Formal":       ["formal", "interview", "suit", "gala", "ceremony", "dinner", "wedding", "black tie"],
    "Work":         ["work", "office", "meeting", "presentation", "conference", "business"],
    "Smart casual": ["smart casual", "smart-casual", "brunch", "lunch", "date", "semi"],
    "Party":        ["party", "club", "night out", "celebration", "birthday", "bar"],
    "Sportswear":   ["gym", "sport", "workout", "run", "running", "exercise", "yoga", "hike", "hiking"],
    "Casual":       ["casual", "errand", "chill", "relaxed", "home", "weekend", "everyday"],
}

# Items that are too casual for these occasions regardless of temperature
OCCASION_BLOCKED_TYPES: Dict[str, List[str]] = {
    "Formal":       ["Shorts", "Flip-flops", "Sandals", "T-shirt", "Hoodie", "Joggers", "Leggings"],
    "Work":         ["Shorts", "Flip-flops", "Joggers", "Leggings"],
    "Smart casual": ["Shorts", "Flip-flops", "Joggers", "Leggings"],
    "Party":        ["Flip-flops", "Joggers", "Leggings"],
    "Sportswear":   ["Blazer", "Formal shoes", "Heels", "Dress", "Suit"],
    "Casual":       [],
}


def infer_occasions(context: str) -> List[str]:
    context_lower = context.lower()
    matched: Dict[str, int] = {}
    for occasion, keywords in OCCASION_KEYWORDS.items():
        hits = sum(1 for kw in keywords if kw in context_lower)
        if hits:
            matched[occasion] = hits
    if not matched:
        return ["Casual"]
    return sorted(matched, key=lambda o: matched[o], reverse=True)


def occasion_score(item_occasions: List[str], inferred_occasions: List[str]) -> float:
    if not inferred_occasions:
        return 0.0
    for rank, occ in enumerate(inferred_occasions):
        if occ in item_occasions:
            return 1.0 / (rank + 1)
    return 0.0


def is_blocked_for_occasion(item: Dict[str, Any], top_occasion: str) -> bool:
    """Hard filter — removes items whose type is inappropriate for the occasion."""
    blocked = OCCASION_BLOCKED_TYPES.get(top_occasion, [])
    return item.get("type") in blocked


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

# Weights — occasion is the dominant signal; color preference overrides harmony
WEIGHT_TEMP       = 0.8
WEIGHT_OCCASION   = 2.0   # raised: occasion must win over temperature
WEIGHT_COLOR_HARM = 0.6
WEIGHT_PREFERENCE = 2.5   # raised: explicit user request must win


def score_item(
    item: Dict[str, Any],
    temp_label: str,
    inferred_occasions: List[str],
    chosen_colors: List[str],
    preferred_colors: List[str],
) -> float:
    t  = temp_score(item.get("temperatures", []), temp_label)
    o  = occasion_score(item.get("occasions", []), inferred_occasions)
    ch = item_color_harmony(item.get("colors", []), chosen_colors)
    p  = preference_score(item.get("colors", []), preferred_colors)
    return (
        WEIGHT_TEMP       * t  +
        WEIGHT_OCCASION   * o  +
        WEIGHT_COLOR_HARM * ch +
        WEIGHT_PREFERENCE * p
    )


def best_item(
    candidates: List[Dict[str, Any]],
    temp_label: str,
    inferred_occasions: List[str],
    chosen_colors: List[str],
    preferred_colors: List[str],
    top_occasion: str,
    *,
    shuffle: bool = True,
) -> Optional[Dict[str, Any]]:
    # Hard filter first
    allowed = [c for c in candidates if not is_blocked_for_occasion(c, top_occasion)]
    # Fall back to unfiltered if the wardrobe has nothing appropriate
    # (better to show something than nothing)
    pool = allowed if allowed else candidates
    if not pool:
        return None
    if shuffle:
        pool = random.sample(pool, len(pool))
    return max(
        pool,
        key=lambda item: score_item(item, temp_label, inferred_occasions, chosen_colors, preferred_colors),
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
    unique_colors = list(dict.fromkeys(all_colors))

    top_occasion = inferred_occasions[0] if inferred_occasions else "Casual"
    occ_adj = OCCASION_ADJ.get(top_occasion, "stylish")
    temp_desc = TEMP_DESC.get(temp_label, "current")

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
# Wardrobe helpers
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
# Public API
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
    top_occasion = inferred_occasions[0]
    preferred_colors = extract_color_preferences(context)
    needs_outerwear = temperature_c < 15

    if preferred_colors:
        print(f"Color preferences detected: {preferred_colors}")

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

    def pick(category: str) -> Optional[Dict[str, Any]]:
        return best_item(
            by_category[category],
            temp_label,
            inferred_occasions,
            chosen_colors,
            preferred_colors,
            top_occasion,
        )

    # --- Topwear (or One-piece fallback) ---
    topwear = pick("Topwear")
    if topwear:
        selected["topwear"] = topwear
        chosen_colors.extend(topwear.get("colors", []))
    elif by_category["One-piece"]:
        one_piece = pick("One-piece")
        selected["topwear"] = one_piece
        if one_piece:
            chosen_colors.extend(one_piece.get("colors", []))
        selected["bottomwear"] = None

    # --- Bottomwear ---
    if "bottomwear" not in selected:
        bottomwear = pick("Bottomwear")
        selected["bottomwear"] = bottomwear
        if bottomwear:
            chosen_colors.extend(bottomwear.get("colors", []))

    # --- Footwear ---
    footwear = pick("Footwear")
    selected["footwear"] = footwear
    if footwear:
        chosen_colors.extend(footwear.get("colors", []))

    # --- Outerwear ---
    selected["outerwear"] = pick("Outerwear") if needs_outerwear else None

    # --- Images ---
    selected_ids = [item["id"] for item in selected.values() if item]
    images_map = await get_wardrobe_items_images(selected_ids)

    def assemble_item(item: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not item:
            return None
        item["image"] = images_map.get(item["id"])
        return item

    non_null = [v for v in selected.values() if v]
    reason = build_reason(non_null, inferred_occasions, temp_label, context)

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