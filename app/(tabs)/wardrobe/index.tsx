import Chip from '@/components/chip';
import FloatingActionButton from '@/components/floating-action-button';
import { CLOTHING_ITEMS, CLOTHING_MAIN_CATEGORIES } from '@/data';
import { WardrobeItemProps } from '@/types';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

const WardrobeFilterContext = createContext<null | [
  string,
  React.Dispatch<React.SetStateAction<string>>
]>(null);

const WardrobeScreen = () => {
  const [category, setCategory] = useState("All");
  const [filteredItems, setFilteredItems] = useState(CLOTHING_ITEMS);

  const router = useRouter();

  useEffect(() => {
    if (category === "All") {
      setFilteredItems(CLOTHING_ITEMS);
    } else {
      setFilteredItems(
        CLOTHING_ITEMS.filter(item => item.category === category)
      );
    }
  }, [category]);

  return (
    <WardrobeFilterContext value={[category, setCategory]}>
      <View className="flex-1 my-8">

        {/* Category filters */}
        <CategoryFilters />

        {/* Clothing items list */}
        <FlatList
          data={filteredItems}
          renderItem={({item}) => <WardrobeItem image={item.image} type={item.type} onPress={() => router.navigate({ pathname: "/wardrobe/[clothingItemId]", params: { clothingItemId: item.id } })} />}
          keyExtractor={item => item.id}
          numColumns={2}
          initialNumToRender={6}
          columnWrapperClassName="gap-x-4"
          contentContainerClassName="items-center gap-y-4"
          className="mt-8"
        />

        {/* Add FAB button */}
        <FloatingActionButton
          onPress={() => {}}
          iconName='add'
          className="bg-cyan-600"
        />
      </View>
    </WardrobeFilterContext>
  )
};

const WardrobeItem = ({ image, type, onPress }: WardrobeItemProps) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="gap-y-2 pb-2 bg-white dark:bg-neutral-900 rounded-lg">
        <Image source={image} style={{ width: 180, height: 180 }} />
        <Text className="text-center text-gray-600 dark:text-gray-300">{type}</Text>
    </TouchableOpacity>
  )
};

const CategoryFilters = () => {
  const context = useContext(WardrobeFilterContext);
  if (!context) {
    throw new Error("No wardrobe filter context found");
  };

  const [category, setCategory] = context;

  const selectCategory = (category: string) => {
    setCategory(category);
  };

  return (
    <View>
      <FlatList
        data={["All"].concat(CLOTHING_MAIN_CATEGORIES)}
        keyExtractor={item => item}
        renderItem={({item}) => <Chip text={item} isActive={item === category} onSelect={selectCategory} />}
        horizontal={true}
        contentContainerClassName="gap-x-2 ms-4"
      />
    </View>
  );
};

export default WardrobeScreen;