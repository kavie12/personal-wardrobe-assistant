import Outfit from '@/models/Outfit';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const OutfitsScreen = () => {
  return (
    <SafeAreaView className="flex-1">
        <Header className="mt-4"  />


    </SafeAreaView>
  )
};

const Header = ({ className = "" }: { className?: string; }) => {
  return (
    <View className={`flex-row items-center justify-between mx-4 ${className}`}>
        <Text className="text-3xl font-bold dark:text-white">Outfits</Text>
    </View>
  );
};

const OutfitItem = ({ outfit, onPress }: { outfit: Outfit, onPress: () => void }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-[0.5] bg-white dark:bg-neutral-800 rounded-lg overflow-hidden pb-2"
    >
      <View className="aspect-square w-full">
        {/* <Image source={image} style={{ width: '100%', height: '100%' }} contentFit="cover" /> */}
      </View>
    </TouchableOpacity>
  )
};

const EmptyOutfits = () => {
  return (
    <View className="flex-1 items-center justify-center py-20 px-10">
      <View className="bg-gray-100 dark:bg-neutral-800 p-6 rounded-full mb-4">
        <Ionicons name="shirt-outline" size={48} color="#9ca3af" />
      </View>
      <Text className="text-xl font-semibold text-gray-800 dark:text-gray-100 text-center">
        No outfits saved yet
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
        Tap the "+" button below to start adding clothes to your digital closet.
      </Text>
    </View>
  );
};

export default OutfitsScreen;