import { HOME_CURRENT_WEATHER_KEY, HOME_MANUAL_RECOMMENDATION_KEY, HOME_SCHEDULE_LIST_KEY, HOME_SCHEDULE_RECOMMENDATION_KEY, OUTFIT_LIST_KEY } from '@/constants/query_keys';
import { CLOTHING_OCCASIONS } from '@/data';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme.web';
import { useLocation } from '@/context/location-context';
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
import OutfitClothingItem from '@/components/outfit-clothing-item';

const HomeContext = createContext<{
  latestSchedulesQuery: UseQueryResult<Schedule[], Error>,
  selectedSchedule: Schedule | null,
  setSelectedSchedule: React.Dispatch<React.SetStateAction<Schedule | null>>,
  weatherQuery: UseQueryResult<Weather | null | undefined, Error>
} | null>(null);

const HomeScreen = () => {
  const location = useLocation();

  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const latestSchedulesQuery = useQuery({
    queryKey: HOME_SCHEDULE_LIST_KEY,
    queryFn: async () => {
      return await fetchLatestSchedulesByHours(48);
    },
  });
  const weatherQuery = useQuery({
    queryKey: HOME_CURRENT_WEATHER_KEY,
    queryFn: async () => {
      if (!location.coords) return;
      return await getCurrentWeather(location.coords.lat, location.coords.lng)
    },
    staleTime: 3600000,
    gcTime: 3600000,
    enabled: !!location.coords
  });

  useEffect(() => {
    if (latestSchedulesQuery.data && latestSchedulesQuery.data.length > 0) {
      setSelectedSchedule(latestSchedulesQuery.data[0]);
    }
  }, [latestSchedulesQuery.data]);

  return (
    <HomeContext.Provider value={{ latestSchedulesQuery, selectedSchedule, setSelectedSchedule, weatherQuery }}>
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
  const router = useRouter();
  const user = useAuth().user;
  return (
    <View className={`flex-row justify-between items-center ${className}`}>
      <View className="gap-y-1">
        <Text className="text-md font-medium text-slate-500 dark:text-slate-400">GOOD MORNING,</Text>
        <Text className="text-3xl font-bold text-slate-800 dark:text-slate-200">{ user?.displayName?.split(" ")[0] }</Text>
      </View>
      <TouchableOpacity onPress={() => router.navigate("/profile")} activeOpacity={0.7} className="bg-blue-200 rounded-full w-14 h-14 justify-center items-center">
        <Text className="text-lg font-bold text-blue-600">{ user?.displayName?.charAt(0) }</Text>
      </TouchableOpacity>
    </View>
  );
};

const WeatherCard = ({ className = "" }: { className?: string; }) => {

  const query = useContext(HomeContext)?.weatherQuery;
  if (!query) return null;

  return (
    <View className={`bg-sky-600 dark:bg-sky-800 flex-row items-center justify-between p-8 rounded-2xl ${className}`}>
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
  const colorScheme = useColorScheme();

  const query = useContext(HomeContext)?.latestSchedulesQuery;
  if (!query) return null;

  return (
    <View className={`bg-white dark:bg-slate-800 p-8 rounded-2xl ${className}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-x-4">
          <Ionicons name="calendar-outline" size={24} color={colorScheme === 'dark' ? 'white' : 'blue'} />
          <Text className="text-xl font-bold text-slate-500 dark:text-slate-200">SCHEDULE</Text>
        </View>
        <TouchableOpacity onPress={() => router.navigate("/home/scheduler")} activeOpacity={0.7}>
          <Ionicons name="open-outline" size={20} color={colorScheme === 'dark' ? 'white' : 'black'} />
        </TouchableOpacity>
      </View>
      <View className="mt-8">
        { query.isFetching && <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#FFFFFF' : '#0891b2'} /> }
        { query.data && query.data.map((item, i) => <ScheduleRecord schedule={item} key={i} />) }
        { query.data && query.data.length === 0 && <Text className="text-center text-slate-500 dark:text-slate-400 italic font-medium">No schedules for next 48 hours!</Text> }
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

const ScheduleRecord = ({ schedule }: { schedule: Schedule }) => {
  const { selectedSchedule, setSelectedSchedule } = useContext(HomeContext)!;

  const timeString = schedule.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateLabel = getDateLabel(schedule.timestamp);

  const theme = OCCASION_CHIP_COLORS[schedule.occasion];

  return (
    <View className={`flex-row items-center p-4 rounded-xl ${selectedSchedule?.id === schedule.id ? 'bg-slate-100 dark:bg-slate-900' : ''}`} onTouchEnd={() => setSelectedSchedule(schedule)}>
      <View className="items-center w-20">
        <Text className="text-slate-400 text-sm font-medium">{dateLabel}</Text>
        <Text className="font-bold text-md dark:text-white">{timeString}</Text>
      </View>
      <View className="mx-6 w-[1px] h-full bg-slate-300 dark:bg-slate-600"></View>
      <View className="gap-y-1">
        <Text numberOfLines={1} className="font-medium text-lg text-slate-800 dark:text-white">{schedule.title}</Text>
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

  const colorScheme = useColorScheme();

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
    <View className={`bg-white dark:bg-slate-800 p-8 rounded-2xl ${className}`}>
      {/* Header */}
      <View className="flex-row items-center gap-x-4">
        <Ionicons name="shirt-outline" size={24} color={colorScheme === 'dark' ? 'white' : 'blue'} />
        <Text className="text-xl font-bold text-slate-500 dark:text-slate-200">OUTFIT OF THE DAY</Text>
      </View>

      {/* Mode Tabs UI */}
      <View
        className="flex-row border-b border-gray-200 dark:border-gray-600 relative mt-4"
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
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-400 font-normal'
              }`}
            >
              {mode}
            </Text>
          </TouchableOpacity>
        ))}
        <Animated.View
          className="absolute bottom-0 h-[3px] bg-blue-600 dark:bg-blue-400 rounded-full"
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
    enabled: false
  });

  const handleRetry = async () => {
    if (!query.data) return;
    queryClient.resetQueries({ queryKey: HOME_MANUAL_RECOMMENDATION_KEY });
  };

  return (
    <>
      {
        !query.isFetched &&
        <View className="mt-8 gap-y-6">
          <Text className="text-slate-500 dark:text-slate-400 font-medium">
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
              className="bg-slate-800 dark:bg-slate-600 p-4 rounded-xl items-center shadow-lg justify-center"
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
        handleRetry={handleRetry}
      />

      { query.isFetching && <ActivityIndicator className="my-4" /> }
    </>
  );
};

