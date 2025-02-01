import { useState, useRef } from 'react';
import { Fab, FabIcon, FabLabel } from '@/components/ui/fab';
import { AddIcon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';
import { Heading } from '@/components/ui/heading';
import { VStack } from '@/components/ui/vstack';

type HabitFabProps = {
  onAddHabit: (habitName: string) => Promise<boolean>;
  maxHabitsReached: boolean;
};

export default function HabitFab({
  onAddHabit,
  maxHabitsReached,
}: HabitFabProps) {
  const [showModal, setShowModal] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorType, setErrorType] = useState<
    'empty' | 'tooLong' | 'duplicate' | null
  >(null);

  const habitTextRef = useRef<string>('');

  const [inputKey, setInputKey] = useState(Math.random().toString(36));

  const handleSubmit = async () => {
    if (maxHabitsReached) {
      alert('習慣は3個までしか追加できません');
      setShowModal(false);
      return;
    }

    const habitText = habitTextRef.current;
    const hasError = await onAddHabit(habitText);
    if (hasError) {
      setShowError(true);
      if (!habitText.trim()) {
        setErrorType('empty');
      } else if (habitText.length > 16) {
        setErrorType('tooLong');
      } else {
        setErrorType('duplicate');
      }
    } else {
      setShowError(false);
      setErrorType(null);
      habitTextRef.current = '';
      setInputKey(Math.random().toString(36));
      setShowModal(false);
    }
  };

  return (
    <>
      <Fab
        size="lg"
        onPress={() => setShowModal(true)}
        className="bg-teal-300 hover:bg-[#15803d] active:bg-[#166534]"
      >
        <FabIcon as={AddIcon} color="black" />
      </Fab>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          habitTextRef.current = '';
          setInputKey(Math.random().toString(36));
          setShowError(false);
          setErrorType(null);
        }}
      >
        <ModalBackdrop />
        <ModalContent>
          <ModalBody>
            <VStack space="md">
              <Box>
                <Input
                  variant="outline"
                  size="lg"
                  isDisabled={false}
                  isInvalid={showError}
                  isReadOnly={false}
                >
                  <InputField
                    key={inputKey}
                    placeholder="新しい習慣を入力..."
                    onChangeText={(text) => {
                      habitTextRef.current = text;
                      setShowError(false);
                      setErrorType(null);
                    }}
                    onFocus={() => {
                      setShowError(false);
                      setErrorType(null);
                    }}
                  />
                </Input>
                {showError && (
                  <Text size="sm" style={{ color: '#EF4444' }} className="mt-1">
                    {errorType === 'empty'
                      ? '習慣名を入力してください'
                      : errorType === 'tooLong'
                        ? '習慣名は16文字以内で入力してください'
                        : '同じ名前の習慣が既に存在します'}
                  </Text>
                )}
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              size="sm"
              action="secondary"
              style={{ marginRight: 12 }}
              onPress={() => {
                setShowModal(false);
                habitTextRef.current = '';
                setInputKey(Math.random().toString(36));
              }}
            >
              <ButtonText>キャンセル</ButtonText>
            </Button>
            <Button size="sm" action="primary" onPress={handleSubmit}>
              <ButtonText>追加</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
