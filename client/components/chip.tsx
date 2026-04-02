import React from 'react';
import { Pressable, Text } from 'react-native';

export interface ChipProps<T extends string> {
  value: T;
  isSelected?: boolean;
  onSelect: (value: T) => void;
}

const Chip = <T extends string>({ value, isSelected, onSelect }: ChipProps<T>) => {
    return (
        <Pressable onPress={() => onSelect(value)} className={`border-[1px] px-4 py-2 rounded-full ${isSelected ? "bg-blue-100 border-blue-400" : "border-gray-400"}`}>
            <Text className={`${isSelected ? "text-blue-800" : "text-gray-800 dark:text-gray-200"}`}>{value}</Text>
        </Pressable>
    )
};

export default Chip;