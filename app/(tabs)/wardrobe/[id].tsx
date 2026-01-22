import Chip from '@/components/chip';
import { CLOTHING_LABELS, SAMPLE_CLOTHING_ITEMS } from '@/data';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

const ClothingItemScreen = () => {
    const { id } = useLocalSearchParams();
    const clothingItem = SAMPLE_CLOTHING_ITEMS.find(item => item.id === id);

    if (!clothingItem) {
        throw new Error("Clothing item selected not found.");
    }

    return (
        <View className="flex-1 my-8">
            <View className="items-center">
                <Image source={clothingItem.image} style={{ width: 240, height: 240 }} />
            </View>
            
            <ScrollView className="mt-8" contentContainerClassName="px-8 gap-y-4">
                {CLOTHING_LABELS.map((section, index) => {
                    const value = clothingItem[section.key];
                    const selectedLabels = Array.isArray(value) ? value : [value];
                    return (
                        <LabelSection
                            title={section.title}
                            labels={selectedLabels}
                            key={index}
                        />
                    );
                })}
            </ScrollView>
        </View>
    )
};

const LabelSection = ({ title, labels }: { title: string, labels: string[] }) => {
    return (
        <View>
            <Text className="text-xl font-bold mb-2 dark:text-white">{title}</Text>
            <View className="flex-row flex-wrap gap-2">
                {labels.map((label) => (
                    <Chip
                        key={label} 
                        value={label} 
                        isSelected={false}
                        onSelect={() => {}} 
                    />
                ))}
            </View>
        </View>
    );
};

export default ClothingItemScreen;