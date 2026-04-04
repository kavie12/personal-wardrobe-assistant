import { ClothingLabelKeys, SlotHints } from "@/types";

export const CLOTHING_CATEGORIES = ["Topwear", "Bottomwear", "One-piece", "Footwear"] as const;

export const CLOTHING_TYPES = [
  "T-shirt", "Shirt", "Polo shirt", "Hoodie", "Sweater", "Jacket", "Blazer", "Coat", 
  "Jeans", "Trousers", "Shorts", "Skirt", "Leggings", "Joggers", "Dress", "Jumpsuit", 
  "Romper", "Suit", "Sneakers", "Casual shoes", "Formal shoes", "Sandals", 
  "Flip-flops", "Boots", "Heels"
] as const;

export const CLOTHING_COLORS = [
  "Black", "White", "Gray", "Blue", "Red", "Green", "Yellow", "Brown", "Beige", "Pink", "Purple", "Orange"
] as const;

export const CLOTHING_OCCASIONS = [
  "Casual", "Smart casual", "Formal", "Sportswear", "Party", "Work"
] as const;

export const CLOTHING_TEMPERATURES = ["Hot", "Mild", "Cold"] as const;

export const CLOTHING_LABELS: {
    title: string;
    key: ClothingLabelKeys;
    labels: readonly string[];
}[] = [
  { title: "Category", key: "category", labels: CLOTHING_CATEGORIES },
  { title: "Type", key: "type", labels: CLOTHING_TYPES },
  { title: "Colors", key: "colors", labels: CLOTHING_COLORS },
  { title: "Occasions", key: "occasions", labels: CLOTHING_OCCASIONS },
  { title: "Temperatures", key: "temperatures", labels: CLOTHING_TEMPERATURES }
];

export const NULL_SLOT_HINTS: SlotHints = {
  topwear: null,
  bottomwear: null,
  footwear: null,
  outerwear: null,
};