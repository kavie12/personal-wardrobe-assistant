import { useWardrobe } from '@/hooks/use-wardrobe';
import ClothingItem from '@/models/ClothingItem';
import { ClothingItemScreenMode } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import DefaultItemScreen from './default_item_screen';

const ClothingItemScreen = () => {
    const { id } = useLocalSearchParams();
    const wardrobeData = useWardrobe();
    const [mode, setMode] = useState<ClothingItemScreenMode>("View");

    const clothingItem: ClothingItem | undefined = wardrobeData.items.find((item: ClothingItem) => item.id === id);

    const router = useRouter();

    return (
        <View className="flex-1 my-8">
            {clothingItem === undefined ?
                <View className="justify-center items-center mt-16">
                    <ActivityIndicator size="large" color="#0891b2" />
                </View>
                :
                <DefaultItemScreen
                    clothingItem={clothingItem}
                    mode={mode}
                    setMode={setMode}
                    onSave={() => setMode("View")}
                    onDelete={() => router.back()}
                />
            }
        </View>
    );
};

export default ClothingItemScreen;