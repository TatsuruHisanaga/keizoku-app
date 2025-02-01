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
import { Box } from '@/components/ui/box';
import { Center } from '@/components/ui/center';
import { PartyPopper } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import LottieView from 'lottie-react-native';

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
  const confettiRef = useRef<LottieView | null>(null);
  const [goal, setGoal] = useState(false);

  const handleClose = () => {
    setGoal(false);
    onClose();
  }

  useEffect(() => {
    if (isOpen) {
      if (confettiRef.current) {
        confettiRef.current.reset();
      }

      const timer = setTimeout(() => {
        if (confettiRef.current) {
          confettiRef.current.reset();
          confettiRef.current.play(0);
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const renderLottieView = () => {
    if (!isOpen) return null;

    return (
      <LottieView
        ref={confettiRef}
        source={require('@/assets/popConfetti.json')}
        autoPlay={false}
        loop={false}
        progress={0}
        resizeMode="cover"
        style={{
          position: 'absolute',
          zIndex: 999,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100%',
          width: '100%',
          pointerEvents: 'none',
        }}
      />
    );
  };

  return (
    <Center>
      <Modal isOpen={isOpen} onClose={handleClose} size="sm" style={{ zIndex: 10 }}>
        <ModalBackdrop />
        <ModalContent>
          {!goal ? (
            <>
            <Box className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PartyPopper color="#22c55e" />
            </Box>
            <ModalHeader>
              <Box></Box>
              <Heading size="md" className="text-typography-950 mb-2">
                新しい習慣を追加しました！
              </Heading>
              <Box></Box>
            </ModalHeader>
            <ModalBody>
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
                <Button onPress={() => setGoal(true)} className="mb-1 w-full">
                  <ButtonText>目標を設定する</ButtonText>
                </Button>
                <Button onPress={handleClose} className="w-full">
                  <ButtonText>始める</ButtonText>
                </Button>
              </Box>
          </ModalFooter>
          </>
          ) : (
            <>
            <ModalHeader>
              <Box></Box>
              <Heading size="md" className="text-typography-950 mb-2">
                目標を設定しましょう！
              </Heading>
              <Box></Box>
            </ModalHeader>
            <ModalBody>
              <Text size="sm" className="text-typography-500 text-center">
                今日から始める習慣の目標を設定しましょう！
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
                <Button onPress={handleClose} className="w-full">
                  <ButtonText>始める</ButtonText>
                </Button>
              </Box>
            </ModalFooter>
            </>
          )}
        </ModalContent>
        {renderLottieView()}
      </Modal>
    </Center>
  );
}
