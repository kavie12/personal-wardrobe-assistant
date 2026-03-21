import { CLOTHING_CATEGORIES, CLOTHING_COLORS, CLOTHING_OCCASIONS, CLOTHING_TEMPERATURES, CLOTHING_TYPES } from "@/data";
import Outfit from "@/models/Outfit";
import { ImageSourcePropType } from "react-native";

export interface WardrobeItemProps {
  image: ImageSourcePropType;
  type: string;
  onPress: () => void;
}

export type ClothingCategory = typeof CLOTHING_CATEGORIES[number];

export type ClothingType = typeof CLOTHING_TYPES[number];

export type ClothingColor = typeof CLOTHING_COLORS[number];

export type ClothingOccasion = typeof CLOTHING_OCCASIONS[number];

export type ClothingTemperature = typeof CLOTHING_TEMPERATURES[number];

export type ClothingLabelKeys = "category" | "type" | "colors" | "occasions" | "temperatures";

export type ClothingItemScreenMode = "View" | "Edit";

export interface Message {
  type: "user" | "system" | "outfit",
  content: string,
  outfit?: Outfit
}