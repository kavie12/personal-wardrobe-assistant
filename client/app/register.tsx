import { useColorScheme } from "@/hooks/use-color-scheme.web";
import { register } from "@/services/auth-service";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RegisterScreen = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const colorScheme = useColorScheme();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <View className="flex-1 px-6 justify-center gap-y-8">

        {/* Title */}
        <View className="gap-y-2">
          <Text className="text-3xl font-bold text-slate-800 dark:text-white">Create account</Text>
          <Text className="text-slate-400">Sign up to get started</Text>
        </View>

        {/* Fields */}
        <View className="gap-y-3">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor="#94a3b8"
            autoCapitalize="words"
            className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-4 text-slate-800 dark:text-white"
          />
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
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-4 text-slate-800 dark:text-white"
          />
        </View>

        {/* Register button */}
        <TouchableOpacity
          onPress={handleRegister}
          activeOpacity={0.8}
          disabled={loading}
          className="bg-slate-800 dark:bg-white py-4 rounded-2xl items-center"
        >
          {loading
            ? <ActivityIndicator color={colorScheme === "dark" ? "#000" : "#fff"} />
            : <Text className="text-white dark:text-slate-800 font-semibold text-[15px]">Create Account</Text>
          }
        </TouchableOpacity>

        {/* Login link */}
        <View className="flex-row justify-center gap-x-1">
          <Text className="text-slate-400">Already have an account?</Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text className="text-slate-800 dark:text-white font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

export default RegisterScreen;