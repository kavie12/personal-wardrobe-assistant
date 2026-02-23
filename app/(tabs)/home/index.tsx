import { HOME_RECOMMENDATION_KEY, HOME_SCHEDULE_LIST_KEY } from '@/constants/query_keys';
import { OCCASION_CHIP_COLORS } from '@/constants/theme';
import { CLOTHING_OCCASIONS, SAMPLE_USER_ID } from '@/data';
import ClothingItem from '@/models/ClothingItem';
import Schedule from '@/models/Schedule';
import { getRecommendation, getScheduleRecommendation } from '@/services/recommendation_service';
import { fetchLatestSchedule, fetchLatestSchedules24H } from '@/services/schedule_service';
import { ClothingOccasion } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = () => {
  return (
    <SafeAreaView className="flex-1">
      <ScrollView contentContainerClassName="px-4">
        <Greeting className="mt-4" />
        <WeatherCard className="mt-8" />
        <ScheduleCard className="mt-8" />
        <OutfitCard className="mt-8" />
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
  const router = useRouter();

  const query = useQuery({
    queryKey: HOME_SCHEDULE_LIST_KEY,
    queryFn: () => fetchLatestSchedules24H(SAMPLE_USER_ID),
    staleTime: Infinity,
    gcTime: Infinity
  });

  return (
    <View className={`bg-white p-8 rounded-2xl ${className}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-x-4">
          <Ionicons name="calendar-outline" size={24} color="blue" />
          <Text className="text-xl font-bold text-slate-500">SCHEDULE</Text>
        </View>
        <TouchableOpacity onPress={() => router.navigate("/home/scheduler")} activeOpacity={0.7}>
          <Ionicons name="open-outline" size={20}  />
        </TouchableOpacity>
      </View>
      <View className="mt-8 gap-y-6">
        { query.isFetching && <ActivityIndicator size="small" color="#0891b2" /> }
        { query.data && query.data.map((item, i) => <ScheduleRecord schedule={item} key={i} />) }
        { query.data && query.data.length === 0 && <Text className="text-center text-slate-500 italic font-medium">No schedules for next 24 hours!</Text> }
      </View>
    </View>
  );
};

const ScheduleRecord = ({schedule}: {schedule: Schedule}) => {

  const timeString = schedule.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const [time, ampm] = timeString.split(/\s+/);

  const theme = OCCASION_CHIP_COLORS[schedule.occasion.toUpperCase()];

  return (
    <View className="flex-row items-center">
      <View className="items-center">
        <Text className="font-bold text-lg">{time}</Text>
        <Text className="text-slate-400 text-sm font-medium">{ampm}</Text>
      </View>
      <View className="mx-6 w-[1px] h-full bg-slate-300"></View>
      <View className="gap-y-1">
        <Text numberOfLines={1} className="font-medium text-lg text-slate-800">{schedule.title}</Text>
        <Text className={`${theme.bg} ${theme.text} font-semibold text-sm self-start px-3 py-1 rounded-full`}>{schedule.occasion.toUpperCase()}</Text>
      </View>
    </View>
  );
};

const OutfitCard = ({ className = "" }: { className: string; }) => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<ClothingOccasion>("Formal");

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: HOME_RECOMMENDATION_KEY,
    queryFn: async () => {
      if (schedule) {
        const scheduleString = `${schedule.title} ${schedule.timestamp.toLocaleString()} ${schedule.occasion}`;
        return await getScheduleRecommendation({ description: "Rainy", temperature: 20 }, scheduleString);
      } else {
        return await getRecommendation({ description: "Rainy", temperature: 20 }, selectedOccasion);
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: false
  });
  
  useEffect(() => {
    fetchLatestSchedule(SAMPLE_USER_ID)
      .then(data => {
        setSchedule(data);
      })
      .catch(err => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    if (schedule !== null) {
      query.refetch();
    }
  }, [schedule]);

  return (
    <View className={`bg-white p-8 rounded-2xl ${className}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-x-4">
          <Ionicons name="shirt-outline" size={24} color="blue" />
          <Text className="text-xl font-bold text-slate-500">OUTFIT OF THE DAY</Text>
        </View>
        {
          query.isFetched &&
          <TouchableOpacity
            onPress={() => {
              if (schedule) {
                query.refetch();
              } else {
                queryClient.resetQueries({ queryKey: HOME_RECOMMENDATION_KEY });
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={20}  />
          </TouchableOpacity>
        }
      </View>
      
      {
        query.isFetched &&
        <View className="bg-blue-600 flex-row items-center gap-2 self-start px-3 py-1 rounded-full mt-8">
          <Ionicons name="chatbubble-outline" color="white" />
          <Text className="text-white text-sm">AI Pick</Text>
        </View>
      }

      {
        !schedule && !query.isFetched &&
        <View className="mt-8 gap-y-6">
          <Text className="text-slate-500 font-medium">
            Generate today's outfit.
          </Text>

          <View className="flex-row items-center gap-x-3">
            <View className="flex-1 bg-slate-100 rounded-xl">
              <Picker
                selectedValue={selectedOccasion}
                onValueChange={(itemValue) => setSelectedOccasion(itemValue)}
              >
                {CLOTHING_OCCASIONS.map((occasion) => (
                  <Picker.Item
                    key={occasion}
                    label={occasion}
                    value={occasion}
                  />
                ))}
              </Picker>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => query.refetch()}
              className="bg-slate-800 p-4 rounded-xl items-center shadow-lg justify-center"
            >
              <Text className="text-white text-lg font-medium">Generate Outfit</Text>
            </TouchableOpacity>
          </View>
        </View>
      }

      {
        query.data &&
        <>
          <Text className="text-slate-500 italic mt-4 font-medium">"{query.data.reason}"</Text>
          <ScrollView horizontal contentContainerClassName="gap-x-4 pb-4" className="mt-4">
            <OutfitItem item={query.data.outfit.topwear} />
            <OutfitItem item={query.data.outfit.bottomwear} />
            <OutfitItem item={query.data.outfit.footwear} />
            { query.data?.outfit.outerwear && <OutfitItem item={query.data?.outfit.outerwear} /> }
          </ScrollView>
        </>
      }

      {
        query.data &&
        <View className="flex-row w-full gap-x-4 mt-4">
          <TouchableOpacity activeOpacity={0.8} className="bg-red-100 px-3 py-3 rounded-xl">
            <Ionicons name="close-outline" size={24} color="red" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} className="flex-row items-center bg-slate-800 px-3 py-3 rounded-xl gap-x-4 flex-grow justify-center">
            <Ionicons name="checkmark-outline" size={24} color="white" />
            <Text className="text-white font-medium text-lg">Wear This</Text>
          </TouchableOpacity>
        </View>
      }

      { query.isFetching && <ActivityIndicator className="my-4" /> }
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