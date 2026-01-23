import { SAMPLE_USER_ID } from '@/data';
import { useWardrobe } from '@/hooks/use-wardrobe';
import ClothingItem from '@/models/ClothingItem';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import DefaultItemScreen from './default_item_screen';

const ClothingItemScreen = () => {
    const { id } = useLocalSearchParams();
    const query = useWardrobe(SAMPLE_USER_ID);

    const clothingItem: ClothingItem | undefined = query.data?.find((item: ClothingItem) => item.id === id);

    if (clothingItem === undefined) {
        return (
            <View className="justify-center items-center mt-16">
                <ActivityIndicator size="large" color="#0891b2" />
            </View>
        );
    };

    return (
        <View className="flex-1 my-8">
            <DefaultItemScreen clothingItem={clothingItem} />
        </View>
    );
};

export default ClothingItemScreen;