import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// サウンドを再生する関数
export async function playClickSound() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/click.mp3'),
      {
        shouldPlay: true,
      },
    );
    await sound.playAsync();
    // クリーンアップ
    return () => {
      sound.unloadAsync();
    };
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}

// 触覚フィードバック関連の関数
export const haptics = {
  // 軽い触覚フィードバック
  light: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  },

  // 中程度の触覚フィードバック
  medium: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  },

  // 強い触覚フィードバック
  heavy: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  },

  // 成功のフィードバック
  success: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  },

  // エラーのフィードバック
  error: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  },
};
