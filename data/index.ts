import { ClothingItemType } from "@/types";

export const CLOTHING_ITEMS: ClothingItemType[] = [
  {
    id: 1,
    image: require("@/assets/clothing_images/2.png"),
    category: "Topwear",
    type: "T-shirt",
    colors: ["Black"],
    occasions: ["Casual"],
    temperatures: ["Hot", "Mild"]
  },
  {
    id: 2,
    image: require("@/assets/clothing_images/3.png"),
    category: "Topwear",
    type: "T-shirt",
    colors: ["White"],
    occasions: ["Casual"],
    temperatures: ["Hot", "Mild"]
  },
  {
    id: 3,
    image: require("@/assets/clothing_images/4.png"),
    category: "Topwear",
    type: "T-shirt",
    colors: ["Blue"],
    occasions: ["Casual", "Sportswear"],
    temperatures: ["Hot"]
  },
  {
    id: 4,
    image: require("@/assets/clothing_images/5.png"),
    category: "Topwear",
    type: "T-shirt",
    colors: ["Red"],
    occasions: ["Casual"],
    temperatures: ["Hot"]
  },
  {
    id: 5,
    image: require("@/assets/clothing_images/9.png"),
    category: "Topwear",
    type: "T-shirt",
    colors: ["Gray"],
    occasions: ["Casual", "Work"],
    temperatures: ["Mild"]
  },
  {
    id: 6,
    image: require("@/assets/clothing_images/13.png"),
    category: "Bottomwear",
    type: "Trousers",
    colors: ["Black"],
    occasions: ["Work", "Formal"],
    temperatures: ["Mild", "Cold"]
  },
  {
    id: 7,
    image: require("@/assets/clothing_images/14.png"),
    category: "Bottomwear",
    type: "Trousers",
    colors: ["Brown"],
    occasions: ["Work"],
    temperatures: ["Mild"]
  },
  {
    id: 8,
    image: require("@/assets/clothing_images/15.png"),
    category: "Bottomwear",
    type: "Trousers",
    colors: ["Beige"],
    occasions: ["Smart casual", "Work"],
    temperatures: ["Mild"]
  },
  {
    id: 9,
    image: require("@/assets/clothing_images/17.png"),
    category: "Bottomwear",
    type: "Shorts",
    colors: ["Blue"],
    occasions: ["Casual"],
    temperatures: ["Hot"]
  },
  {
    id: 10,
    image: require("@/assets/clothing_images/18.png"),
    category: "Bottomwear",
    type: "Shorts",
    colors: ["Green"],
    occasions: ["Casual", "Sportswear"],
    temperatures: ["Hot"]
  },
  {
    id: 11,
    image: require("@/assets/clothing_images/23.png"),
    category: "Footwear",
    type: "Sneakers",
    colors: ["White"],
    occasions: ["Casual", "Sportswear"],
    temperatures: ["Mild"]
  },
  {
    id: 12,
    image: require("@/assets/clothing_images/24.png"),
    category: "Footwear",
    type: "Sneakers",
    colors: ["Black"],
    occasions: ["Casual"],
    temperatures: ["Mild", "Cold"]
  }
];

export const CLOTHING_CATEGORIES = ["Topwear", "Bottomwear", "One-piece", "Footwear"];

export const CLOTHING_TYPES = ["T-shirt", "Shirt", "Polo shirt", "Hoodie", "Sweater", "Jacket", "Blazer", "Coat", "Jeans", "Trousers", "Shorts",
                                        "Skirt", "Leggings","Joggers", "Dress", "Jumpsuit", "Romper", "Suit", "Sneakers", "Casual shoes",
                                        "Formal shoes", "Sandals", "Flip-flops", "Boots", "Heels"];

export const CLOTHING_COLORS = ["Black", "White", "Gray", "Blue", "Red", "Green", "Yellow", "Brown", "Beige", "Pink", "Purple", "Orange"];

export const CLOTHING_OCCASIONS = ["Casual", "Smart casual", "Formal", "Sportswear", "Party", "Work"];

export const CLOTHING_TEMPERATURES = ["Hot", "Mild", "Cold"];