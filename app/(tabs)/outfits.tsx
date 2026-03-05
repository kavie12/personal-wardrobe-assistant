import { OUTFIT_LIST_KEY } from '@/constants/query_keys';
import Outfit from '@/models/Outfit';
import { deleteOutfit, fetchOutfits } from '@/services/outfits_service';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
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
          renderItem={({ item }) => <OutfitCard outfit={item} />}
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

const OutfitCard = ({ outfit }: { outfit: Outfit }) => {
  const [selected, setSelected] = useState(false);

  // Filter out null outerwear to decide grid layout
  const items = [outfit.topwear, outfit.bottomwear, outfit.footwear];
  if (outfit.outerwear) items.push(outfit.outerwear);

  const queryClient = useQueryClient();

  const handleDelete = () => {
    Alert.alert('Delete Outfit', 'Are you sure you want to delete this outfit?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {text: 'OK', onPress: () => mutationDelete.mutate()},
    ]);
  }

  const mutationDelete = useMutation({
    mutationFn: () => deleteOutfit(outfit.id as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OUTFIT_LIST_KEY }),
  });

  return (
    <TouchableOpacity 
      onLongPress={() => setSelected(s => !s)}
      activeOpacity={0.9}
      className={`${selected ? 'bg-slate-200 dark:bg-neutral-700' : 'bg-white dark:bg-neutral-800'} rounded-lg p-4 shadow-sm border border-slate-100 dark:border-neutral-700`}
    >
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-slate-600 dark:text-slate-200 font-semibold">{outfit.occasion}</Text>
        { selected &&
          <TouchableOpacity activeOpacity={0.7} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="#e0263c" />
          </TouchableOpacity> 
        }
      </View>

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