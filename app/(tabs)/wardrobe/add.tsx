import ClothingItem from '@/models/ClothingItem';
import { addItem } from '@/services/wardrobe-service';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import DefaultItemScreen from './default_item_screen';

const AddClothingItemScreen = () => {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [clothingItem, setClothingItem] = useState<ClothingItem | null>(null);

    const router = useRouter();

    useEffect(() => {
        if (imageUri && !clothingItem) {
            addItem(imageUri).then((item) => {
                setClothingItem(item);
            }).catch(err => {
                Alert.alert('Error', 'Failed to classify the clothing item. Please try again.');
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
            {!clothingItem ?
                <View>
                    <View className="items-center">
                        <Image source={{ uri: imageUri }} style={{ width: 240, height: 240 }} />
                    </View>
                    <View className="flex-1 justify-center items-center py-20">
                        <ActivityIndicator size="large" color="#0891b2" />
                        <Text className="mt-8 text-lg font-medium text-gray-600 dark:text-gray-400">
                            AI is classifying your item...
                        </Text>
                    </View>
                </View>
                :
                <DefaultItemScreen clothingItem={clothingItem} mode="Edit" isNewItem={true} onSave={() => router.back()} />
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

export default AddClothingItemScreen;