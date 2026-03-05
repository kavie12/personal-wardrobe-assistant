import { HOME_RECOMMENDATION_KEY, SCHEDULE_LIST_KEY } from "@/constants/query_keys";
import { CLOTHING_OCCASIONS, SAMPLE_USER_ID } from "@/data";
import { useColorScheme } from "@/hooks/use-color-scheme.web";
import Schedule from "@/models/Schedule";
import { addSchedule, deleteSchedule, fetchSchedules } from "@/services/schedule_service";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Scheduler = () => {
  const [openAddModal, setOpenAddModal] = useState(false);

  return (
    <SafeAreaView className="flex-1">
      <Header openAddModal={() => setOpenAddModal(true)} className="mt-4" />
      <ScheduleList className="mt-8" />
      <ScheduleAddModal visible={openAddModal} onClose={() => setOpenAddModal(false)} />
    </SafeAreaView>
  );
};

const Header = ({ openAddModal, className = "" }: { openAddModal: () => void; className?: string; }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  return (
    <View className={`flex-row items-center justify-between mx-4 ${className}`}>
      <View className="flex-row items-center gap-x-8">
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="arrow-back-outline" size={24} onPress={router.back} color={colorScheme === "dark" ? "white" : "black"} />
        </TouchableOpacity>
        <Text className="text-3xl font-bold dark:text-white">Scheduler</Text>
      </View>
      <TouchableOpacity activeOpacity={0.7}>
        <Ionicons name="add-outline" size={28} onPress={openAddModal} color={colorScheme === "dark" ? "white" : "black"} />
      </TouchableOpacity>
    </View>
  );
};

const ScheduleList = ({ className = "" }: { className?: string }) => {
  const query = useQuery({
    queryKey: SCHEDULE_LIST_KEY,
    queryFn: () => fetchSchedules(SAMPLE_USER_ID),
    staleTime: Infinity,
    gcTime: Infinity
  });

  return (
    <View className={`flex-1 gap-y-4 ${className}`}>
      <FlatList
        data={query.data}
        renderItem={({item}) => <ScheduleRecord schedule={item} />}
        ListEmptyComponent={query.isPending ? <ActivityIndicator size="large" color="#0891b2" /> : <EmptySchedule />}
        contentContainerClassName="gap-y-4 px-4"
      />
    </View>
  );
};

const getDateLabel = (date: Date) => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, tomorrow)) return "Tomorrow";

  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
  };

  if (date.getFullYear() !== today.getFullYear()) {
    options.year = "numeric";
  }

  return date.toLocaleDateString(undefined, options);
};

export const OCCASION_CHIP_COLORS: Record<string, { bg: string; text: string }> = {
  "Formal": { bg: 'bg-violet-100', text: 'text-violet-500' },
  "Casual": { bg: 'bg-green-100', text: 'text-green-600' },
  "Smart casual": { bg: 'bg-blue-100', text: 'text-blue-600' },
  "Sportswear": { bg: 'bg-orange-100', text: 'text-orange-600' },
  "Part": { bg: 'bg-pink-100', text: 'text-pink-600' },
  "Work": { bg: 'bg-indigo-100', text: 'text-indigo-600' },
};

