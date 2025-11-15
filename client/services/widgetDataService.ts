/**
 * Widget Data Service
 * 
 * This service manages data sharing between the main app and iOS/Android widgets.
 * It stores migraine risk data in a format that can be accessed by home screen widgets.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { Platform } from 'react-native';

const WIDGET_DATA_KEY = 'widget_migraine_data';
const APP_GROUP_ID = 'group.com.phizerjunction.migraine'; // Update with your actual app group ID

export interface WidgetData {
  riskPercentage: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  riskColor: string;
  lastUpdate: string;
  topTriggers: string[];
  todayMetrics: {
    heartRate?: number;
    hrv?: number;
    stress?: number;
    sleep?: number;
  };
}

const WidgetDataService = {
  /**
   * Update widget data with current migraine risk information
   */
  updateWidgetData: async (data: WidgetData): Promise<void> => {
    try {
      const widgetData = {
        ...data,
        lastUpdate: new Date().toISOString(),
      };

      // Store in AsyncStorage for React Native access
      await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(widgetData));

      // Store in shared app group for widget access (iOS)
      if (Platform.OS === 'ios') {
        try {
          await SharedGroupPreferences.setItem(
            WIDGET_DATA_KEY,
            widgetData,
            APP_GROUP_ID
          );
        } catch (error) {
          console.log('Shared group preferences not available (expected before prebuild):', error);
        }
      }

      console.log('Widget data updated:', widgetData);
    } catch (error) {
      console.error('Error updating widget data:', error);
    }
  },

  /**
   * Get current widget data
   */
  getWidgetData: async (): Promise<WidgetData | null> => {
    try {
      const data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting widget data:', error);
      return null;
    }
  },

  /**
   * Calculate risk level from percentage
   */
  getRiskLevel: (percentage: number): WidgetData['riskLevel'] => {
    if (percentage < 30) return 'Low';
    if (percentage < 50) return 'Moderate';
    if (percentage < 70) return 'High';
    return 'Very High';
  },

  /**
   * Get color for risk level
   */
  getRiskColor: (percentage: number): string => {
    if (percentage < 30) return '#10B981'; // green
    if (percentage < 50) return '#F59E0B'; // yellow/orange
    if (percentage < 70) return '#F97316'; // orange
    return '#EF4444'; // red
  },

  /**
   * Format data for widget display
   */
  formatForWidget: (
    riskPercentage: number,
    triggers: any[],
    metrics: any
  ): WidgetData => {
    const topTriggers = triggers
      .filter(t => t.detected)
      .slice(0, 3)
      .map(t => t.name);

    return {
      riskPercentage: Math.round(riskPercentage),
      riskLevel: WidgetDataService.getRiskLevel(riskPercentage),
      riskColor: WidgetDataService.getRiskColor(riskPercentage),
      lastUpdate: new Date().toISOString(),
      topTriggers,
      todayMetrics: {
        heartRate: metrics.heartRate,
        hrv: metrics.hrv,
        stress: metrics.stress,
        sleep: metrics.sleepQuality,
      },
    };
  },
};

export default WidgetDataService;
