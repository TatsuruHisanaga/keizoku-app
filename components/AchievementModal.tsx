import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';
import { Button, ButtonText } from '@/components/ui/button';
import { useState } from 'react';
import { Box } from '@/components/ui/box';
import { Center } from '@/components/ui/center';
import { Trophy } from 'lucide-react-native';

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
  habitName: string;
}

export default function AchievementModal({
  isOpen,
  onClose,
  streak,
  habitName,
}: AchievementModalProps) {

  return (
    <Center>
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalBackdrop />
        <ModalContent>
          <Box className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy color="#ebb305" />
          </Box>
          <ModalHeader>
            <Box></Box>
            <Heading size="md" className="text-typography-950 mb-2">
              達成おめでとう！
            </Heading>
            <Box></Box>
          </ModalHeader>
          <ModalBody>
            <Text size="sm" className="text-typography-500 text-center">
              「{habitName}」を{streak}日間継続できました！
            </Text>
          </ModalBody>
          <Text className="text-center text-4xl font-bold text-yellow-500 mb-4">
            {streak}日
          </Text>
          <ModalFooter>
            <Box
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Button
                onPress={onClose}
                className="w-full"
              >
                <ButtonText>続ける</ButtonText>
              </Button>
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Center>
  );
}
