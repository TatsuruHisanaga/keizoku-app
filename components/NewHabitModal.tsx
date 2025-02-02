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
import { HStack } from '@/components/ui/hstack';
import {
  Select,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectPortal,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
} from '@/components/ui/select';
import { ChevronDownIcon } from '@/components/ui/icon';
import { Input, InputField } from './ui/input';

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
  const [goalType, setGoalType] = useState('Days');

  const handleClose = () => {
    setGoal(false);
    onClose();
  };

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
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="sm"
        style={{ zIndex: 10 }}
      >
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
                  <Button onPress={() => setGoal(true)} className="mb-2 w-full">
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
                  目標設定
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
                  <HStack className="w-full mb-2">
                    <Select
                      className="w-1/2"
                      onValueChange={(value) =>
                        setGoalType(value as 'Days' | 'Daily')
                      }
                    >
                      <SelectTrigger className="flex items-center justify-between">
                        <SelectInput placeholder="選択" />
                        <SelectIcon
                          className="ml-auto mr-2"
                          as={ChevronDownIcon}
                        />
                      </SelectTrigger>
                      <SelectPortal>
                        <SelectContent>
                          <SelectDragIndicatorWrapper>
                            <SelectDragIndicator />
                          </SelectDragIndicatorWrapper>
                          <SelectItem label="日数" value="Days" />
                          <SelectItem label="日付" value="Daily" />
                        </SelectContent>
                      </SelectPortal>
                    </Select>
                    {goalType === 'Days' ? (
                      <Input className="w-1/2">
                        <InputField placeholder="目標の日数" />
                      </Input>
                    ) : (
                      <Select className="w-1/2">
                        <SelectTrigger className="flex items-center justify-between">
                          <SelectInput placeholder="選択してください" />
                          <SelectIcon
                            className="ml-auto mr-2"
                            as={ChevronDownIcon}
                          />
                        </SelectTrigger>
                        <SelectPortal>
                          <SelectContent>
                            <SelectDragIndicatorWrapper>
                              <SelectDragIndicator />
                            </SelectDragIndicatorWrapper>
                            <SelectItem label="1日" value="1th" />
                            <SelectItem label="2日" value="2nd" />
                            <SelectItem label="3日" value="3rd" />
                          </SelectContent>
                        </SelectPortal>
                      </Select>
                    )}
                  </HStack>
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
