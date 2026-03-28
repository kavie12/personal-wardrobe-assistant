import firebase_config_options from "@/firebase_config_options";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";

const app = initializeApp(firebase_config_options);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});