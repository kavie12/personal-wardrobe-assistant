import { SAMPLE_USER_ID } from '@/data';
import { useWardrobe } from '@/hooks/use-wardrobe';
import ClothingItem from '@/models/ClothingItem';
import { ClothingItemScreenMode } from '@/types';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import DefaultItemScreen from './default_item_screen';

const ClothingItemScreen = () => {
    const { id } = useLocalSearchParams();
    const query = useWardrobe(SAMPLE_USER_ID);
    const [mode, setMode] = useState<ClothingItemScreenMode>("View");

    const clothingItem: ClothingItem | undefined = query.data?.find((item: ClothingItem) => item.id === id);

    return (
        <View className="flex-1 my-8">
            {clothingItem === undefined ?
                <View className="justify-center items-center mt-16">
                    <ActivityIndicator size="large" color="#0891b2" />
                </View>
                :
                <DefaultItemScreen clothingItem={clothingItem} mode={mode} setMode={setMode} onSave={() => setMode("View")} />
            }
        </View>
    );
};

export default ClothingItemScreen;