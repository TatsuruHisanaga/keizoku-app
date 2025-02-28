import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Session } from '@supabase/supabase-js';

type ProfileInfoProps = {
  username: string;
  userIdentifier: string;
  followersCount: number;
  followingCount: number;
  session: Session | null;
  profileId: string;
};

export function ProfileInfo({
  username,
  userIdentifier,
  followersCount,
  followingCount,
  session,
  profileId,
}: ProfileInfoProps) {
  const router = useRouter();

  return (
    <>
      <VStack className="flex-1 mx-3 ml-4">
        <Text className="text-lg font-bold">{username || '未設定'}</Text>
        <Text className="text-sm text-gray-500">
          {userIdentifier ? `@${userIdentifier}` : ''}
        </Text>
      </VStack>

      <HStack space="md" className="mr-8">
        <TouchableOpacity
          onPress={() => router.push(`/followers/${profileId}`)}
        >
          <Box className="items-center">
            <Text className="font-bold">{followersCount}</Text>
            <Text className="text-gray-600">フォロワー</Text>
          </Box>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/following/${profileId}`)}
        >
          <Box className="items-center">
            <Text className="font-bold">{followingCount}</Text>
            <Text className="text-gray-600">フォロー中</Text>
          </Box>
        </TouchableOpacity>
      </HStack>
    </>
  );
}
