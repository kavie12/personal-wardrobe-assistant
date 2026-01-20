import { ImageSourcePropType } from "react-native";

export interface WardrobeItemProps {
  image: ImageSourcePropType;
  type: string;
  onPress: () => void;
}

export interface ClothingItemType {
  id: number;
  image: ImageSourcePropType;
  category: string;
  type: string;
  colors: string[];
  occasions: string[];
  temperatures: string[];
}