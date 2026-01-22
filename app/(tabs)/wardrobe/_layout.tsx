import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import React from 'react';

const queryClient = new QueryClient();

export default function StackLayout() {
  return (
    <QueryClientProvider client={queryClient}>
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: "transparent"
                },
                headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 24
                },
                headerShadowVisible: false
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: "Wardrobe",
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: "Clothing Item",
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="add"
                options={{
                    title: "Add Clothing Item",
                    headerShown: true
                }}
            />
        </Stack>
    </QueryClientProvider>
  )
}