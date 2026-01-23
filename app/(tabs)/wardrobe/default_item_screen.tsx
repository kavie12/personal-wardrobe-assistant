import { saveItem } from '@/api/server';
import Chip from '@/components/chip';
import FloatingActionButton from '@/components/floating-action-button';
import { CLOTHING_LABELS_SECTIONS, SAMPLE_USER_ID } from '@/data';
import ClothingItem from '@/models/ClothingItem';
import { ClothingItemScreenMode } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

interface DefaultItemScreenProps {
    clothingItem: ClothingItem;
    mode?: ClothingItemScreenMode;
    onSave?: () => void;
}

const DefaultItemScreen = ({ clothingItem, mode, onSave }: DefaultItemScreenProps) => {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async (idCombination: { itemId: string, userId: string }) => {
            const success = await saveItem(idCombination.itemId, idCombination.userId);
            if (!success)
                throw new Error("Save item failed.");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wardrobe', SAMPLE_USER_ID] });
            if (onSave) onSave();
        }
    });

    return (
        <>
            <View>
                <View className="items-center">
                    <Image source={clothingItem.image} style={{ width: 240, height: 240 }} />
                </View>
                
                <ScrollView className="mt-8" contentContainerClassName="px-8 gap-y-4">
                    {CLOTHING_LABELS_SECTIONS.map((section, index) => {
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

            {mode === "Edit" ?
                <FloatingActionButton
                    onPress={() => mutation.mutate({ itemId: clothingItem.id, userId: SAMPLE_USER_ID })}
                    iconName="save"
                    className={mutation.isPending ? "bg-gray-400" : "bg-cyan-600"}
                    disabled={mutation.isPending}
                />
                :
                <></>
            }
        </>
    );
}

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

export default DefaultItemScreen;