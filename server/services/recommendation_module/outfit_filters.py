"""
Filter-based outfit recommendation algorithm
=============================================
Three generation modes share one algorithm. The request payload determines
which filters are active:

  Occasion-based : temperature + occasion
  Schedule-based : temperature + occasion
  Chat-based     : temperature + occasion + type hints + color hints per slot

Core idea
---------
Each clothing slot (topwear, bottomwear, footwear, outerwear) is queried
independently from Firestore using filters derived from the request. One item
is chosen at random from each slot's result pool, producing different outfits
on identical inputs.

Two-pass fallback (per slot)
----------------------------
Pass 1 — strict : occasion + weather + type hint + color hint
Pass 2 — relax  : occasion + weather only  (type and color hints dropped)

Ensures a slot is never empty due to a specific preference having no match.

SelectionModule (outerwear)
---------------------------
Required when temperature < COLD_THRESHOLD (15°C), absent otherwise.
"""

from __future__ import annotations
from typing import Dict, List, Optional

# ---------------------------------------------------------------------------
# Thresholds
# ---------------------------------------------------------------------------
COLD_THRESHOLD = 15
HOT_THRESHOLD  = 25

# ---------------------------------------------------------------------------
# OccasionFilter
# ---------------------------------------------------------------------------
OCCASION_FILTER: Dict[str, List[str]] = {
    "Formal":       ["Formal", "Work"],
    "Work":         ["Work", "Smart casual", "Formal"],
    "Smart casual": ["Smart casual", "Casual", "Work", "Party"],
    "Casual":       ["Casual", "Smart casual"],
    "Party":        ["Party", "Smart casual", "Casual"],
    "Sportswear":   ["Sportswear", "Casual"],
}

# ---------------------------------------------------------------------------
# WeatherFilter
# ---------------------------------------------------------------------------
def get_weather_filter(temperature: int) -> List[str]:
    if temperature >= HOT_THRESHOLD:
        return ["Hot", "Mild"]
    if temperature >= COLD_THRESHOLD:
        return ["Hot", "Mild", "Cold"]
    return ["Mild", "Cold"]

def needs_outerwear(temperature: int) -> bool:
    return temperature < COLD_THRESHOLD

# ---------------------------------------------------------------------------
# TypeFilter
# Maps user-facing type hints to stored 'type' values per slot.
# Used only in chat-based generation.
# ---------------------------------------------------------------------------
TYPE_FILTER: Dict[str, Dict[str, List[str]]] = {
    "topwear": {
        "T-shirt":    ["T-shirt"],
        "Shirt":      ["Shirt"],
        "Polo shirt": ["Polo shirt"],
        "Hoodie":     ["Hoodie"],
        "Sweater":    ["Sweater"],
        "Jacket":     ["Jacket"],
        "Blazer":     ["Blazer"],
        "Coat":       ["Coat"],
    },
    "bottomwear": {
        "Jeans":    ["Jeans"],
        "Trousers": ["Trousers"],
        "Shorts":   ["Shorts"],
        "Skirt":    ["Skirt"],
        "Leggings": ["Leggings"],
        "Joggers":  ["Joggers"],
    },
    "footwear": {
        "Sneakers":     ["Sneakers"],
        "Casual shoes": ["Casual shoes"],
        "Formal shoes": ["Formal shoes"],
        "Sandals":      ["Sandals"],
        "Flip-flops":   ["Flip-flops"],
        "Boots":        ["Boots"],
        "Heels":        ["Heels"],
    },
    "outerwear": {
        "Jacket":  ["Jacket"],
        "Coat":    ["Coat"],
        "Hoodie":  ["Hoodie"],
        "Blazer":  ["Blazer"],
        "Sweater": ["Sweater"],
    },
}

# ---------------------------------------------------------------------------
# ColorFilter
# ---------------------------------------------------------------------------
COLOR_FILTER: Dict[str, List[str]] = {
    "Black":  ["Black"],
    "White":  ["White"],
    "Gray":   ["Gray"],
    "Blue":   ["Blue"],
    "Red":    ["Red"],
    "Green":  ["Green"],
    "Yellow": ["Yellow"],
    "Brown":  ["Brown"],
    "Beige":  ["Beige"],
    "Pink":   ["Pink"],
    "Purple": ["Purple"],
    "Orange": ["Orange"],
}

