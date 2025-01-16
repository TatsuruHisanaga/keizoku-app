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
  const [showModal, setShowModal] = useState<boolean>(isOpen);

  return (
    <Center>
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Box></Box>
            <Heading size="md" className="text-typography-950 mb-2">
              達成おめでとう！
            </Heading>
            <Box></Box>
          </ModalHeader>
          <ModalBody>
            <Text size="sm" className="text-typography-500 text-center mb-4">
              「{habitName}」を{streak}日間継続できました！
            </Text>
          </ModalBody>
          <ModalFooter>
            <Box
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Button
                onPress={() => {
                  setShowModal(false);
                }}
                size='sm'
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
