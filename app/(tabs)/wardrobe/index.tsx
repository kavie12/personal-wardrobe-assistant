import Chip from '@/components/chip';
import FloatingActionButton from '@/components/floating-action-button';
import { CLOTHING_CATEGORIES } from '@/data';
import { useWardrobe } from '@/hooks/use-wardrobe';
import { ClothingCategory, WardrobeItemProps } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const WardrobeScreen = () => {
  const [category, setCategory] = useState<ClothingCategory | "All">("All");
  const router = useRouter();
  const selectCategory = (category: ClothingCategory | "All") => setCategory(category);

  const wardrobeData = useWardrobe();
  const wardrobeItems = wardrobeData.items.filter(item => 
    category === "All" ? true : item.category === category
  ) || [];

  return (
    <View className="flex-1 my-8">

      {/* Category filters */}
      <CategoryFilters selectedCategory={category} selectCategory={selectCategory} />

      {/* Clothing items list */}
      <FlatList
        data={wardrobeItems}
        renderItem={({item}) => (
          <WardrobeItem
            image={item.image}
            type={item.type}
            onPress={() => router.navigate({ pathname: "/wardrobe/[id]", params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={wardrobeData.query.isPending ? <ActivityIndicator size="large" color="#0891b2" /> : <EmptyWardrobe category={category} />}
        onEndReachedThreshold={0.2}
        onEndReached={() => wardrobeData.query.hasNextPage && !wardrobeData.query.isFetchingNextPage && wardrobeData.query.fetchNextPage()}
        ListFooterComponent={wardrobeData.query.isFetchingNextPage ? <ActivityIndicator size="small" /> : null}
        keyExtractor={item => item.id}
        numColumns={2}
        initialNumToRender={6}
        contentContainerClassName="px-4 gap-y-4"
        columnWrapperClassName="gap-x-4"
        className="mt-8"
      />

      {/* Add FAB button */}
      <FloatingActionButton
        iconName="add"
        iconSize={32}
        iconColor="white" 
        onPress={() => router.navigate("/wardrobe/add")}
      />
    </View>
  )
};

const WardrobeItem = ({ image, type, onPress }: WardrobeItemProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-[0.5] bg-white dark:bg-neutral-800 rounded-lg overflow-hidden pb-2"
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
    <View>
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
    </View>
  );
};

const EmptyWardrobe = ({ category }: { category: string }) => {
  return (
    <View className="flex-1 items-center justify-center py-20 px-10">
      <View className="bg-gray-100 dark:bg-neutral-800 p-6 rounded-full mb-4">
        <Ionicons name="shirt-outline" size={48} color="#9ca3af" />
      </View>
      <Text className="text-xl font-semibold text-gray-800 dark:text-gray-100 text-center">
        No {category === "All" ? "items" : category.toLowerCase()} yet
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
        Tap the "+" button below to start adding clothes to your digital closet.
      </Text>
    </View>
  );
};

export default WardrobeScreen;