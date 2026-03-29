import ClothingItem from '@/models/ClothingItem';
import Outfit from '@/models/Outfit';
import { chat } from '@/services/assistant-service';
import { getRecommendation } from '@/services/recommendation-service';
import { getForecastWeather } from '@/services/weather-service';
import { Message } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AssistantScreen = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "system",
      content: "Hello! How can I assist you today?"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleEnterMessage = async (content: string) => {
    setMessages(prev => [...prev, {
      type: "user",
      content: content
    }]);

    setLoading(true);

    try {
      const res = await chat(content);

      setMessages(prev => [...prev, {
        type: "system",
        content: res.message
      }]);

      if (res.readyToGenerate) {
        if (!res.time || !res.context || !res.formality) return;

        const outfitRes = await generateOutfit(res.time, res.context, res.formality);
        setMessages(prev => [...prev, {
          type: "outfit",
          content: outfitRes.reason,
          outfit: outfitRes.outfit
        }]);
      }
    } catch (err) {
      console.log("Chat error", err);
    } finally {
      setLoading(false);
    }
  };

  const generateOutfit = async (timestamp: Date, context: string, formality: string) => {
    const weatherData = await getForecastWeather(6.9271, 79.8612, timestamp);
    if (!weatherData) throw new Error("Weather data not available");

    const fullContext = `${context} | ${timestamp.toLocaleString()} | ${formality}`;
    return await getRecommendation({ description: weatherData.description, temperature: weatherData.temperature }, fullContext);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <Header className="mt-4" />

        <ScrollView
          className="mt-8 mb-4 flex-1"
          contentContainerClassName="px-4 gap-y-4"
          showsVerticalScrollIndicator={false}
          ref={scrollViewRef}
        >
          {messages.map((msg, index) => (
            <View key={index}>
              {
                msg.type === "system" ?
                  <AIMessage text={msg.content} />
                  :
                  msg.type === "user" ?
                    <UserMessage text={msg.content} />
                    :
                    msg.outfit && <AIOutfitResponse reason={msg.content} outfit={msg.outfit} />
              }
            </View>
          ))}

          {loading && (
            <View className="mb-4">
              <AIMessage text="" loading={true} />
            </View>
          )}

        </ScrollView>

        <InputSection enterMessage={handleEnterMessage} />

      </SafeAreaView>
    </KeyboardAvoidingView>
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

const AIMessage = ({ text, loading = false }: { text: string; loading?: boolean }) => {
  return (
    <View className="flex-row items-end gap-x-4">
      <Ionicons name="chatbubble-outline" color="white" size={20} className="bg-blue-600 rounded-full p-3" />
      <View className="flex-shrink max-w-80 bg-white dark:bg-gray-700 rounded-t-2xl rounded-br-2xl rounded-bl-sm p-4 shadow-sm border border-slate-100 dark:border-gray-600">
        {
          loading ?
          <View className="flex-row items-center gap-x-2">
            <ActivityIndicator size="small" color="#2563eb" />
            <Text className="text-slate-500 italic">Thinking...</Text>
          </View>
          :
          <Text className="text-slate-800 leading-6 dark:text-gray-100">{text}</Text>
        }
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

const AIOutfitResponse = ({ reason, outfit }: { reason: string, outfit: Outfit }) => {
  return (
    <View className="flex-row items-end gap-x-4">
      <Ionicons name="chatbubble-outline" color="white" size={20} className="bg-blue-600 rounded-full p-3" />
      <View className="flex-shrink max-w-80 bg-white dark:bg-gray-700 rounded-t-2xl rounded-br-2xl rounded-bl-sm p-4 shadow-sm border border-slate-100 dark:border-gray-600">
        
        {/* Reason */}
        <Text className="text-slate-800 leading-6 dark:text-gray-100">{reason}</Text>
        
        {/* Outfit items */}
        <View className="bg-white rounded-xl shadow-sm border border-slate-100 mt-4">
          <ScrollView horizontal contentContainerClassName="gap-x-4 pb-2 px-2" className="mt-4">
            <OutfitClothingItem item={outfit.topwear} />
            <OutfitClothingItem item={outfit.bottomwear} />
            <OutfitClothingItem item={outfit.footwear} />
            { outfit.outerwear && <OutfitClothingItem item={outfit.outerwear} /> }
          </ScrollView>
        </View>

      </View>
    </View>
  );
};

const OutfitClothingItem = ({ item }: { item: ClothingItem }) => {
  return (
    <View className="items-center gap-y-2">
      <Image source={item.image} style={{ width: 120, height: 120, borderRadius: 12 }} />
      <Text className="font-semibold text-slate-500">{item.type}</Text>
    </View>
  );
};

const InputSection = ({ enterMessage }: { enterMessage: (content: string) => void }) => {
  const [text, setText] = useState("");

  const handleEnterMessage = () => {
    enterMessage(text);
    setText("");
    Keyboard.dismiss()
  };

  return (
    <View className="flex-row items-center gap-x-2 mx-4">
      <TextInput placeholder="Enter message..." value={text} onChangeText={setText} className="bg-white px-8 py-4 rounded-full shadow-sm border border-slate-100 flex-1" />
      <TouchableOpacity onPress={handleEnterMessage} activeOpacity={0.7} className="p-4 bg-blue-600 rounded-full">
        <Ionicons name="send" color="white" size={18} />
      </TouchableOpacity>
    </View>
  );
};

export default AssistantScreen;