const ScheduleRecord = ({ schedule }: { schedule: Schedule; }) => {
  const [selected, setSelected] = useState(false);

  const timeString = schedule.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateLabel = getDateLabel(schedule.timestamp);

  const theme = OCCASION_CHIP_COLORS[schedule.occasion];

  const openDeleteAlert = () =>
    Alert.alert('Delete this schedule', 'Do you want to delete this schedule', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {text: 'OK', onPress: () => mutationDelete.mutate()},
    ]);

  const queryClient = useQueryClient();

  const mutationDelete = useMutation({
    mutationFn: () => deleteSchedule(schedule.id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: HOME_RECOMMENDATION_KEY });
    }
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={() => setSelected(!selected)}
      className={`${selected ? "bg-slate-200" : "bg-white"} flex-row items-center p-4 rounded-xl`}
    >
      <View className="items-center w-20">
        <Text className="text-slate-400 text-sm font-medium">{dateLabel}</Text>
        <Text className="font-bold text-md">{timeString}</Text>
      </View>
      <View className="mx-6 w-[1px] h-full bg-slate-300"></View>
      <View className="gap-y-1">
        <Text numberOfLines={1} className="font-medium text-lg text-slate-800">{schedule.title}</Text>
        <Text className={`${theme.bg} ${theme.text} font-semibold text-sm self-start px-3 py-1 rounded-full`}>{schedule.occasion.toUpperCase()}</Text>
      </View>
      {selected &&
        <>
          <View className="ms-auto mr-2 w-[1px] h-full bg-slate-300"></View>
          <TouchableOpacity activeOpacity={0.7} onPress={openDeleteAlert}>
            <Ionicons name="trash-outline" color="#e0263c" size={16} className="mr-2" />
          </TouchableOpacity>
        </>
      }
    </TouchableOpacity>
  );
};

const ScheduleAddModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [title, setTitle] = useState("");
  const [occasion, setOccasion] = useState(CLOTHING_OCCASIONS[0]);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (schedule: Schedule) => {
      setLoading(true);
      return await addSchedule(schedule)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: HOME_RECOMMENDATION_KEY });
    },
    onSettled: () => {
      setLoading(false);
      onClose();
    }
  });

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable 
        className="flex-1 bg-black/40 justify-center items-center px-6" 
        onPress={onClose}
      >
        {/* Modal Card */}
        <Pressable className="bg-white w-full rounded-3xl p-8 shadow-xl" onPress={(e) => e.stopPropagation()}>
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-slate-800">New Schedule</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={28} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Title Input */}
          <View className="mb-6">
            <Text className="text-slate-500 font-semibold mb-2 ml-1">EVENT TITLE</Text>
            <TextInput
              className="bg-slate-100 p-4 rounded-xl text-lg text-slate-800 font-medium"
              placeholder="Meeting with..."
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Occasion Picker */}
          <View className="mb-6">
            <Text className="text-slate-500 font-semibold mb-2 ml-1">OCCASION</Text>
            <View className="bg-slate-100 rounded-xl overflow-hidden">
              <Picker
                selectedValue={occasion}
                onValueChange={(value) => setOccasion(value)}
                style={{ height: 50 }}
              >
                {CLOTHING_OCCASIONS.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Date & Time Selectors */}
          <View className="flex-row gap-x-4 mb-8">
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              className="flex-1 bg-blue-50 p-4 rounded-xl items-center border border-blue-100"
            >
              <Ionicons name="calendar-outline" size={20} color="#2563eb" />
              <Text className="text-blue-600 font-bold mt-1">{date.toLocaleDateString()}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowTimePicker(true)}
              className="flex-1 bg-blue-50 p-4 rounded-xl items-center border border-blue-100"
            >
              <Ionicons name="time-outline" size={20} color="#2563eb" />
              <Text className="text-blue-600 font-bold mt-1">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            className={`${loading ? "bg-slate-400" : "bg-blue-600"} p-4 rounded-2xl items-center shadow-lg shadow-blue-300`}
            onPress={() => mutation.mutate(new Schedule(undefined, title, occasion, date, time))}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text className="text-white text-lg font-bold">Add to Schedule</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(e, d) => { setShowDatePicker(false); if(d) setDate(d); }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={(e, t) => { setShowTimePicker(false); if(t) setTime(t); }}
        />
      )}
    </Modal>
  );
};

const EmptySchedule = () => {
  return (
    <View className="flex-1 items-center justify-center py-20 px-10">
      <View className="bg-gray-100 dark:bg-neutral-800 p-6 rounded-full mb-4">
        <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
      </View>
      <Text className="text-xl font-semibold text-gray-800 dark:text-gray-100 text-center">
        No schedules yet
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
        Tap the "+" button to start adding schedules.
      </Text>
    </View>
  );
};

export default Scheduler;