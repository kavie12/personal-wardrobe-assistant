import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AssistantScreen = () => {
  return (
    <SafeAreaView className="flex-1">
        <Header className="mt-4"  />
    </SafeAreaView>
  )
};

const Header = ({ className = "" }: { className?: string; }) => {
  return (
    <View className={`flex-row items-center justify-between mx-4 ${className}`}>
        <Text className="text-3xl font-bold dark:text-white">Style Assistant</Text>
      <View className="w-10 h-10 rounded-full bg-green-200 items-center justify-center">
        <View className="w-3 h-3 rounded-full bg-green-400" />
      </View>
    </View>
  );
};

export default AssistantScreen;