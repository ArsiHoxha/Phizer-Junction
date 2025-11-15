import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static lastNotificationTime: number = 0;
  private static readonly NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 minutes

  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('migraine-alerts', {
          name: 'Migraine Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async checkAndNotifyRiskLevel(riskLevel: number): Promise<void> {
    try {
      // Check if we're in cooldown period
      const now = Date.now();
      if (now - this.lastNotificationTime < this.NOTIFICATION_COOLDOWN) {
        return;
      }

      // Check if notifications are enabled
      const notificationsEnabled = await AsyncStorage.getItem('notifications_enabled');
      if (notificationsEnabled === 'false') {
        return;
      }

      let title = '';
      let body = '';
      let shouldNotify = false;

      if (riskLevel >= 70) {
        shouldNotify = true;
        title = '🔴 High Migraine Risk Alert';
        body = 'Your migraine risk is at ' + riskLevel + '%. Take preventive measures now: rest in a dark room, stay hydrated, and avoid triggers.';
      } else if (riskLevel >= 50) {
        shouldNotify = true;
        title = '🟡 Moderate Migraine Risk';
        body = 'Your migraine risk is at ' + riskLevel + '%. Consider taking a break, drinking water, and monitoring your symptoms.';
      } else if (riskLevel >= 30) {
        shouldNotify = true;
        title = '⚠️ Elevated Migraine Risk';
        body = 'Your risk level is at ' + riskLevel + '%. Stay mindful of triggers and maintain healthy habits.';
      }

      if (shouldNotify) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { riskLevel },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            categoryIdentifier: 'migraine-alerts',
          },
          trigger: null, // Immediate notification
        });

        this.lastNotificationTime = now;
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  static async sendReminderNotification(type: 'water' | 'coffee', amount: number): Promise<void> {
    try {
      const notificationsEnabled = await AsyncStorage.getItem('notifications_enabled');
      if (notificationsEnabled === 'false') {
        return;
      }

      let title = '';
      let body = '';

      if (type === 'water') {
        if (amount < 2) {
          title = '💧 Stay Hydrated';
          body = 'You\'ve only had ' + amount + ' glasses of water today. Dehydration can trigger migraines.';
        }
      } else if (type === 'coffee') {
        if (amount >= 3) {
          title = '☕ Caffeine Alert';
          body = 'You\'ve had ' + amount + ' cups of coffee today. High caffeine intake may trigger migraines.';
        }
      }

      if (title) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { type, amount },
            sound: true,
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.error('Error sending reminder notification:', error);
    }
  }

  static async enableNotifications(): Promise<void> {
    await AsyncStorage.setItem('notifications_enabled', 'true');
  }

  static async disableNotifications(): Promise<void> {
    await AsyncStorage.setItem('notifications_enabled', 'false');
  }

  static async isEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem('notifications_enabled');
    return enabled !== 'false'; // Default to true
  }
}
