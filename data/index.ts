import ClothingItem from "@/models/ClothingItem";
import { ClothingLabelKeys } from "@/types";

export const SAMPLE_CLOTHING_ITEMS: ClothingItem[] = [
  new ClothingItem(
    "1",
    require("@/assets/clothing_images/2.png"),
    "Topwear",
    "T-shirt",
    ["Black"],
    ["Casual"],
    ["Hot", "Mild"]
  ),
  new ClothingItem(
    "2",
    require("@/assets/clothing_images/3.png"),
    "Topwear",
    "T-shirt",
    ["White"],
    ["Casual"],
    ["Hot", "Mild"]
  ),
  new ClothingItem(
    "3",
    require("@/assets/clothing_images/4.png"),
    "Topwear",
    "T-shirt",
    ["Blue"],
    ["Casual", "Sportswear"],
    ["Hot"]
  ),
  new ClothingItem(
    "4",
    require("@/assets/clothing_images/5.png"),
    "Topwear",
    "T-shirt",
    ["Red"],
    ["Casual"],
    ["Hot"]
  ),
  new ClothingItem(
    "5",
    require("@/assets/clothing_images/9.png"),
    "Topwear",
    "T-shirt",
    ["Gray"],
    ["Casual", "Work"],
    ["Mild"]
  ),
  new ClothingItem(
    "6",
    require("@/assets/clothing_images/13.png"),
    "Bottomwear",
    "Trousers",
    ["Black"],
    ["Work", "Formal"],
    ["Mild", "Cold"]
  ),
  new ClothingItem(
    "7",
    require("@/assets/clothing_images/14.png"),
    "Bottomwear",
    "Trousers",
    ["Brown"],
    ["Work"],
    ["Mild"]
  ),
  new ClothingItem(
    "8",
    require("@/assets/clothing_images/15.png"),
    "Bottomwear",
    "Trousers",
    ["Beige"],
    ["Smart casual", "Work"],
    ["Mild"]
  ),
  new ClothingItem(
    "9",
    require("@/assets/clothing_images/17.png"),
    "Bottomwear",
    "Shorts",
    ["Blue"],
    ["Casual"],
    ["Hot"]
  ),
  new ClothingItem(
    "10",
    require("@/assets/clothing_images/18.png"),
    "Bottomwear",
    "Shorts",
    ["Green"],
    ["Casual", "Sportswear"],
    ["Hot"]
  ),
  new ClothingItem(
    "11",
    require("@/assets/clothing_images/23.png"),
    "Footwear",
    "Sneakers",
    ["White"],
    ["Casual", "Sportswear"],
    ["Mild"]
  ),
  new ClothingItem(
    "12",
    require("@/assets/clothing_images/24.png"),
    "Footwear",
    "Sneakers",
    ["Black"],
    ["Casual"],
    ["Mild", "Cold"]
  )
];

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

export const SAMPLE_USER_ID = "ogL5STCYTnVebo9KP9RsY7nMHxC3";