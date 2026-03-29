import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme.web";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TemperatureScale = "C" | "F";

const ProfileScreen = () => {
    // const [tempScale, setTempScale] = useState<TemperatureScale>("C");
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);

    const { user, logout, changePassword, deleteAccount } = useAuth();

    return (
      <SafeAreaView className="flex-1">
        <Header className="mt-4" />

        <View className="px-6 mt-8">
          {/* Avatar + User Info */}
          <View className="items-center gap-y-3">
            <View className="w-20 h-20 rounded-full bg-blue-200 dark:bg-slate-200 items-center justify-center">
              <Text className="text-blue-600 dark:text-slate-800 text-2xl font-bold">{ user?.displayName?.charAt(0) }</Text>
            </View>
            <View className="items-center gap-y-1">
              <Text className="text-xl font-bold text-slate-800 dark:text-white">{ user?.displayName }</Text>
              <Text className="text-sm text-slate-400">{ user?.email }</Text>
            </View>
          </View>

          {/* Preferences */}
          {/* <View className="mt-10 gap-y-2">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 ml-1">
                  Preferences
              </Text>
              <SettingsItem icon="thermometer-outline" label="Temperature Scale">
                  <View className="flex-row bg-slate-300 dark:bg-slate-700 rounded-xl p-1 gap-x-1">
                      {(["C", "F"] as TemperatureScale[]).map((scale) => (
                          <TouchableOpacity
                              key={scale}
                              onPress={() => setTempScale(scale)}
                              activeOpacity={0.7}
                              className={`px-3 py-1 rounded-lg ${
                                  tempScale === scale
                                  ? "bg-white dark:bg-slate-500"
                                  : ""
                              }`}
                          >
                              <Text className={`text-sm font-medium ${
                                  tempScale === scale
                                  ? "text-slate-800 dark:text-white"
                                  : "text-slate-500"
                              }`}>
                                  {scale === "C" ? "°C" : "°F"}
                              </Text>
                          </TouchableOpacity>
                      ))}
                  </View>
              </SettingsItem>
          </View> */}

          {/* Account */}
          <View className="mt-6 gap-y-2">
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 ml-1">
              Account
            </Text>
            <SettingsItem
              icon="lock-closed-outline"
              label="Change Password"
              showViewIcon
              onPress={() => setPasswordModalVisible(true)}
            />
            <SettingsItem
              icon="log-out-outline"
              label="Log Out"
              showViewIcon
              onPress={logout}
            />
            <SettingsItem
              icon="trash-outline"
              label="Delete Account"
              textRed
              onPress={() => {}}
            />
          </View>
        </View>

        <ChangePasswordModal
          visible={passwordModalVisible}
          onClose={() => setPasswordModalVisible(false)}
          onSave={(current, next) => {
            changePassword(current, next);
            setPasswordModalVisible(false);
          }}
        />
      </SafeAreaView>
    );
};

const ChangePasswordModal = ({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (current: string, next: string) => void;
}) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSave = () => {
    if (next !== confirm) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    onSave(current, next);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center px-6">
        <View className="bg-white dark:bg-slate-800 rounded-2xl p-6 gap-y-4">
          <Text className="text-lg font-bold text-slate-800 dark:text-white">Change Password</Text>
          <TextInput
            value={current}
            onChangeText={setCurrent}
            placeholder="Current password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            className="bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white"
          />
          <TextInput
            value={next}
            onChangeText={setNext}
            placeholder="New password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            className="bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white"
          />
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm new password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            className="bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white"
          />
          <View className="flex-row gap-x-3 mt-2">
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 items-center"
            >
              <Text className="text-slate-500 font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.7}
              className="flex-1 py-3 rounded-xl bg-slate-800 dark:bg-white items-center"
            >
              <Text className="text-white dark:text-slate-800 font-medium">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const SettingsItem = ({ icon, label, textRed = false, showViewIcon = false, onPress = () => {}, children = <></> }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  textRed?: boolean;
  showViewIcon?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
}) => {
  const colorScheme = useColorScheme();
  const iconColor = textRed
    ? "#ef4444"
    : colorScheme === "dark" ? "#94a3b8" : "#64748b";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center justify-between bg-gray-200 dark:bg-slate-800 px-4 py-4 rounded-2xl"
    >
      <View className="flex-row items-center gap-x-3">
        <Ionicons name={icon} size={20} color={iconColor} />
        <Text className={`text-[15px] font-medium ${textRed ? "text-red-500" : "text-slate-700 dark:text-slate-200"}`}>
          {label}
        </Text>
      </View>
      { children }
      {showViewIcon &&
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colorScheme === "dark" ? "#475569" : "#a8b2bd"}
        />
      }
    </TouchableOpacity>
  );
};

const Header = ({ className = "" }: { className?: string; }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  return (
    <View className={`flex-row items-center justify-between mx-4 ${className}`}>
      <View className="flex-row items-center gap-x-8">
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="arrow-back-outline" size={24} onPress={router.back} color={colorScheme === "dark" ? "white" : "black"} />
        </TouchableOpacity>
        <Text className="text-3xl font-bold dark:text-white">Profile</Text>
      </View>
    </View>
  );
};

export default ProfileScreen;