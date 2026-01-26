import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';

interface FABProps {
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconSize: number;
  iconColor: string;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}

const FloatingActionButton = ({ 
  iconName,
  iconSize,
  iconColor,
  onPress, 
  disabled = false,
  className = "",
}: FABProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className={`absolute bottom-8 right-8 p-4 bg-cyan-600 rounded-3xl items-center justify-center elevation-md ${className}`}
      disabled={disabled}
    >
      <MaterialIcons name={iconName} size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
};

export default FloatingActionButton;