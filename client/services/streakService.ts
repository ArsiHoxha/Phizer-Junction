/**
 * Streak Service - Track daily app usage to encourage retention
 * Records each day the app is opened and calculates streaks
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = '@migraine_guardian_streak';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastOpenDate: string; // ISO date string
  openDates: string[]; // Array of ISO date strings for last 30 days
  totalDays: number;
}

/**
 * Get the start of today in ISO format (for comparison)
 */
function getTodayKey(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Get yesterday's date key
 */
function getYesterdayKey(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Calculate days between two date strings
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Load streak data from storage
 */
export async function loadStreakData(): Promise<StreakData> {
  try {
    const data = await AsyncStorage.getItem(STREAK_KEY);
    
    if (data) {
      return JSON.parse(data);
    }
    
    // Initialize new streak data
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastOpenDate: '',
      openDates: [],
      totalDays: 0,
    };
  } catch (error) {
    console.error('Error loading streak data:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastOpenDate: '',
      openDates: [],
      totalDays: 0,
    };
  }
}

/**
 * Save streak data to storage
 */
async function saveStreakData(data: StreakData): Promise<void> {
  try {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving streak data:', error);
  }
}

/**
 * Record that the app was opened today
 * Updates streak if this is a new day
 */
export async function recordAppOpen(): Promise<StreakData> {
  const today = getTodayKey();
  const yesterday = getYesterdayKey();
  const data = await loadStreakData();

  // If already recorded today, just return current data
  if (data.lastOpenDate === today) {
    return data;
  }

  // New day! Update streak
  const newData = { ...data };
  
  // Add today to open dates
  newData.openDates.push(today);
  newData.lastOpenDate = today;
  newData.totalDays++;

  // Keep only last 30 days
  if (newData.openDates.length > 30) {
    newData.openDates = newData.openDates.slice(-30);
  }

  // Calculate streak
  if (data.lastOpenDate === yesterday) {
    // Continuing streak!
    newData.currentStreak = data.currentStreak + 1;
  } else if (data.lastOpenDate === '') {
    // First time opening app
    newData.currentStreak = 1;
  } else {
    // Streak broken, start new one
    newData.currentStreak = 1;
  }

  // Update longest streak
  if (newData.currentStreak > newData.longestStreak) {
    newData.longestStreak = newData.currentStreak;
  }

  await saveStreakData(newData);
  
  console.log('📅 Streak updated:', {
    currentStreak: newData.currentStreak,
    totalDays: newData.totalDays,
  });

  return newData;
}

/**
 * Get last 7 days with open status
 */
export function getLast7Days(streakData: StreakData): Array<{ date: string; opened: boolean; isToday: boolean }> {
  const days: Array<{ date: string; opened: boolean; isToday: boolean }> = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];
    
    days.push({
      date: dateKey,
      opened: streakData.openDates.includes(dateKey),
      isToday: dateKey === getTodayKey(),
    });
  }
  
  return days;
}

/**
 * Get streak fire emoji based on streak length
 */
export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return '🔥'; // On fire!
  if (streak >= 14) return '🔥'; // Two weeks
  if (streak >= 7) return '🔥'; // One week
  if (streak >= 3) return '🔥'; // Getting started
  return '🔥'; // Always show fire
}

/**
 * Get streak message
 */
export function getStreakMessage(streak: number): string {
  if (streak >= 30) return 'Amazing! 30+ days!';
  if (streak >= 14) return 'Great! 2 weeks strong!';
  if (streak >= 7) return 'Keep it up! 1 week!';
  if (streak >= 3) return 'Nice! 3 days in a row!';
  if (streak === 2) return 'Day 2! Keep going!';
  if (streak === 1) return 'Day 1! Start your streak!';
  return 'Open daily to build streak!';
}

/**
 * Reset streak data (for testing)
 */
export async function resetStreak(): Promise<void> {
  await AsyncStorage.removeItem(STREAK_KEY);
  console.log('Streak data reset');
}
