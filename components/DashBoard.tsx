import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { AddIcon } from '@/components/ui/icon';
import { VStack } from './ui/vstack';

export default function DashBoard() {


  return (
    <VStack>
      <Input
        variant="outline"
        size="md"
        isDisabled={false}
        isInvalid={false}
        isReadOnly={false}
      >
        <InputField placeholder="新しい習慣を入力..." />
      </Input>
      <Button size='sm'>
        <ButtonIcon as={AddIcon} />
        <ButtonText>追加</ButtonText>
      </Button>

      
    </VStack>
  );
}
