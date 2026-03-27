import { login } from "@/services/auth-service";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (!success) Alert.alert("Error", "Invalid email or password.");
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
            ? <ActivityIndicator color="#fff" />
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

      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;