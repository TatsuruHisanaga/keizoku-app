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
import { useEffect, useRef } from 'react';
import LottieView from 'lottie-react-native';

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
  const confettiRef = useRef<LottieView | null>(null);

  useEffect(() => {
    if (isOpen && confettiRef.current) {
      confettiRef.current.reset();
      confettiRef.current.play();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && confettiRef.current) {
      confettiRef.current.reset();
    }
  }, [isOpen]);

  return (
    <Center>
      <Modal isOpen={isOpen} onClose={onClose} size="sm" style={{ zIndex: 10 }}>
        <ModalBackdrop />
        <ModalContent>
          <Box className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy color="#ebb305" />
          </Box>
          <ModalHeader>
            <Box></Box>
            <Heading size="md" className="text-typography-950 mb-2">
              連続達成記録
            </Heading>
            <Box></Box>
          </ModalHeader>
          <Text className="text-center text-4xl font-bold text-yellow-500">
            {streak}日
          </Text>
          <ModalBody>
            <Text size="sm" className="text-typography-500 text-center">
              この調子で頑張りましょう！
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
                <ButtonText>続ける</ButtonText>
              </Button>
            </Box>
          </ModalFooter>
        </ModalContent>
        <LottieView
          ref={confettiRef}
          source={require('@/assets/confetti.json')}
          autoPlay={false}
          loop={false}
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
      </Modal>
    </Center>
  );
}
