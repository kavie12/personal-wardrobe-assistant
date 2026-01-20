import { Stack } from 'expo-router'
import React from 'react'

export default function StackLayout() {
  return (
    <Stack
        screenOptions={{
            headerStyle: {
                backgroundColor: "transparent"
            },
            headerTitleStyle: {
                fontWeight: "bold",
                fontSize: 28
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
            name="[clothingItemId]"
            options={{
                title: "Clothing Item",
                headerShown: true
            }}
        />
    </Stack>
  )
}