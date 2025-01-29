import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box';

export default function Social() {
  return (
    <Box className="h-full p-4">
      <VStack space="lg">
        <Text className="text-lg font-semibold">みんなの習慣</Text>
      </VStack>
    </Box>
  );
}
