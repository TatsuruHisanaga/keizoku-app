import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { BicepsFlexed, Flame, Medal, GraduationCap } from 'lucide-react-native';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const getBadgeStyle = (streak: number) => {
    if (streak >= 30) {
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        iconColor: '#A855F7',
        icon: GraduationCap,
        label: '絶好調',
      };
    } else if (streak >= 14) {
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        iconColor: '#3B82F6',
        icon: Medal,
        label: '好調',
      };
    } else if (streak >= 7) {
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-600',
        iconColor: '#F97316',
        icon: Flame,
        label: '順調',
      };
    } else {
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        iconColor: '#6B7280',
        icon: BicepsFlexed,
        label: 'チャレンジ中',
      };
    }
  };

  const style = getBadgeStyle(streak);
  const IconComponent = style.icon;

  return (
    <Box className={`${style.bg} px-3 py-1 rounded-full`}>
      <HStack space="xs" className="items-center">
        <IconComponent color={style.iconColor} size={16} />
        <Text className={`${style.text} font-bold`}>{streak}日連続</Text>
      </HStack>
    </Box>
  );
}
