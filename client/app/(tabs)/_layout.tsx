import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme.web';
import { MaterialIcons } from '@expo/vector-icons';
import { QueryClient } from '@tanstack/react-query';
import { Tabs } from 'expo-router';
import React from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity
    }
  }
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage
});

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="home" color={color} />
          }}
        />
        <Tabs.Screen
          name="outfits"
          options={{
            title: 'Outfits',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="auto-awesome" color={color} />
          }}
        />
        <Tabs.Screen
          name="wardrobe"
          options={{
            title: 'Wardrobe',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="grid-view" color={color} />
          }}
        />
        <Tabs.Screen
          name="assistant"
          options={{
            title: 'Assistant',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="chat-bubble-outline" color={color} />
          }}
        />
      </Tabs>
    </PersistQueryClientProvider>
  );
}