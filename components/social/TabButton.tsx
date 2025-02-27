import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { TouchableOpacity } from 'react-native';

interface TabButtonProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

export function TabButton({ label, isSelected, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-1">
      <Box className="py-3 px-4">
        <Text
          className={`text-center font-bold ${
            isSelected ? 'text-typography-950' : 'text-gray-500'
          }`}
        >
          {label}
        </Text>
        {isSelected && (
          <Box className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full mx-4" />
        )}
      </Box>
    </TouchableOpacity>
  );
}
