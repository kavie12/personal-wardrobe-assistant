import { OUTFIT_LIST_KEY } from '@/constants/query_keys';
import Outfit from '@/models/Outfit';
import { fetchOutfits } from '@/services/outfits_service';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const OutfitsScreen = () => {
  const query = useInfiniteQuery({
    queryKey: OUTFIT_LIST_KEY,
    queryFn: fetchOutfits,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.dataList) || [],
    [query.data]
  );

  return (
    <SafeAreaView className="flex-1">
        <Header className="mt-4"  />

        <FlatList
          data={items}
          keyExtractor={(item) => item.id?.toString() as string}
          renderItem={({ item }) => <OutfitCard outfit={item} onPress={() => {}}/>}
          contentContainerClassName="px-4 gap-y-4"
          ListEmptyComponent={query.isPending ? <ActivityIndicator size="large" color="#0891b2" className="mt-20" /> : <EmptyOutfits />}
          className="mt-8"
        />
    </SafeAreaView>
  )
};

const Header = ({ className = "" }: { className?: string; }) => {
  return (
    <View className={`flex-row items-center justify-between mx-4 ${className}`}>
        <Text className="text-3xl font-bold dark:text-white">My Outfits</Text>
    </View>
  );
};

const OutfitCard = ({ outfit, onPress }: { outfit: Outfit, onPress: () => void }) => {
  const [selected, setSelected] = useState(false);

  // Filter out null outerwear to decide grid layout
  const items = [outfit.topwear, outfit.bottomwear, outfit.footwear];
  if (outfit.outerwear) items.push(outfit.outerwear);

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.9}
      className={`bg-white dark:bg-neutral-800 rounded-lg p-4 shadow-sm border border-slate-100 dark:border-neutral-700`}
    >
      <Text className="text-slate-600 dark:text-slate-200 font-semibold mb-4">{outfit.occasion}</Text>

      {/* Grid Layout for Outfit Items */}
      <View className="flex-row flex-wrap gap-2">
        {items.map(item => (
          <View key={item.id} className="rounded-lg overflow-hidden flex-1 aspect-square">
            <Image source={item?.image} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            <View className="absolute bottom-0 left-0 right-0 bg-black/20 p-1">
               <Text className="text-[10px] text-white text-center font-bold uppercase">
                {item?.category}
               </Text>
            </View>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const EmptyOutfits = () => (
  <View className="flex-1 items-center justify-center py-20 px-10">
    <Ionicons name="shirt" size={60} color="#9ca3af" className="mb-6" />
    <Text className="text-2xl font-bold text-slate-800 dark:text-white text-center">
      No Outfits Saved
    </Text>
    <Text className="text-slate-500 text-center mt-3 text-lg leading-6">
      Use the AI generator to create the perfect look for your next event!
    </Text>
  </View>
);

export default OutfitsScreen;