import { HOME_CURRENT_WEATHER_KEY, HOME_MANUAL_RECOMMENDATION_KEY, HOME_SCHEDULE_LIST_KEY, HOME_SCHEDULE_RECOMMENDATION_KEY, OUTFIT_LIST_KEY } from '@/constants/query_keys';
import { CLOTHING_OCCASIONS } from '@/data';
import ClothingItem from '@/models/ClothingItem';
import OutfitGenerationResponse from '@/models/OutfitGenerationResponse';
import Schedule from '@/models/Schedule';
import Weather from '@/models/Weather';
import { saveOutfit } from '@/services/outfits-service';
import { getRecommendation } from '@/services/recommendation-service';
import { fetchLatestSchedulesByHours } from '@/services/schedule-service';
import { getCurrentWeather, getForecastWeather } from '@/services/weather-service';
import { ClothingOccasion } from '@/types';
import { getDateLabel } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeContext = createContext<{ latestSchedulesQuery: UseQueryResult<Schedule[], Error>, weatherQuery: UseQueryResult<Weather | null, Error> } | null>(null);

const HomeScreen = () => {
  const latestSchedulesQuery = useQuery({
    queryKey: HOME_SCHEDULE_LIST_KEY,
    queryFn: () => fetchLatestSchedulesByHours(48),
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
  const router = useRouter()
  return (
    <View className={`flex-row justify-between items-center ${className}`}>
      <View className="gap-y-1">
        <Text className="text-md font-medium text-slate-500 dark:text-slate-400">GOOD MORNING,</Text>
        <Text className="text-3xl font-bold text-slate-800 dark:text-slate-200">Kaveesha</Text>
      </View>
      <TouchableOpacity onPress={() => router.navigate("/profile")} activeOpacity={0.7} className="bg-blue-200 rounded-full w-14 h-14 justify-center items-center">
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

const outfitCardModes = ["Manual", "Schedule"];

const OutfitCard = ({ className = "" }: { className: string; }) => {
  const [activeMode, setActiveMode] = useState(0);
  const underlineX = useRef(new Animated.Value(0)).current;
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const modeWidth = tabBarWidth / outfitCardModes.length;

  const {latestSchedulesQuery} = useContext(HomeContext)!;
  const schedule = latestSchedulesQuery.data ? latestSchedulesQuery.data[0] : null;

  const changeMode = (index: number) => {
    setActiveMode(index);
    Animated.spring(underlineX, {
      toValue: index * modeWidth,
      useNativeDriver: true,
      tension: 120,
      friction: 10,
    }).start();
  };

  useEffect(() => {
    if (schedule && tabBarWidth > 0) {
      changeMode(1);
    }
  }, [schedule, tabBarWidth]);

  return (
    <View className={`bg-white p-8 rounded-2xl ${className}`}>
      {/* Header */}
      <View className="flex-row items-center gap-x-4">
        <Ionicons name="shirt-outline" size={24} color="blue" />
        <Text className="text-xl font-bold text-slate-500">OUTFIT OF THE DAY</Text>
      </View>

      {/* Mode Tabs UI */}
      <View
        className="flex-row border-b border-gray-200 relative mt-4"
        onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}
      >
        {outfitCardModes.map((mode, index) => (
          <TouchableOpacity
            key={index}
            className="flex-1 py-3.5 items-center"
            onPress={() => changeMode(index)}
            activeOpacity={0.7}
          >
            <Text
              className={`text-[15px] ${
                activeMode === index
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-400 font-normal'
              }`}
            >
              {mode}
            </Text>
          </TouchableOpacity>
        ))}
        <Animated.View
          className="absolute bottom-0 h-[3px] bg-blue-600 rounded-full"
          style={{
            width: modeWidth * 0.7,
            marginLeft: modeWidth * 0.15,
            transform: [{ translateX: underlineX }],
          }}
        />
      </View>

      {
        // Outfit Section
        activeMode === 0 ?
          <ManualOutfit />
          :
          <ScheduleOutfit />
      }
    </View>
  );
};

const ManualOutfit = () => {
  const [accepted, setAccepted] = useState(false);

  const {weatherQuery} = useContext(HomeContext)!;
  const [selectedOccasion, setSelectedOccasion] = useState<ClothingOccasion>("Casual");

  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: HOME_MANUAL_RECOMMENDATION_KEY,
    queryFn: async () => {
      if (!weatherQuery.data) {
        throw new Error("Weather data not available");
      }
      console.log("General recommendation with weather data:", { description: weatherQuery.data.description, temperature: weatherQuery.data.temperature }, selectedOccasion);
      return await getRecommendation({ description: weatherQuery.data.description, temperature: weatherQuery.data.temperature }, selectedOccasion);
    },
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: false
  });

  const handleAccept = async () => {
    if (!query.data) return;
    setAccepted(true);
  };

  const handleRetry = async () => {
    if (!query.data) return;
    queryClient.resetQueries({ queryKey: HOME_MANUAL_RECOMMENDATION_KEY });
  };

  return (
    <>
      {
        !query.isFetched &&
        <View className="mt-8 gap-y-6">
          <Text className="text-slate-500 font-medium">
            Generate today's outfit.
          </Text>

          <View className="flex-row items-center gap-x-3">
            {/* Select Occasion */}
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

            {/* Generate button */}
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

      <OutfitItemView
        isFetching={query.isFetching}
        data={query.data}
        occasion={selectedOccasion}
        accepted={accepted}
        handleAccept={handleAccept}
        handleRetry={handleRetry}
      />

      { query.isFetching && <ActivityIndicator className="my-4" /> }
    </>
  );
};

const ScheduleOutfit = () => {
  const [accepted, setAccepted] = useState(false);

  const {latestSchedulesQuery} = useContext(HomeContext)!;
  const schedule = latestSchedulesQuery.data ? latestSchedulesQuery.data[0] : null;

  const query = useQuery({
    queryKey: HOME_SCHEDULE_RECOMMENDATION_KEY,
    queryFn: async () => {
      if (!schedule) throw new Error("Schedule data not available.");

      const scheduleString = `${schedule.title} | ${schedule.timestamp.toLocaleString()} | ${schedule.occasion}`;
      const weatherData = await getForecastWeather(6.9271, 79.8612, schedule.timestamp);
      if (!weatherData) throw new Error("Weather data not available");

      console.log("Schedule-based recommendation with weather data:", { description: weatherData.description, temperature: weatherData.temperature }, scheduleString);

      return await getRecommendation({ description: weatherData.description, temperature: weatherData.temperature }, scheduleString);
    },
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: !!schedule
  });

  const handleAccept = async () => {
    if (!query.data) return;
    setAccepted(true);
  };

  const handleRetry = async () => {
    if (!query.data) return;
    query.refetch();
  };

  if (query.isFetching) return <ActivityIndicator className="my-4" />;

  return (
    <>
      {
         !schedule ?
          <Text className="text-slate-500 font-medium mt-8">No schedules for next 48 hours!</Text>
          :
          <OutfitItemView
            isFetching={query.isFetching}
            data={query.data}
            occasion={schedule.occasion}
            accepted={accepted}
            handleAccept={handleAccept}
            handleRetry={handleRetry}
          />
      }
    </>
  );
};

const OutfitItemView = ({ isFetching, data, occasion, handleAccept, handleRetry, accepted } : {
  isFetching: boolean;
  data: OutfitGenerationResponse | undefined;
  occasion: string;
  accepted: boolean;
  handleAccept: () => void;
  handleRetry: () => void;
}) => {
  const queryClient = useQueryClient();
  const mutationSave = useMutation({
    mutationFn: async () => {
      if (!data) return false;
      return await saveOutfit(data?.outfit, occasion);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTFIT_LIST_KEY });
      Alert.alert("Success", "Outfit saved successfully.");
    },
    onError: () => {
      Alert.alert("Error", "Failed to save outfit.");
    }
  });

  return (
    <>
      {
        !isFetching && data &&
        <>
          <View className="flex-row mt-8 items-center justify-between">
            {/* AI Pick decorator */}
            <View className="bg-blue-600 flex-row items-center gap-2 self-start px-3 py-1 rounded-full">
              <Ionicons name="chatbubble-outline" color="white" />
              <Text className="text-white text-sm">AI Pick</Text>
            </View>

            {/* Save outfit button */}
            <TouchableOpacity onPress={() => mutationSave.mutate()} activeOpacity={0.7} className="flex-row items-center gap-x-2 border border-blue-600 px-3 py-1 rounded-lg">
              <Ionicons name="save-outline" size={16} color="#2563eb" />
              <Text className="text-blue-600 font-medium text-sm">Save Outfit</Text>
            </TouchableOpacity>
          </View>

          {/* Reason text */}
          <Text className="text-slate-500 italic mt-4 font-medium">"{data.reason}"</Text>

          {/* Outfit items */}
          <ScrollView horizontal contentContainerClassName="gap-x-4 pb-4" className="mt-4">
            <OutfitClothingItem item={data.outfit.topwear} />
            <OutfitClothingItem item={data.outfit.bottomwear} />
            <OutfitClothingItem item={data.outfit.footwear} />
            { data?.outfit.outerwear && <OutfitClothingItem item={data?.outfit.outerwear} /> }
          </ScrollView>

          {
            /* Outfit accept / retry buttons */
            !accepted &&
            <View className="flex-row w-full gap-x-4 mt-4">
              <TouchableOpacity activeOpacity={0.8} onPress={handleRetry} className="bg-red-100 px-6 py-3 rounded-xl">
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
    </>
  );
}

const OutfitClothingItem = ({ item }: { item: Partial<ClothingItem> }) => {
  return (
    <View className="items-center gap-y-2">
      <Image source={item.image} style={{ width: 120, height: 120, borderRadius: 12 }} />
      <Text className="font-semibold text-slate-500">{item.type}</Text>
    </View>
  );
};

export default HomeScreen;