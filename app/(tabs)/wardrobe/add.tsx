import Chip from '@/components/chip';
import FloatingActionButton from '@/components/floating-action-button';
import { CLOTHING_LABELS, SAMPLE_USER_ID } from '@/data';
import ClothingItem from '@/models/ClothingItem';
import { Ionicons } from '@expo/vector-icons';
import axios from "axios";
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const AddClothingItemScreen = () => {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [clothingItem, setClothingItem] = useState<ClothingItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const router = useRouter();

    const saveItem = () => {
        setIsSaving(true);
        axios.post("http://10.235.135.138:8000/wardrobe/save", {
            item_id: clothingItem?.id,
            user_id: SAMPLE_USER_ID
        })
        .then(res => {
            router.back();
        })
        .catch(err => {
            console.log(err);
        });
    };

    useEffect(() => {
        if (imageUri && !clothingItem) {
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
                setClothingItem(
                    new ClothingItem(
                        res.data.id,
                        res.data.filename,
                        { uri: imageUri },
                        res.data.category,
                        res.data.type,
                        res.data.colors,
                        res.data.occasions,
                        res.data.temperatures
                    )
                );
            })
            .catch(err => {
                throw new Error(err);
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

            {!clothingItem ?
                <View className="flex-1 justify-center items-center py-20">
                    <ActivityIndicator size="large" color="#0891b2" />
                    <Text className="mt-8 text-lg font-medium text-gray-600 dark:text-gray-400">
                        AI is classifying your item...
                    </Text>
                </View>
                :
                <>
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
                          <FloatingActionButton
                            onPress={saveItem}
                            iconName='save'
                            disabled={isSaving}
                            className="bg-cyan-600"
                        />
                </>
            }
            
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

export default AddClothingItemScreen;