import { ClothingItemType } from "@/types";

export const CLOTHING_ITEMS: ClothingItemType[] = [
  {
    id: "1",
    image: require("@/assets/clothing_images/2.png"),
    category: "Topwear",
    type: "T-shirt"
  },
  {
    id: "2",
    image: require("@/assets/clothing_images/3.png"),
    category: "Topwear",
    type: "T-shirt"
  },
  {
    id: "3",
    image: require("@/assets/clothing_images/4.png"),
    category: "Topwear",
    type: "T-shirt"
  },
  {
    id: "4",
    image: require("@/assets/clothing_images/5.png"),
    category: "Topwear",
    type: "T-shirt"
  },
  {
    id: "5",
    image: require("@/assets/clothing_images/9.png"),
    category: "Topwear",
    type: "T-shirt"
  },
  {
    id: "6",
    image: require("@/assets/clothing_images/13.png"),
    category: "Bottomwear",
    type: "Trouser"
  },
  {
    id: "7",
    image: require("@/assets/clothing_images/14.png"),
    category: "Bottomwear",
    type: "Trouser"
  },
    {
    id: "8",
    image: require("@/assets/clothing_images/15.png"),
    category: "Bottomwear",
    type: "Trouser"
  },
    {
    id: "9",
    image: require("@/assets/clothing_images/17.png"),
    category: "Bottomwear",
    type: "Short"
  },
    {
    id: "10",
    image: require("@/assets/clothing_images/18.png"),
    category: "Bottomwear",
    type: "Short"
  },
    {
    id: "11",
    image: require("@/assets/clothing_images/23.png"),
    category: "Footwear",
    type: "Sneaker"
  },
    {
    id: "12",
    image: require("@/assets/clothing_images/24.png"),
    category: "Footwear",
    type: "Sneaker"
  }
];

export const CLOTHING_MAIN_CATEGORIES = ["Topwear", "Bottomwear", "Footwear"];

export const CLOTHING_SUB_CATEGORIES = ["T-shirt", "Shirt", "Polo shirt", "Hoodie", "Sweater", "Jacket", "Blazer", "Coat", "Jeans", "Trousers", "Shorts",
                                        "Skirt", "Leggings","Sweatpants / Joggers", "Dress", "Jumpsuit", "Romper", "Suit", "Sneakers", "Casual shoes",
                                        "Formal shoes", "Sandals", "Slippers / Flip-flops", "Boots", "Heels"];

export const CLOTHING_COLORS = ["Black", "White", "Gray", "Blue", "Red", "Green", "Yellow", "Brown", "Beige", "Pink", "Purple", "Orange"];

export const CLOTHING_ATTIRE_TYPE = ["Casual", "Smart-casual", "Formal", "Semi-formal", "Sports / Activewear", "Party / Festive"];

export const CLOTHING_WEATHER = ["Hot", "Mild", "Cold"];