OUTERWEAR_TYPES = {"Jacket", "Coat", "Blazer", "Hoodie", "Sweater"}

# ---------------------------------------------------------------------------
# SlotQuery
# ---------------------------------------------------------------------------
class SlotQuery:
    """All filter values for one clothing slot."""

    def __init__(
        self,
        category:           str,
        allowed_occasions:  List[str],
        allowed_temps:      List[str],
        allowed_types:      Optional[List[str]] = None,
        allowed_colors:     Optional[List[str]] = None,
        outerwear_only:     bool = False,
        exclude_outerwear:  bool = False,
    ):
        self.category          = category
        self.allowed_occasions = allowed_occasions
        self.allowed_temps     = allowed_temps
        self.allowed_types     = allowed_types
        self.allowed_colors    = allowed_colors
        self.outerwear_only    = outerwear_only
        self.exclude_outerwear = exclude_outerwear

    def relaxed(self) -> "SlotQuery":
        """Return a copy with type and color hints removed (pass 2 fallback)."""
        return SlotQuery(
            category=self.category,
            allowed_occasions=self.allowed_occasions,
            allowed_temps=self.allowed_temps,
            allowed_types=None,
            allowed_colors=None,
            outerwear_only=self.outerwear_only,
            exclude_outerwear=self.exclude_outerwear,
        )

    def has_hints(self) -> bool:
        return self.allowed_types is not None or self.allowed_colors is not None


# ---------------------------------------------------------------------------
# Filter builder
# ---------------------------------------------------------------------------
def build_slot_queries(
    temperature: int,
    occasion:    str,
    type_hints:  Optional[Dict[str, Optional[str]]] = None,
    color_hints: Optional[Dict[str, Optional[str]]] = None,
) -> Dict[str, SlotQuery]:
    """
    Convert request payload into SlotQuery objects.

    Parameters
    ----------
    temperature : int
    occasion    : str  — key in OCCASION_FILTER
    type_hints  : {"topwear": str|None, ...}   chat-based only
    color_hints : {"topwear": str|None, ...}   chat-based only

    Returns
    -------
    Dict[slot_name, SlotQuery].  "outerwear" included only when temp < 15°C.
    """
    allowed_occasions = OCCASION_FILTER.get(occasion, OCCASION_FILTER["Casual"])
    allowed_temps     = get_weather_filter(temperature)
    type_hints        = type_hints  or {}
    color_hints       = color_hints or {}

    def _types(slot: str) -> Optional[List[str]]:
        hint = type_hints.get(slot)
        return TYPE_FILTER.get(slot, {}).get(hint) if hint else None

    def _colors(slot: str) -> Optional[List[str]]:
        hint = color_hints.get(slot)
        return COLOR_FILTER.get(hint) if hint else None

    queries: Dict[str, SlotQuery] = {
        "topwear": SlotQuery(
            category="Topwear",
            allowed_occasions=allowed_occasions,
            allowed_temps=allowed_temps,
            allowed_types=_types("topwear"),
            allowed_colors=_colors("topwear"),
            exclude_outerwear=True,
        ),
        "bottomwear": SlotQuery(
            category="Bottomwear",
            allowed_occasions=allowed_occasions,
            allowed_temps=allowed_temps,
            allowed_types=_types("bottomwear"),
            allowed_colors=_colors("bottomwear"),
        ),
        "footwear": SlotQuery(
            category="Footwear",
            allowed_occasions=allowed_occasions,
            allowed_temps=allowed_temps,
            allowed_types=_types("footwear"),
            allowed_colors=_colors("footwear"),
        ),
    }

    if needs_outerwear(temperature):
        queries["outerwear"] = SlotQuery(
            category="Topwear",
            allowed_occasions=allowed_occasions,
            allowed_temps=allowed_temps,
            allowed_types=_types("outerwear"),
            allowed_colors=_colors("outerwear"),
            outerwear_only=True,
        )

    return queries