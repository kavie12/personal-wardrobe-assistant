"""
services/recommendation.py
===========================
Filter-based outfit recommendation service.

Supports three generation modes via a unified endpoint:
  Occasion-based : { temperature, occasion }
  Schedule-based : { temperature, occasion }
  Chat-based     : { temperature, occasion, type, color }

Each slot is queried independently from Firestore. One item is chosen at
random from each slot's filtered pool, so the same request can produce
different outfits on repeated calls.

Two-pass fallback
-----------------
If Pass 1 (with type + color hints) returns no results for a slot,
Pass 2 is tried with hints removed. This is transparent to the caller.
"""

import uuid
import base64
import random
from typing import Any, Dict, List, Optional

from config.firebase import db
from services.wardrobe import collection_ref as wardrobe_ref
from google.cloud.firestore_v1.base_query import FieldFilter
from services.recommendation_module.outfit_filters import (
    SlotQuery,
    build_slot_queries,
    OUTERWEAR_TYPES,
    needs_outerwear,
)


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

async def get_recommendation(
    user_id:     str,
    temperature: int,
    occasion:    str,
    type_hints:  Optional[Dict[str, Optional[str]]] = None,
    color_hints: Optional[Dict[str, Optional[str]]] = None,
) -> Dict[str, Any]:
    """
    Parameters
    ----------
    user_id     : Firebase UID
    temperature : °C
    occasion    : one of the OCCASION_FILTER keys
    type_hints  : per-slot type preference  {"topwear": "Shirt", "bottomwear": None, ...}
    color_hints : per-slot color preference {"topwear": "Blue",  "bottomwear": None, ...}
    """
    print(
        f"Recommendation | user={user_id} | {temperature}°C | "
        f"occasion={occasion} | types={type_hints} | colors={color_hints}"
    )

    slot_queries = build_slot_queries(temperature, occasion, type_hints, color_hints)

    # Query each slot independently (two-pass with fallback)
    slot_pools: Dict[str, List[Dict]] = {}
    relaxed_slots: List[str] = []

    for slot, query in slot_queries.items():
        pool = await _query_slot(user_id, query)

        if not pool and query.has_hints():
            # Pass 2: drop type and color hints
            pool = await _query_slot(user_id, query.relaxed())
            if pool:
                relaxed_slots.append(slot)

        slot_pools[slot] = pool

    # Check required slots are non-empty
    required = ["topwear", "bottomwear", "footwear"]
    empty    = [s for s in required if not slot_pools.get(s)]
    if empty:
        return {
            "error": f"Not enough items in your wardrobe for this occasion. "
                     f"Missing: {', '.join(empty)}."
        }

    # Random selection from each slot's pool
    selected_ids = {
        slot: random.choice(pool)["id"]
        for slot, pool in slot_pools.items()
        if pool
    }

    # Fetch images for selected items only
    images_map = await _fetch_images(list(selected_ids.values()))

    # Build item lookup from pools
    item_lookup: Dict[str, Dict] = {}
    for pool in slot_pools.values():
        for item in pool:
            item_lookup[item["id"]] = item

    def assemble(slot: str) -> Optional[Dict]:
        item_id = selected_ids.get(slot)
        if not item_id:
            return None
        item = dict(item_lookup[item_id])
        item["image"] = images_map.get(item_id)
        return item

    reason = _build_reason(occasion, temperature, relaxed_slots, needs_outerwear(temperature))

    return {
        "id": str(uuid.uuid4()),
        "outfit": {
            "topwear":    assemble("topwear"),
            "bottomwear": assemble("bottomwear"),
            "footwear":   assemble("footwear"),
            "outerwear":  assemble("outerwear"),
        },
        "reason": reason,
    }


# ---------------------------------------------------------------------------
# Firestore query per slot
# ---------------------------------------------------------------------------

async def _query_slot(user_id: str, q: SlotQuery) -> List[Dict]:
    """
    Build and execute a Firestore query for one slot.

    Firestore only allows one array_contains / array_contains_any filter per
    query. We use it for occasions (most selective) and apply the temperatures
    and color filters in Python on the returned items.

    Filters applied in Firestore:
      1. user_id == user_id
      2. category == q.category
      3. occasions array_contains_any q.allowed_occasions
      4. type in q.allowed_types     (if set)
      5. type in OUTERWEAR_TYPES     (if outerwear_only)

    Filters applied in Python after fetch:
      - temperatures overlap with q.allowed_temps
      - colors overlap with q.allowed_colors  (if set)
      - exclude_outerwear: type not in OUTERWEAR_TYPES
    """
    try:
        ref = (
            wardrobe_ref
            .where(filter=FieldFilter("user_id",   "==", user_id))
            .where(filter=FieldFilter("category",  "==", q.category))
            .where(filter=FieldFilter("occasions", "array_contains_any", q.allowed_occasions))
        )

        if q.allowed_types:
            ref = ref.where(filter=FieldFilter("type", "in", q.allowed_types))
        elif q.outerwear_only:
            ref = ref.where(filter=FieldFilter("type", "in", list(OUTERWEAR_TYPES)))

        docs  = ref.select(["category", "type", "colors", "occasions", "temperatures"]).get()
        items = [_doc_to_dict(doc) for doc in docs]

        # Python-side filters (Firestore limit: one array filter per query)
        allowed_temps = set(q.allowed_temps)
        items = [i for i in items if set(i["temperatures"]).intersection(allowed_temps)]

        if q.allowed_colors:
            allowed_colors = set(q.allowed_colors)
            items = [i for i in items if set(i["colors"]).intersection(allowed_colors)]

        if q.exclude_outerwear:
            items = [i for i in items if i["type"] not in OUTERWEAR_TYPES]

        return items

    except Exception as e:
        print(f"Slot query error ({q.category}): {e}")
        return []


# ---------------------------------------------------------------------------
# Image fetch (selected items only)
# ---------------------------------------------------------------------------

async def _fetch_images(item_ids: List[str]) -> Dict[str, str]:
    try:
        valid = [i for i in item_ids if i]
        if not valid:
            return {}
        doc_refs = [wardrobe_ref.document(i) for i in valid]
        docs     = db.get_all(doc_refs, field_paths=["image"])
        result   = {}
        for doc in docs:
            if doc.exists:
                img = doc.to_dict().get("image")
                if img:
                    result[doc.id] = base64.b64encode(img).decode("utf-8")
        return result
    except Exception as e:
        print(f"Image fetch error: {e}")
        return {}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _doc_to_dict(doc) -> Dict[str, Any]:
    data = doc.to_dict()
    return {
        "id":           doc.id,
        "category":     data.get("category"),
        "type":         data.get("type"),
        "colors":       data.get("colors", []),
        "occasions":    data.get("occasions", []),
        "temperatures": data.get("temperatures", []),
    }


def _build_reason(
    occasion:        str,
    temperature:     int,
    relaxed_slots:   List[str],
    has_outerwear:   bool,
) -> str:
    parts = [f"Outfit selected for a {occasion.lower()} setting"]

    if temperature >= 25:
        parts.append("keeping it light for the heat")
    elif temperature < 15:
        parts.append("layered for the cold")
    else:
        parts.append("suited to mild conditions")

    if has_outerwear:
        parts.append("with an outer layer for warmth")

    if relaxed_slots:
        slots_str = " and ".join(relaxed_slots)
        parts.append(
            f"note: your preferred {slots_str} style wasn't available "
            f"so a suitable alternative was chosen"
        )

    return ", ".join(parts) + "."