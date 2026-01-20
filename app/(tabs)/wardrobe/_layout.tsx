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
            name="[id]"
            options={{
                title: "Clothing Item",
                headerShown: true
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
  )
}