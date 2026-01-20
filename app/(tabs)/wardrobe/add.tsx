import Chip from '@/components/chip';
import { CLOTHING_CATEGORIES, CLOTHING_COLORS, CLOTHING_OCCASIONS, CLOTHING_TEMPERATURES, CLOTHING_TYPES } from '@/data';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const AddClothingItemScreen = () => {
    const [image, setImage] = useState<string | null>(null);

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

    if (!image) {
        return (
            <View className="flex-1 mt-8">
                <UploadSection setImage={setImage} />
            </View>
        );
    };

    return (
        <View className="flex-1 my-8">
            <View className="items-center">
                <Image source={{ uri: image }} style={{ width: 240, height: 240 }} />
            </View>
            
            <ScrollView className="mt-8" contentContainerClassName="px-8 gap-y-8">
                {sections.map((section, index) => (
                    <LabelSection
                        title={section.title}
                        labels={section.labels}
                        key={index}
                    />
                ))}
            </ScrollView>
        </View>
    )
};

const UploadSection = ({ setImage }: { setImage: React.Dispatch<React.SetStateAction<string | null>> }) => {
    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission required', 'Permission to access the media library is required.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'livePhotos'],
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    return (
        <View className="px-4 w-full">
        <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.8}
            className="w-full aspect-square bg-gray-50 dark:bg-neutral-900 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-3xl items-center justify-center"
        >
            <View className="bg-cyan-100 dark:bg-cyan-900/30 p-6 rounded-full mb-4">
            <Ionicons name="cloud-upload-outline" size={48} color="#0891b2" />
            </View>

            <Text className="text-xl font-semibold text-gray-800 dark:text-gray-100">Upload Image</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 10MB</Text>

            <View className="mt-6 bg-cyan-600 px-6 py-2 rounded-full">
            <Text className="text-white font-medium">Select File</Text>
            </View>
        </TouchableOpacity>
        </View>
    );
};

const LabelSection = ({ title, labels }: { title: string, labels: string[] }) => {
    return (
        <View>
            <Text className="text-xl font-bold mb-4">{title}</Text>
            <View className="flex-row flex-wrap gap-2">
                {labels.map((label) => (
                    <Chip 
                        key={label} 
                        text={label} 
                        isActive={false}
                        onSelect={() => {}} 
                    />
                ))}
            </View>
        </View>
    );
};

export default AddClothingItemScreen;