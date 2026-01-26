import { saveItem, updateItem } from '@/api/server';
import Chip from '@/components/chip';
import FloatingActionButton from '@/components/floating-action-button';
import { CLOTHING_LABELS, SAMPLE_USER_ID } from '@/data';
import ClothingItem from '@/models/ClothingItem';
import { ClothingItemScreenMode } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

interface DefaultItemScreenProps {
    clothingItem: ClothingItem;
    mode?: ClothingItemScreenMode;
    isNewItem?: boolean;
    setMode?: (mode: ClothingItemScreenMode) => void;
    onSave?: () => void;
}

const DefaultItemScreen = ({ clothingItem, mode, isNewItem, setMode, onSave }: DefaultItemScreenProps) => {
    const [editedItem, setEditedItem] = useState<ClothingItem>(clothingItem);
    const queryClient = useQueryClient();

    const mutationSave = useMutation({
        mutationFn: async () => {
            const success = await saveItem(editedItem, SAMPLE_USER_ID);
            if (!success)
                throw new Error("Save item failed.");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wardrobe', SAMPLE_USER_ID] });
            if (onSave) onSave();
        }
    });

    const mutationUpdate = useMutation({
        mutationFn: async () => {
            const success = await updateItem(editedItem);
            if (!success)
                throw new Error("Update item failed.");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wardrobe', SAMPLE_USER_ID] });
            if (onSave) onSave();
        }
    });

    const toggleLabel = (label: string, sectionKey: keyof ClothingItem) => {
        setEditedItem((prev) => {
            const currentValue = prev[sectionKey];

            if (typeof currentValue === 'string') {
                return { ...prev, [sectionKey]: label };
            }

            if (Array.isArray(currentValue)) {
                const list = currentValue as string[]; 
                
                const updatedList = list.includes(label)
                    ? list.length === 1 ? list : list.filter((item) => item !== label)
                    : [...list, label];

                return { ...prev, [sectionKey]: updatedList };
            }

            return prev;
        });
    };

    return (
        <>
            <View className="flex-1">
                <View className="items-center">
                    <Image source={editedItem.image} style={{ width: 240, height: 240 }} />
                </View>
                
                <ScrollView className="mt-8" contentContainerClassName="px-8 gap-y-4">
                    {CLOTHING_LABELS.map((section, index) => {
                        const value = editedItem[section.key];
                        const selectedLabels = Array.isArray(value) ? value : [value];

                        return mode === "View" ? (
                            <LabelSection
                                sectionKey={section.key}
                                title={section.title}
                                labels={selectedLabels}
                                key={index}
                            />
                        ) : (
                            <LabelSection
                                sectionKey={section.key}
                                title={section.title}
                                labels={section.labels}
                                selectedLabels={selectedLabels}
                                selectable={true}
                                onSelectLabel={toggleLabel}
                                key={index}
                            />
                        )
                    })}
                </ScrollView>
            </View>

            {
                mode === "View" ?
                    <FloatingActionButton
                        iconName="edit"
                        iconSize={24}
                        iconColor="black"
                        onPress={() => setMode && setMode("Edit")}
                        className={`bg-gray-200 rounded-full`}
                    />
                    :
                    <FloatingActionButton
                        iconName="save"
                        iconSize={32}
                        iconColor="white"
                        onPress={() => isNewItem ? mutationSave.mutate() : mutationUpdate.mutate()
                        }
                        className={`${(isNewItem ? mutationSave.isPending : mutationUpdate.isPending) && "bg-gray-400"}`}
                        disabled={isNewItem ? mutationSave.isPending : mutationUpdate.isPending}
                    />
            }
        </>
    );
};

const LabelSection = ({ sectionKey, title, labels, selectedLabels, selectable, onSelectLabel }: {
    sectionKey: string;
    title: string;
    labels: readonly string[];
    selectedLabels?: readonly string[];
    selectable?: boolean;
    onSelectLabel?: (label: string, sectionKey: keyof ClothingItem) => void;
}) => {
    return (
        <View>
            <Text className="text-xl font-bold mb-2 dark:text-white">{title}</Text>
            <View className="flex-row flex-wrap gap-2">
                {labels.map((label) => (
                    <Chip
                        key={label}
                        value={label}
                        onSelect={() => { selectable && onSelectLabel?.(label, sectionKey as keyof ClothingItem); }}
                        isSelected={selectedLabels?.includes(label)}
                    />
                ))}
            </View>
        </View>
    );
};

export default DefaultItemScreen;