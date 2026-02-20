import { CLOTHING_OCCASIONS } from "@/data";
import { useColorScheme } from "@/hooks/use-color-scheme.web";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Scheduler = () => {

  const [openAddModal, setOpenAddModal] = useState(false);

  return (
    <SafeAreaView className="flex-1">
      <Header openAddModal={() => setOpenAddModal(true)} className="mt-4" />
      <ScheduleList className="mt-8" />
      <ScheduleModal visible={openAddModal} onClose={() => setOpenAddModal(false)} />
    </SafeAreaView>
  );
};

const Header = ({ openAddModal, className = "" }: { openAddModal: () => void; className?: string; }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  return (
    <View className={`flex-row items-center justify-between mx-4 ${className}`}>
      <View className="flex-row items-center gap-x-8">
        <Ionicons name="arrow-back-outline" size={24} onPress={router.back} color={colorScheme === "dark" ? "white" : "black"} />
        <Text className="text-3xl font-bold dark:text-white">Scheduler</Text>
      </View>
      <Ionicons name="add-outline" size={28} onPress={openAddModal} color={colorScheme === "dark" ? "white" : "black"} />
    </View>
  );
};

const ScheduleList = ({ className = "" }: { className?: string }) => {
  return (
    <View className={`flex-1 mx-4 gap-y-4 ${className}`}>
      <ScheduleRecord date={new Date()} title="Supervisor meeting" occasion="Formal" />
      <ScheduleRecord date={new Date()} title="Dayout" occasion="Casual" />
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
    <Pressable className="flex-row items-center bg-white p-4 rounded-xl">
      <View className="items-center">
        <Text className="font-bold text-lg">{time}</Text>
        <Text className="text-slate-400 text-sm font-medium">{ampm}</Text>
      </View>
      <View className="mx-6 w-[1px] h-full bg-slate-300"></View>
      <View className="gap-y-1">
        <Text numberOfLines={1} className="font-medium text-lg text-slate-800">{title}</Text>
        <Text className={`${theme.bg} ${theme.text} font-semibold text-sm self-start px-3 py-1 rounded-full`}>{occasion.toUpperCase()}</Text>
      </View>
    </Pressable>
  );
};

const ScheduleModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [title, setTitle] = useState("");
  const [occasion, setOccasion] = useState(CLOTHING_OCCASIONS[0]);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable 
        className="flex-1 bg-black/50 justify-center items-center px-6" 
        onPress={onClose}
      >
        {/* Modal Card */}
        <Pressable className="bg-white w-full rounded-3xl p-8 shadow-xl" onPress={(e) => e.stopPropagation()}>
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-slate-800">New Schedule</Text>
            <TouchableOpacity onPress={onClose}>
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
            className="bg-blue-600 p-4 rounded-2xl items-center shadow-lg shadow-blue-300"
            onPress={() => {
              console.log("Saved:", { title, occasion, date, time });
              onClose();
            }}
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

export default Scheduler;