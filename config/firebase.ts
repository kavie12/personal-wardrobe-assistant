import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";

const app = initializeApp({
    apiKey: "AIzaSyAnAvYGv8An_u2BtI9Q3VPqFEiOizmkvzI",
    authDomain: "personal-wardrobe-assistant.firebaseapp.com",
    projectId: "personal-wardrobe-assistant",
    storageBucket: "personal-wardrobe-assistant.firebasestorage.app",
    messagingSenderId: "326299744088",
    appId: "1:326299744088:web:22647fd6b25da4aa95d72d"
});

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});