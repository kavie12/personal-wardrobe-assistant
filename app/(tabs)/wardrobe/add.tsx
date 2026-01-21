import Chip from '@/components/chip';
import { CLOTHING_CATEGORIES, CLOTHING_COLORS, CLOTHING_OCCASIONS, CLOTHING_TEMPERATURES, CLOTHING_TYPES } from '@/data';
import { Ionicons } from '@expo/vector-icons';
import axios from "axios";
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const AddClothingItemScreen = () => {
    const [imageUri, setImageUri] = useState<string | null>(null);

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

    useEffect(() => {
        if (imageUri) {
            const formData = new FormData();

            formData.append("clothing_item", {
                uri: imageUri,
                name: "upload.jpg",
                type: "image/jpeg"
            } as any);

            axios.post("http://10.235.135.138:8000/wardrobe/add", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            })
            .then(res => {
                console.log(res.data);
            })
            .catch(err => {
                console.log(err);
            });
        }
    }, [imageUri]);

    if (!imageUri) {
        return (
            <View className="flex-1 mt-8">
                <UploadSection setImageUri={setImageUri} />
            </View>
        );
    };

    return (
        <View className="flex-1 my-8">
            <View className="items-center">
                <Image source={{ uri: imageUri }} style={{ width: 240, height: 240 }} />
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

const UploadSection = ({ setImageUri }: { setImageUri: React.Dispatch<React.SetStateAction<string | null>> }) => {
    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission required', 'Permission to access the media library is required.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true
        });

        if (!result.canceled) {
            const compressedImageUri = await getCompressedImageUri(result.assets[0].uri);
            setImageUri(compressedImageUri);
        }
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission required', 'Permission to access the camera is required.');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7
        });

        if (!result.canceled) {
            const compressedImageUri = await getCompressedImageUri(result.assets[0].uri);
            setImageUri(compressedImageUri);
        }
    };

    const getCompressedImageUri = async (imageUri: string): Promise<string> => {
        const context = ImageManipulator.manipulate(imageUri).resize({ width: 800 })
        const renderedImage = await context.renderAsync();
        const result = await renderedImage.saveAsync({
            compress: 0.7,
            format: SaveFormat.JPEG
        });
        return result.uri;
    };

    return (
        <View
            className="mx-4 flex-row aspect-square bg-gray-50 dark:bg-neutral-900 border-2 border-dashed border-gray-300 dark:border-neutral-700
                        rounded-3xl items-center justify-center gap-x-24"
        >
            <TouchableOpacity onPress={takePhoto} activeOpacity={0.8} className="items-center">
                <View className="bg-cyan-100 dark:bg-cyan-900/30 p-6 rounded-full mb-4">
                    <Ionicons name="camera-outline" size={36} color="#0891b2" />
                </View>
                <Text className="text-md font-semibold text-gray-800 dark:text-gray-100">Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8} className="items-center">
                <View className="bg-cyan-100 dark:bg-cyan-900/30 p-6 rounded-full mb-4">
                    <Ionicons name="cloud-upload-outline" size={36} color="#0891b2" />
                </View>
                <Text className="text-md font-semibold text-gray-800 dark:text-gray-100">Upload Image</Text>
            </TouchableOpacity>
        </View>
    );
};

const LabelSection = ({ title, labels }: { title: string, labels: string[] }) => {
    return (
        <View>
            <Text className="text-xl font-bold mb-4 dark:text-white">{title}</Text>
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