import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const EAS_PROJECT_ID = '11ae681b-cf13-45fb-bd8e-ca16e2643e65';

export function useNotifications() {
  useEffect(() => {
    registerForPushNotifications();
  }, []);
}

async function registerForPushNotifications() {
  // Remote push notifications require a production/dev build — not Expo Go SDK 53+
  if (!Device.isDevice) return;

  try {
    // Dynamic require keeps expo-notifications from loading at module init time,
    // which crashes in Expo Go SDK 53+ before the JS runtime is ready.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });
    await setDoc(doc(db, 'pushTokens', token), {
      token,
      platform: Device.osName ?? 'unknown',
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Silently ignore — notifications unavailable in Expo Go or on simulators
  }
}
