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
import { useEffect } from 'react';
import { Box } from '@/components/ui/box';
import { Center } from '@/components/ui/center';
import { PartyPopper } from 'lucide-react-native';
import { Animated, Easing } from 'react-native';

interface NewHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitName: string;
}

export default function NewHabitModal({
  isOpen,
  onClose,
  habitName,
}: NewHabitModalProps) {
  // アニメーション用のAnimated.Valueを作成
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    if (isOpen) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 260,
        friction: 20,
      }).start();
    }
  }, [isOpen]);

  return (
    <Center>
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalBackdrop />
        <ModalContent>
          <Box className="w-20 h-20 bg-yellow-30 rounded-full flex items-center justify-center mx-auto">
            <PartyPopper color="#facc15" />
          </Box>
          <ModalHeader>
            <Box></Box>
            <Heading size="md" className="text-typography-950 mb-2">
              新しい習慣を追加しました！
            </Heading>
            <Box></Box>
          </ModalHeader>
          <ModalBody>
            {/* <Text size="sm" className="text-typography-500 text-center mb-2">
              {habitName}を追加しました！
            </Text> */}
            <Text size="sm" className="text-typography-500 text-center">
              継続は力なり！頑張りましょう！
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
              <Button onPress={onClose} className="w-full">
                <ButtonText>始める</ButtonText>
              </Button>
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Center>
  );
}
