import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';

interface FABProps {
  onPress: () => void;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  color?: string;
  size?: number;
  className?: string;
}

const FloatingActionButton = ({ 
  onPress, 
  iconName = 'add', 
  color = 'white', 
  size = 32,
  className = "" 
}: FABProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className={`absolute bottom-8 right-8 h-[60px] w-[60px] bg-blue-600 rounded-3xl items-center justify-center elevation-lg ${className}`}
    >
      <MaterialIcons name={iconName} size={size} color={color} />
    </TouchableOpacity>
  );
};

export default FloatingActionButton;