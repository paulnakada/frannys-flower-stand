/**
 * notificationService.ts
 *
 * Handles requesting push permission and storing the FCM token.
 * Actual push delivery is triggered server-side by a Cloud Function
 * that fires when a new /posts document is created.
 *
 * See /functions/src/index.ts for the Cloud Function implementation.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { updateFcmToken } from './authService';

// Configure how notifications are presented while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Request Permission & Register Token ─────────────────────────────────────

export const registerForPushNotifications = async (
  userId: string
): Promise<string | null> => {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices.');
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('frannys-posts', {
      name: "Franny's Posts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E8A0B4',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission denied.');
    return null;
  }

  // Expo push token (works with Expo Go & bare workflow via EAS)
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: 'YOUR_EAS_PROJECT_ID', // Replace with your EAS project ID
  });

  const token = tokenData.data;

  // Persist token to Firestore so Cloud Functions can send to this device
  await updateFcmToken(userId, token);

  return token;
};

// ─── Listen for Incoming Notifications ───────────────────────────────────────

export const addNotificationListener = (
  onNotification: (notification: Notifications.Notification) => void
) => {
  return Notifications.addNotificationReceivedListener(onNotification);
};

export const addNotificationResponseListener = (
  onResponse: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(onResponse);
};
