import { useColorScheme } from "@/hooks/use-color-scheme.web";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Scheduler = () => {
  return (
    <SafeAreaView className="flex-1">
      <Header className="mt-4" />
      <ScheduleList className="mt-8" />
      <ScheduleModal />
    </SafeAreaView>
  );
};

const Header = ({ className = "" }: { className?: string }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  return (
    <View className={`flex-row items-center justify-between mx-4 ${className}`}>
      <View className="flex-row items-center gap-x-8">
        <Ionicons name="arrow-back-outline" size={24} onPress={router.back} color={colorScheme === "dark" ? "white" : "black"} />
        <Text className="text-3xl font-bold dark:text-white">Scheduler</Text>
      </View>
      <Ionicons name="add-outline" size={28} color={colorScheme === "dark" ? "white" : "black"} />
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

const ScheduleModal = ({}: {}) => {

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={true}
      >
        <View className="flex-1 justify-center items-center">
          <View className="bg-white">
            <TextInput
              className="w-80"
              placeholder="Title"
              value={title}
            />
            <Text className="w-80" onPress={() => setShowDatePicker(true)}>{date.toLocaleDateString()}</Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Scheduler;