const ScheduleOutfit = () => {
  const { latestSchedulesQuery, selectedSchedule } = useContext(HomeContext)!;

  const location = useLocation();
  
  const query = useQuery({
    queryKey: HOME_SCHEDULE_RECOMMENDATION_KEY(selectedSchedule?.id!),
    queryFn: async () => {
      if (!selectedSchedule) throw new Error("Schedule data not available.");
      if (!location.coords) throw new Error("Location data not available.");

      const scheduleString = `${selectedSchedule.title} | ${selectedSchedule.timestamp.toLocaleString()} | ${selectedSchedule.occasion}`;
      const weatherData = await getForecastWeather(location.coords.lat, location.coords.lng, selectedSchedule.timestamp);
      if (!weatherData) throw new Error("Weather data not available");

      console.log("Recommendation request:", { description: weatherData.description, temperature: weatherData.temperature }, scheduleString);

      return await getRecommendation({ description: weatherData.description, temperature: weatherData.temperature }, scheduleString);
    },
    enabled: !!selectedSchedule && !!location.coords
  });

  const handleRetry = async () => {
    if (!query.data) return;
    query.refetch();
  };

  if (query.isFetching) return <ActivityIndicator className="my-4" />;

  return (
    <>
      {
        latestSchedulesQuery.data && latestSchedulesQuery.data.length === 0 ?
          <Text className="text-slate-500 dark:text-slate-400 font-medium mt-8">No schedules for next 48 hours!</Text>
          :
          selectedSchedule ?
            <OutfitItemView
              isFetching={query.isFetching}
              data={query.data}
              occasion={selectedSchedule.occasion}
              handleRetry={handleRetry}
            />
            :
            <Text className="text-slate-500 dark:text-slate-400 font-medium mt-8">Select a schedule to generate an outfit!</Text>
      }
    </>
  );
};

const OutfitItemView = ({ isFetching, data, occasion, handleRetry } : {
  isFetching: boolean;
  data: OutfitGenerationResponse | undefined;
  occasion: string;
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
          {/* AI Pick decorator */}
          <View className="bg-blue-600 flex-row items-center gap-2 self-start px-3 py-1 rounded-full mt-4">
            <Ionicons name="chatbubble-outline" color="white" />
            <Text className="text-white text-sm">AI Pick</Text>
          </View>

          {/* Reason text */}
          <Text className="text-slate-500 dark:text-slate-400 italic mt-4 font-medium">"{data.reason}"</Text>

          {/* Outfit items */}
          <ScrollView horizontal contentContainerClassName="gap-x-4 pb-4" className="mt-4">
            <OutfitClothingItem item={data.outfit.topwear} />
            <OutfitClothingItem item={data.outfit.bottomwear} />
            <OutfitClothingItem item={data.outfit.footwear} />
            { data.outfit.outerwear && <OutfitClothingItem item={data.outfit.outerwear} /> }
          </ScrollView>

          {/* Outfit accept / retry buttons */}
          <View className="flex-row w-full gap-x-4 mt-4 justify-between">
            <TouchableOpacity activeOpacity={0.8} onPress={handleRetry} className="bg-red-100 px-6 py-3 rounded-xl">
              <Ionicons name="refresh-outline" size={24} color="red" />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => mutationSave.mutate()}
              className="bg-blue-100 px-6 py-3 rounded-xl flex-row items-center justify-center flex-grow gap-x-2"
            >
              <Ionicons name="save-outline" size={24} color="#2563eb" />
              <Text className="text-blue-600 font-medium">Save Outfit</Text>
            </TouchableOpacity>
          </View>

        </>
      }
    </>
  );
}

export default HomeScreen;