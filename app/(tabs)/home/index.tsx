import { HOME_CURRENT_WEATHER_KEY, HOME_SCHEDULE_LIST_KEY, OUTFIT_LIST_KEY } from '@/constants/query_keys';
import { CLOTHING_OCCASIONS, SAMPLE_USER_ID } from '@/data';
import ClothingItem from '@/models/ClothingItem';
import OutfitGenerationResponse from '@/models/OutfitGenerationResponse';
import Schedule from '@/models/Schedule';
import Weather from '@/models/Weather';
import { saveOutfit } from '@/services/outfits_service';
import { acceptOutfit, getRecommendation, getScheduleRecommendation, recordRejection } from '@/services/recommendation_service';
import { fetchLatestSchedulesByHours } from '@/services/schedule_service';
import { getCurrentWeather, getForecastWeather } from '@/services/weather_service';
import { ClothingOccasion } from '@/types';
import { getDateLabel } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeContext = createContext<{ latestSchedulesQuery: UseQueryResult<Schedule[], Error>, weatherQuery: UseQueryResult<Weather | null, Error> } | null>(null);

const HomeScreen = () => {
  const latestSchedulesQuery = useQuery({
    queryKey: HOME_SCHEDULE_LIST_KEY,
    queryFn: () => fetchLatestSchedulesByHours(SAMPLE_USER_ID, 48),
    staleTime: Infinity,
    gcTime: Infinity
  });
  const weatherQuery = useQuery({
    queryKey: HOME_CURRENT_WEATHER_KEY,
    queryFn: () => getCurrentWeather(6.9271, 79.8612),
    staleTime: 3600000,
    gcTime: 3600000
  });

  return (
    <HomeContext.Provider value={{ latestSchedulesQuery, weatherQuery }}>
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="px-4">
          <Greeting className="mt-4" />
          <WeatherCard className="mt-8" />
          <ScheduleCard className="mt-8" />
          <OutfitCard className="mt-8" />
        </ScrollView>
      </SafeAreaView>
    </HomeContext.Provider>
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

  const query = useContext(HomeContext)?.weatherQuery;
  if (!query) return null;

  return (
    <View className={`bg-sky-600 flex-row items-center justify-between p-8 rounded-2xl ${className}`}>
      <View className="gap-y-2">
        <View className="flex-row items-center gap-x-2">
          <Ionicons name="sunny-outline" color="white" />
          <Text className="text-white font-medium text-sm">Today's Forecast</Text>
        </View>
        <Text className="text-white text-4xl font-bold">{query.data?.temperature}°</Text>
        <Text className="text-white font-semibold text-lg">{query.data?.description}</Text>
      </View>
      <View className="items-center rounded-xl gap-y-2">
        <Image source={query.data?.imgSrc} style={{ width: 96, height: 96 }} />
      </View>
    </View>
  );
};

const ScheduleCard = ({ className = "" }: { className?: string; }) => {
  const router = useRouter();

  const query = useContext(HomeContext)?.latestSchedulesQuery;
  if (!query) return null;

  return (
    <View className={`bg-white p-8 rounded-2xl ${className}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-x-4">
          <Ionicons name="calendar-outline" size={24} color="blue" />
          <Text className="text-xl font-bold text-slate-500">SCHEDULE</Text>
        </View>
        <TouchableOpacity onPress={() => router.navigate("/home/scheduler")} activeOpacity={0.7}>
          <Ionicons name="open-outline" size={20} />
        </TouchableOpacity>
      </View>
      <View className="mt-8 gap-y-6">
        { query.isFetching && <ActivityIndicator size="small" color="#0891b2" /> }
        { query.data && query.data.map((item, i) => <ScheduleRecord schedule={item} key={i} />) }
        { query.data && query.data.length === 0 && <Text className="text-center text-slate-500 italic font-medium">No schedules for next 48 hours!</Text> }
      </View>
    </View>
  );
};

export const OCCASION_CHIP_COLORS: Record<string, { bg: string; text: string }> = {
  "Formal": { bg: 'bg-violet-100', text: 'text-violet-500' },
  "Casual": { bg: 'bg-green-100', text: 'text-green-600' },
  "Smart casual": { bg: 'bg-blue-100', text: 'text-blue-600' },
  "Sportswear": { bg: 'bg-orange-100', text: 'text-orange-600' },
  "Part": { bg: 'bg-pink-100', text: 'text-pink-600' },
  "Work": { bg: 'bg-indigo-100', text: 'text-indigo-600' },
};

const ScheduleRecord = ({schedule}: {schedule: Schedule}) => {

  const timeString = schedule.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateLabel = getDateLabel(schedule.timestamp);

  const theme = OCCASION_CHIP_COLORS[schedule.occasion];

  return (
    <View className="flex-row items-center">
      <View className="items-center w-20">
        <Text className="text-slate-400 text-sm font-medium">{dateLabel}</Text>
        <Text className="font-bold text-md">{timeString}</Text>
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
  const [selectedOccasion, setSelectedOccasion] = useState<ClothingOccasion>("Casual");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState<OutfitGenerationResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const {latestSchedulesQuery, weatherQuery} = useContext(HomeContext)!;
  const schedule = latestSchedulesQuery.data ? latestSchedulesQuery.data[0] : null;
  const currentContext = schedule ? `${schedule.title} ${schedule.occasion}` : selectedOccasion;

  const currentOutfit = currentIndex >= 0 && currentIndex < history.length ? history[currentIndex] : undefined;

  const generateRecommendation = async (isRetry = false) => {
    setLoading(true);

    let weatherData;
    if (schedule) {
      weatherData = await getForecastWeather(6.9271, 79.8612, schedule.timestamp);
    } else {
      weatherData = weatherQuery.data;
    }

    if (!weatherData) throw new Error("Weather missing");

    const result = schedule 
      ? await getScheduleRecommendation(weatherData, currentContext, isRetry)
      : await getRecommendation(weatherData, currentContext, isRetry);

    // Update history
    setHistory(prev => [...prev, result]);
    setCurrentIndex(prev => prev + 1);

    setLoading(false);
  };

  const queryClient = useQueryClient();
  const mutationSave = useMutation({
    mutationFn: async () => {
      if (!currentOutfit) return false;
      return await saveOutfit(currentOutfit.outfit, schedule?.occasion || selectedOccasion);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTFIT_LIST_KEY });
      Alert.alert("Success", "Outfit saved successfully.");
    },
    onError: () => {
      Alert.alert("Error", "Failed to save outfit.");
    }
  });

  const handleRetry = async () => {
    if (!currentOutfit) return;
    
    if (history.length >= 6) {
      Alert.alert("Limit Reached", "You've reached the maximum retries for this session.");
      return;
    }

    // Record the rejection to the backend for learning
    const weather = weatherQuery.data!;
    await recordRejection(weather, currentContext, currentOutfit.outfit, currentOutfit.reason);

    // Fetch a new one
    generateRecommendation(true);
  };

  const handleAccept = async () => {
    if (!currentOutfit) return;
    const weather = weatherQuery.data!;
    await acceptOutfit(weather, currentContext, currentOutfit.outfit, currentOutfit.reason);
    setAccepted(true);
    Alert.alert("Stylist Noted!", "I'll remember you liked this look.");
  };

  useEffect(() => {
    if (schedule)
      generateRecommendation(false);
  }, []);

  return (
    <View className={`bg-white p-8 rounded-2xl ${className}`}>
      <View className="flex-row items-center gap-x-4">
        <Ionicons name="shirt-outline" size={24} color="blue" />
        <Text className="text-xl font-bold text-slate-500">OUTFIT OF THE DAY</Text>
      </View>

      {
        history.length === 0 && !schedule &&
        <View className="mt-8 gap-y-6">
          <Text className="text-slate-500 font-medium">Generate today's outfit.</Text>
          
          <View className="flex-row items-center gap-x-3">
            {
              /* Select Occasion */
              !schedule &&
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
            }

            {/* Generate button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => generateRecommendation(false)}
              className="bg-slate-800 p-4 rounded-xl items-center shadow-lg justify-center"
            >
              <Text className="text-white text-lg font-medium">Generate Outfit</Text>
            </TouchableOpacity>
          </View>
        </View>
      }

      {
        currentOutfit &&
        <>
          <View className="flex-row mt-8 items-center justify-between">
            {/* AI Pick decorator */}
            <View className="bg-blue-600 flex-row items-center gap-2 self-start px-3 py-1 rounded-full">
              <Ionicons name="chatbubble-outline" color="white" />
              <Text className="text-white text-sm">AI Pick {currentIndex + 1}/{history.length}</Text>
            </View>

            {/* Save outfit button */}
            <TouchableOpacity onPress={() => mutationSave.mutate()} activeOpacity={0.7} className="flex-row items-center gap-x-2 border border-blue-600 px-3 py-1 rounded-lg">
              <Ionicons name="save-outline" size={16} color="#2563eb" />
              <Text className="text-blue-600 font-medium text-sm">Save Outfit</Text>
            </TouchableOpacity>
          </View>

          {/* Reason text */}
          <Text className="text-slate-500 italic mt-4 font-medium">"{currentOutfit.reason}"</Text>

          {/* Outfit items */}
          <ScrollView horizontal contentContainerClassName="gap-x-4 pb-4" className="mt-4">
            <OutfitItem item={currentOutfit.outfit.topwear} />
            <OutfitItem item={currentOutfit.outfit.bottomwear} />
            <OutfitItem item={currentOutfit.outfit.footwear} />
            { currentOutfit.outfit.outerwear && <OutfitItem item={currentOutfit.outfit.outerwear} /> }
          </ScrollView>

          {
            /* History navigation */

            history.length >= 1 &&
            <View className="flex-row gap-x-4 my-2 ms-auto">
              <TouchableOpacity 
                onPress={() => setCurrentIndex(i => i - 1)} 
                disabled={currentIndex === 0}
                className={currentIndex === 0 ? "opacity-20" : ""}
              >
                <Ionicons name="arrow-back-circle" size={32} color="#1e293b" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setCurrentIndex(i => i + 1)} 
                disabled={currentIndex === history.length - 1}
                className={currentIndex === history.length - 1 ? "opacity-20" : ""}
              >
                <Ionicons name="arrow-forward-circle" size={32} color="#1e293b" />
              </TouchableOpacity>
            </View>
          }

          {
            /* Outfit accept / retry buttons */
            !accepted &&
            <View className="flex-row w-full gap-x-4 mt-4">
              <TouchableOpacity activeOpacity={0.8} onPress={handleRetry} className="bg-red-100 px-3 py-3 rounded-xl">
                <Ionicons name="refresh-outline" size={24} color="red" />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={handleAccept} className="flex-row items-center bg-slate-800 px-3 py-3 rounded-xl gap-x-4 flex-grow justify-center">
                <Ionicons name="checkmark-outline" size={24} color="white" />
                <Text className="text-white font-medium text-lg">Wear This</Text>
              </TouchableOpacity>
            </View>
          }
        </>
      }

      { loading && <ActivityIndicator className="my-4" /> }
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