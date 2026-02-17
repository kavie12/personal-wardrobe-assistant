import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme.web';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
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
        name="wardrobe"
        options={{
          title: 'Wardrobe',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="grid-view" color={color} />
        }}
      />
    </Tabs>
  );
}