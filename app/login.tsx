import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme.web";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [openResetModal, setOpenResetModal] = useState(false);

  const { login } = useAuth();

  const colorScheme = useColorScheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <View className="flex-1 px-6 justify-center gap-y-8">

        {/* Title */}
        <View className="gap-y-2">
          <Text className="text-3xl font-bold text-slate-800 dark:text-white">Welcome back</Text>
          <Text className="text-slate-400">Sign in to your account</Text>
        </View>

        {/* Fields */}
        <View className="gap-y-3">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-4 text-slate-800 dark:text-white"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-4 text-slate-800 dark:text-white"
          />
        </View>

        {/* Login button */}
        <TouchableOpacity
          onPress={handleLogin}
          activeOpacity={0.8}
          disabled={loading}
          className="bg-slate-800 dark:bg-white py-4 rounded-2xl items-center"
        >
          {loading
            ? <ActivityIndicator color={colorScheme === "dark" ? "#000" : "#fff"} />
            : <Text className="text-white dark:text-slate-800 font-semibold text-[15px]">Sign In</Text>
          }
        </TouchableOpacity>

        {/* Register link */}
        <View className="flex-row justify-center gap-x-1">
          <Text className="text-slate-400">Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/register")} activeOpacity={0.7}>
            <Text className="text-slate-800 dark:text-white font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center">
          <TouchableOpacity onPress={() => setOpenResetModal(true)} activeOpacity={0.7}>
            <Text className="text-slate-800 dark:text-slate-200 underline">Forgot password?</Text>
          </TouchableOpacity>
        </View>

      </View>

      <PasswordResetModal visible={openResetModal} onClose={() => setOpenResetModal(false)} />

    </SafeAreaView>
  );
};

const PasswordResetModal = ({ visible, onClose }: { visible: boolean; onClose: () => void; }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const { resetPassword } = useAuth();

  const colorScheme = useColorScheme();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    setLoading(true);
    await resetPassword(email);
    setLoading(false);
    Alert.alert("Success", "Password reset email sent. Please check your inbox.", [
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
              <Text className="text-xl font-bold text-slate-800 dark:text-white">Reset Password</Text>
              <Text className="text-slate-400 text-sm">
                Enter your email and we'll send you a reset link.
              </Text>
            </View>

            {/* Email input */}
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
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
                onPress={handleResetPassword}
                activeOpacity={0.8}
                disabled={loading}
                className="flex-1 bg-slate-800 dark:bg-white py-4 rounded-2xl items-center"
              >
                {loading
                  ? <ActivityIndicator color={colorScheme === "dark" ? "#000" : "#fff"} />
                  : <Text className="text-white dark:text-slate-800 font-semibold">Send Link</Text>
                }
              </TouchableOpacity>
            </View>

          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default LoginScreen;