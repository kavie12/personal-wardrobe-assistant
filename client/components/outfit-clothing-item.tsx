import ClothingItem from "@/models/ClothingItem";
import { Image } from "expo-image";
import { Text } from "react-native";
import { View } from "react-native";

const OutfitClothingItem = ({ item }: { item: Partial<ClothingItem> }) => {
  return (
    <View className="items-center gap-y-2">
      <Image source={item.image} style={{ width: 120, height: 120, borderRadius: 12 }} />
      <Text className="font-semibold text-slate-500 dark:text-slate-400">{item.type}</Text>
    </View>
  );
};

export default OutfitClothingItem;