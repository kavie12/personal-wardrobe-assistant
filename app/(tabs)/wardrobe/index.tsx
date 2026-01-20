import Chip from '@/components/chip';
import FloatingActionButton from '@/components/floating-action-button';
import { CLOTHING_CATEGORIES, CLOTHING_ITEMS } from '@/data';
import { WardrobeItemProps } from '@/types';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

const WardrobeScreen = () => {
  const [category, setCategory] = useState("All");
  const [filteredItems, setFilteredItems] = useState(CLOTHING_ITEMS);

  const router = useRouter();

  const selectCategory = (category: string) => setCategory(category);

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
    <View className="flex-1 my-8">

      {/* Category filters */}
      <CategoryFilters activeCategory={category} selectCategory={selectCategory} />

      {/* Clothing items list */}
      <FlatList
        data={filteredItems}
        renderItem={({item}) => (
          <WardrobeItem
            image={item.image}
            type={item.type}
            onPress={() => router.navigate({ pathname: "/wardrobe/[id]", params: { id: item.id } })}
          />
        )}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        initialNumToRender={6}
        contentContainerClassName="px-4 gap-y-4" 
        columnWrapperClassName="gap-x-4"
        className="mt-8"
      />

      {/* Add FAB button */}
      <FloatingActionButton
        onPress={() => router.navigate("/wardrobe/add")}
        iconName='add'
        className="bg-cyan-600"
      />
    </View>
  )
};

const WardrobeItem = ({ image, type, onPress }: WardrobeItemProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-1 bg-white dark:bg-neutral-800 rounded-lg overflow-hidden pb-2"
    >
      <View className="aspect-square w-full">
        <Image source={image} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      </View>
      <Text className="text-center mt-2 text-gray-600 dark:text-gray-300">{type}</Text>
    </TouchableOpacity>
  )
};

const CategoryFilters = ({ activeCategory, selectCategory }: { activeCategory: string, selectCategory: (category: string) => void }) => {
  return (
    <View className="mx-4">
      <FlatList
        data={["All"].concat(CLOTHING_CATEGORIES)}
        keyExtractor={item => item}
        renderItem={({item}) => <Chip text={item} isActive={item === activeCategory} onSelect={selectCategory} />}
        horizontal={true}
        contentContainerClassName="gap-x-2"
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default WardrobeScreen;