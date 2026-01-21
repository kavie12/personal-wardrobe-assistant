import Chip from '@/components/chip';
import { CLOTHING_CATEGORIES, CLOTHING_COLORS, CLOTHING_ITEMS, CLOTHING_OCCASIONS, CLOTHING_TEMPERATURES, CLOTHING_TYPES } from '@/data';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

const ClothingItemScreen = () => {
    const { id } = useLocalSearchParams();
    const clothingItem = CLOTHING_ITEMS.find(item => item.id.toString() === id);

    if (!clothingItem) {
        throw new Error("Clothing item selected not found.");
    }

    type SectionFields = "category" | "type" | "colors" | "occasions" | "temperatures";
    const sections: {
        title: string;
        labels: string[];
        field: SectionFields;
    }[] = [
        {
            title: "Category",
            labels: CLOTHING_CATEGORIES,
            field: "category"
        },
        {
            title: "Type",
            labels: CLOTHING_TYPES,
            field: "type"
        },
        {
            title: "Colors",
            labels: CLOTHING_COLORS,
            field: "colors"
        },
        {
            title: "Occasions",
            labels: CLOTHING_OCCASIONS,
            field: "occasions"
        },
        {
            title: "Temperatures",
            labels: CLOTHING_TEMPERATURES,
            field: "temperatures"
        }
    ];

    return (
        <View className="flex-1 my-8">
            <View className="items-center">
                <Image source={clothingItem?.image} style={{ width: 240, height: 240 }} />
            </View>
            
            <ScrollView className="mt-8" contentContainerClassName="px-8 gap-y-8">
                {sections.map((section, index) => {
                    const value = clothingItem[section.field];
                    const selectedLabels = Array.isArray(value)
                        ? value
                        : [value];

                    return (
                        <LabelSection
                            title={section.title}
                            labels={section.labels}
                            selectedLabels={selectedLabels}
                            key={index}
                        />
                    );
                })}
            </ScrollView>
        </View>
    )
};

const LabelSection = ({ title, labels, selectedLabels }: { title: string, labels: string[], selectedLabels: string[] }) => {
    return (
        <View>
            <Text className="text-xl font-bold mb-4 dark:text-white">{title}</Text>
            <View className="flex-row flex-wrap gap-2">
                {labels.map((label) => (
                    <Chip 
                        key={label} 
                        text={label} 
                        isActive={selectedLabels.includes(label)}
                        onSelect={() => {}} 
                    />
                ))}
            </View>
        </View>
    );
};

export default ClothingItemScreen;