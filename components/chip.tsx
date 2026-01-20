import React from 'react';
import { Pressable, Text } from 'react-native';

export interface ChipProps {
  text: string;
  isActive: boolean;
  onSelect: (category: string) => void;
}

const Chip = ({ text, isActive, onSelect }: ChipProps) => {
    return (
        <Pressable onPress={() => onSelect(text)} className={`border-[1px] px-4 py-2 rounded-full self-start ${isActive ? "bg-blue-100 border-blue-400" : "border-gray-400"}`}>
            <Text className={`${isActive ? "text-blue-800" : "text-gray-800 dark:text-gray-200"}`}>{text}</Text>
        </Pressable>
    )
};

export default Chip;