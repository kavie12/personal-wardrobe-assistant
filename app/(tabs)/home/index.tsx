import ClothingItem from '@/models/ClothingItem';
import Outfit from '@/models/Outfit';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = () => {

  const outfit = new Outfit(
    {
      image: require("@/assets/clothing_images/4.png"),
      type: "T-shirt"
    },
    {
      image: require("@/assets/clothing_images/14.png"),
      type: "Joggers"
    },
    {
      image: require("@/assets/clothing_images/24.png"),
      type: "Casual shoes"
    }
  );

  return (
    <SafeAreaView className="flex-1">
      <ScrollView contentContainerClassName="px-4">
        <Greeting className="mt-4" />
        <WeatherCard className="mt-8" />
        <ScheduleCard className="mt-8" />
        <OutfitCard
          className="mt-8"
          description="Based on your 10:00 AM meeting and 24°C weather."
          outfit={outfit}
        />
      </ScrollView>
    </SafeAreaView>
  ) 
};

const Greeting = ({ className = "" }: { className?: string; }) => {
  return (
    <View className={`flex-row justify-between items-center ${className}`}>
      <View className="gap-y-1">
        <Text className="text-md font-medium text-slate-500 dark:text-slate-400">GOOD MORNING,</Text>
        <Text className="text-3xl font-bold text-slate-800 dark:text-slate-200">Kaveesha</Text>
      </View>
      <TouchableOpacity activeOpacity={0.7} className="bg-blue-200 rounded-full w-14 h-14 justify-center items-center">
        <Text className="text-lg font-bold text-blue-600">KD</Text>
      </TouchableOpacity>
    </View>
  );
};

const WeatherCard = ({ className = "" }: { className?: string; }) => {
  return (
    <View className={`bg-sky-600 flex-row items-center justify-between p-8 rounded-2xl ${className}`}>
      <View className="gap-y-2">
        <View className="flex-row items-center gap-x-2">
          <Ionicons name="sunny-outline" color="white" />
          <Text className="text-white font-medium text-sm">Today's Forecast</Text>
        </View>
        <Text className="text-white text-4xl font-bold">24°</Text>
        <Text className="text-white font-semibold text-lg">Partly Cloudy</Text>
      </View>
      <View className="items-center bg-sky-500 p-4 rounded-xl gap-y-2">
        <Ionicons name="cloud-outline" color="white" size={32} />
        <Text className="text-white font-medium text-sm">Perfect for Layers</Text>
      </View>
    </View>
  );
};

const ScheduleCard = ({ className = "" }: { className?: string; }) => {
  return (
    <View className={`bg-white p-8 rounded-2xl ${className}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-x-4">
          <Ionicons name="calendar-outline" size={24} color="blue" />
          <Text className="text-xl font-bold text-slate-500">SCHEDULE</Text>
        </View>
        <Link href="/home/scheduler">
          <Ionicons name="open-outline" size={20}  />
        </Link>
      </View>
      <View className="mt-8 gap-y-6">
        <ScheduleRecord date={new Date()} title="Supervisor meeting" occasion="Formal" />
        <ScheduleRecord date={new Date()} title="Dayout" occasion="Casual" />
      </View>
    </View>
  );
};

const OCCASION_COLORS: Record<string, { bg: string; text: string; }> = {
  FORMAL: { bg: 'bg-violet-100', text: 'text-violet-500' },
  CASUAL: { bg: 'bg-green-100', text: 'text-green-600' },
  DEFAULT: { bg: 'bg-slate-100', text: 'text-slate-500' }
};

const ScheduleRecord = ({ date, title, occasion }: { date: Date; title: string; occasion: string; }) => {

  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const [time, ampm] = timeString.split(/\s+/);

  const theme = OCCASION_COLORS[occasion.toUpperCase()] || OCCASION_COLORS.DEFAULT;

  return (
    <View className="flex-row items-center">
      <View className="items-center">
        <Text className="font-bold text-lg">{time}</Text>
        <Text className="text-slate-400 text-sm font-medium">{ampm}</Text>
      </View>
      <View className="mx-6 w-[1px] h-full bg-slate-300"></View>
      <View className="gap-y-1">
        <Text numberOfLines={1} className="font-medium text-lg text-slate-800">{title}</Text>
        <Text className={`${theme.bg} ${theme.text} font-semibold text-sm self-start px-3 py-1 rounded-full`}>{occasion.toUpperCase()}</Text>
      </View>
    </View>
  );
};

const OutfitCard = ({ className = "", description, outfit }: { className: string; description: string; outfit: Outfit }) => {
  return (
    <View className={`bg-white p-8 rounded-2xl ${className}`}>
      <View className="flex-row items-center gap-x-4">
        <Ionicons name="shirt-outline" size={24} color="blue" />
        <Text className="text-xl font-bold text-slate-500">OUTFIT OF THE DAY</Text>
      </View>
      <View className="bg-blue-600 flex-row items-center gap-2 self-start px-3 py-1 rounded-full mt-8">
        <Ionicons name="chatbubble-outline" color="white" />
        <Text className="text-white text-sm">AI Pick</Text>
      </View>
      <Text className="text-slate-500 italic mt-4 font-medium">"{description}"</Text>
      <ScrollView horizontal contentContainerClassName="gap-x-4 pb-4" className="mt-4">
        <OutfitItem item={outfit.topwear} />
        <OutfitItem item={outfit.bottomwear} />
        <OutfitItem item={outfit.footwear} />
      </ScrollView>
      <View className="flex-row w-full gap-x-4 mt-4">
        <TouchableOpacity activeOpacity={0.8} className="bg-red-100 px-3 py-3 rounded-xl">
          <Ionicons name="close-outline" size={24} color="red" />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} className="flex-row items-center bg-slate-800 px-3 py-3 rounded-xl gap-x-4 flex-grow justify-center">
          <Ionicons name="checkmark-outline" size={24} color="white" />
          <Text className="text-white font-medium text-lg">Wear This</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const OutfitItem = ({ item }: { item: Partial<ClothingItem> }) => {
  return (
    <View className="items-center gap-y-2">
      <Image source={item.image} style={{ width: 160, height: 160, borderRadius: 12 }} />
      <Text className="font-semibold text-slate-500">{item.type}</Text>
    </View>
  );
};

export default HomeScreen;