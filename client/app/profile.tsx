import { useAuth } from "@/context/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme.web";
import { deleteAccount } from "@/services/auth-service";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileScreen = () => {
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);

  const { user, logout } = useAuth();

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
            onPress={() => setDeleteAccountModalVisible(true)}
          />
        </View>
      </View>

      <ChangePasswordModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
      />

      <DeleteAccountModal
        visible={deleteAccountModalVisible}
        onClose={() => setDeleteAccountModalVisible(false)}
      />
      
    </SafeAreaView>
  );
};

const ChangePasswordModal = ({ visible, onClose }: { visible: boolean; onClose: () => void; }) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const { changePassword } = useAuth();

  const handleSave = async () => {
    if (next !== confirm) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    await changePassword(current, next);
    onClose();
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
  
const DeleteAccountModal = ({ visible, onClose }: { visible: boolean, onClose: () => void }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const colorScheme = useColorScheme();

  const handleDeletePassword = async () => {
    if (!password) {
      Alert.alert("Error", "Please enter your password.");
      return;
    }
    setLoading(true);
    await deleteAccount(password);
    setLoading(false);
    Alert.alert("Success", "Account deleted successfully.", [
      { text: "OK", onPress: onClose },
    ]);
  };

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-center px-6"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1}>
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 gap-y-5">

            {/* Header */}
            <View className="gap-y-1">
              <Text className="text-xl font-bold text-slate-800 dark:text-white">Delete Account</Text>
              <Text className="text-slate-400 text-sm">
                Enter your password to confirm account deletion.
              </Text>
            </View>

            {/* Password input */}
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              className="bg-slate-100 dark:bg-slate-700 rounded-2xl px-4 py-4 text-slate-800 dark:text-white"
            />

            {/* Buttons */}
            <View className="flex-row gap-x-3">
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                className="flex-1 py-4 rounded-2xl items-center border border-slate-200 dark:border-slate-600"
              >
                <Text className="text-slate-600 dark:text-slate-300 font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeletePassword}
                activeOpacity={0.8}
                disabled={loading}
                className="flex-1 bg-slate-800 dark:bg-white py-4 rounded-2xl items-center"
              >
                {loading
                  ? <ActivityIndicator color={colorScheme === "dark" ? "#000" : "#fff"} />
                  : <Text className="text-white dark:text-slate-800 font-semibold">Delete Account</Text>
                }
              </TouchableOpacity>
            </View>

          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default ProfileScreen;