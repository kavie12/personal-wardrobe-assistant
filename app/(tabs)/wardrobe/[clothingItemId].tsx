import Chip from '@/components/chip';
import { CLOTHING_ATTIRE_TYPE, CLOTHING_COLORS, CLOTHING_ITEMS, CLOTHING_MAIN_CATEGORIES, CLOTHING_SUB_CATEGORIES, CLOTHING_WEATHER } from '@/data';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

const ClothingItem = () => {
    const { clothingItemId } = useLocalSearchParams();
    const clothingItem = CLOTHING_ITEMS.find(item => item.id === clothingItemId);

    const sections = [
        {
            title: "Main Category",
            labels: CLOTHING_MAIN_CATEGORIES
        },
        {
            title: "Sub Category",
            labels: CLOTHING_SUB_CATEGORIES
        },
        {
            title: "Color",
            labels: CLOTHING_COLORS
        },
        {
            title: "Attire Type",
            labels: CLOTHING_ATTIRE_TYPE
        },
        {
            title: "Weather",
            labels: CLOTHING_WEATHER
        }
    ]

    return (
        <View className="flex-1 my-8">
            <View className="items-center">
                <Image source={clothingItem?.image} style={{ width: 240, height: 240 }} />
            </View>
            
            <ScrollView className="mt-8" contentContainerClassName="px-8 gap-y-8">
                {sections.map((section, index) => <LabelSection title={section.title} labels={section.labels} key={index} />)}
            </ScrollView>
        </View>
    )
};

const LabelSection = ({ title, labels }: { title: string, labels: string[] }) => {
    return (
        <View>
            <Text className="text-xl font-bold mb-4">{title}</Text>
            <View className="flex-row flex-wrap gap-2">
                {labels.map((item) => (
                    <Chip 
                        key={item} 
                        text={item} 
                        isActive={false} 
                        onSelect={() => {}} 
                    />
                ))}
            </View>
        </View>
    );
};

export default ClothingItem;