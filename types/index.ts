import { ImageSource } from "expo-image";

export interface WardrobeItemProps {
  image: ImageSource;
  type: string;
  onPress: () => void;
}

export interface ClothingItemType {
  id: string;
  image: ImageSource;
  category: "Topwear" | "Bottomwear" | "Footwear";
  type: string;
}