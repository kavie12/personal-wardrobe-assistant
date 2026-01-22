import Chip from '@/components/chip';
import FloatingActionButton from '@/components/floating-action-button';
import { CLOTHING_CATEGORIES, SAMPLE_USER_ID } from '@/data';
import { useWardrobe } from '@/hooks/use-wardrobe';
import { ClothingCategory, WardrobeItemProps } from '@/types';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const WardrobeScreen = () => {
  const [category, setCategory] = useState<ClothingCategory | "All">("All");

  const router = useRouter();

  const selectCategory = (category: ClothingCategory | "All") => setCategory(category);

  const query = useWardrobe(SAMPLE_USER_ID);

  // useEffect(() => {
  //   if (category === "All") {
  //     setItems(SAMPLE_CLOTHING_ITEMS);
  //   } else {
  //     setItems(
  //       SAMPLE_CLOTHING_ITEMS.filter(item => item.category === category)
  //     );
  //   }
  // }, [category]);

  return (
    <View className="flex-1 my-8">

      {/* Category filters */}
      <CategoryFilters selectedCategory={category} selectCategory={selectCategory} />

      {
        query.isFetching ?

          // Loading spinner
          <View className="absolute inset-0 justify-center items-center">
              <ActivityIndicator size="large" color="#0891b2" />
          </View>

          :

          // Clothing items list
          <FlatList
            data={query.data}
            renderItem={({item}) => (
              <WardrobeItem
                image={item.image}
                type={item.type}
                onPress={() => router.navigate({ pathname: "/wardrobe/[id]", params: { id: item.id } })}
              />
            )}
            keyExtractor={item => item.id}
            numColumns={2}
            initialNumToRender={6}
            contentContainerClassName="px-4 gap-y-4" 
            columnWrapperClassName="gap-x-4"
            className="mt-8"
          />
      }

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

const CategoryFilters = ({ selectedCategory, selectCategory }: { selectedCategory: ClothingCategory | "All", selectCategory: (category: ClothingCategory | "All") => void }) => {
  return (
    <ScrollView className="mx-4" horizontal={true} contentContainerClassName="gap-x-2" showsHorizontalScrollIndicator={false}>
      {["All"].concat(CLOTHING_CATEGORIES).map((category) => (
        <Chip<ClothingCategory | "All">
          key={category}
          value={category as ClothingCategory | "All"}
          isSelected={selectedCategory === category}
          onSelect={(value) => selectCategory(value)}
        />
      ))}
    </ScrollView>
  );
};

export default WardrobeScreen;