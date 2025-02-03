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
import { Calendar as RNCalendar } from 'react-native-calendars';
import { supabase } from '@/lib/supabase';

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [daysDiff, setDaysDiff] = useState<number | null>(null);

  // Calculate Japan time (UTC+9) and get current date as YYYY-MM-DD
  const now = new Date();
  const japanTime = now.getTime() + 9 * 60 * 60 * 1000;
  const todayJapan = new Date(japanTime);
  const currentJapanDate = todayJapan.toISOString().slice(0, 10);

  const handleClose = async () => {
    // 目標設定モードで日付が選択されている場合、習慣の目標を更新する
    if (goal && selectedDate && daysDiff !== null) {
      const computedGoal = daysDiff - 1;
      if (computedGoal > 0) {
        try {
          const { error } = await supabase
            .from('habits')
            .update({ goal: computedGoal })
            .eq('name', habitName);
          if (error) {
            console.error('Error updating habit goal', error);
          }
        } catch (err) {
          console.error('Error updating habit goal', err);
        }
      } else {
        console.error(
          'Selected date does not form a valid goal (must be at least tomorrow)',
        );
      }
    }
    setGoal(false);
    // Reset calendar state to prevent reusing the previous date selection
    setSelectedDate(null);
    setDaysDiff(null);
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
                <Text
                  size="sm"
                  className="text-typography-500 text-center mb-2"
                >
                  カレンダーから目標の日付を選択してください。
                </Text>
                <RNCalendar
                  onDayPress={(day: { timestamp: number }) => {
                    const chosenDate = new Date(day.timestamp);
                    setSelectedDate(chosenDate);

                    const now = new Date();
                    const todayDate = new Date(
                      now.getFullYear(),
                      now.getMonth(),
                      now.getDate(),
                    );
                    const diffTime = chosenDate.getTime() - todayDate.getTime();
                    const diffDays = Math.ceil(
                      diffTime / (1000 * 60 * 60 * 24),
                    );
                    setDaysDiff(diffDays);
                  }}
                  markedDates={
                    selectedDate
                      ? {
                          [selectedDate.toISOString().split('T')[0]]: {
                            selected: true,
                            selectedColor: '#22c55e',
                          },
                        }
                      : {}
                  }
                  markingType="simple"
                  style={{ height: 320, borderRadius: 8 }}
                  current={currentJapanDate}
                  minDate={currentJapanDate}
                  firstDay={1}
                  monthNames={[
                    '1月',
                    '2月',
                    '3月',
                    '4月',
                    '5月',
                    '6月',
                    '7月',
                    '8月',
                    '9月',
                    '10月',
                    '11月',
                    '12月',
                  ]}
                  dayNames={['日', '月', '火', '水', '木', '金', '土']}
                />
                {selectedDate ? (
                  <Text
                    size="sm"
                    className="text-typography-500 text-center mt-2"
                  >
                    選択した日付: {selectedDate.toLocaleDateString()}{' '}
                    {daysDiff !== null && `(今日から ${daysDiff - 1} 日)`}
                  </Text>
                ) : (
                  <Text
                    size="sm"
                    className="text-typography-500 text-center mt-2"
                  >
                    日付を選択してください
                  </Text>
                )}
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
