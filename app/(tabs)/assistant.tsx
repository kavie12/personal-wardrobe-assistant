import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AssistantScreen = () => {
  return (
    <SafeAreaView className="flex-1">
      <Header className="mt-4"  />

      <ScrollView className="mt-8" contentContainerClassName="px-4 gap-y-6">
        <AIMessage text="Hello! I see you have a formal meeting at 10 AM. Should I look for something professional but comfortable?" />
        <UserMessage text="Yes, that sounds good!" />
        <AIMessage text="Yes, that sounds good!" />
        <UserMessage text="Hello! I see you have a formal meeting at 10 AM. Should I look for something professional but comfortable?" />
      </ScrollView>
      
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

const AIMessage = ({ text }: { text: string; }) => {
  return (
    <View className="flex-row items-end gap-x-4">
      <Ionicons name="chatbubble-outline" color="white" size={20} className="bg-blue-600 rounded-full p-3" />
      <View className="flex-shrink max-w-80 bg-white dark:bg-gray-700 rounded-t-2xl rounded-br-2xl rounded-bl-sm p-4 shadow-sm border border-slate-100 dark:border-gray-600">
        <Text className="text-slate-800 leading-6 dark:text-gray-100">{text}</Text>
      </View>
    </View>
  );
};

const UserMessage = ({ text }: { text: string; }) => {
  return (
    <View className="flex-row items-end gap-x-4 justify-end">
      <View className="flex-shrink max-w-80 bg-blue-600 rounded-t-2xl rounded-br-2xl rounded-bl-sm p-4 shadow-sm border border-slate-100">
        <Text className="text-white leading-6">{text}</Text>
      </View>
      <Ionicons name="person-outline" color="gray" size={20} className="bg-gray-200 rounded-full p-3" />
    </View>
  );
};

export default AssistantScreen;