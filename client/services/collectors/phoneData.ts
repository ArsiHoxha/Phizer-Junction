/**
 * Phone Data Collector
 * Passively collects screen time, app usage, notifications, and activity
 */

import { Accelerometer } from 'expo-sensors';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

export interface PhoneData {
  timestamp: Date;
  screenTimeMinutes: number;
  notificationCount: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  typingSpeed: number; // words per minute (simulated)
  typingErrors: number; // percentage (simulated)
  deviceInfo: {
    model: string;
    os: string;
    osVersion: string;
  };
}

class PhoneDataCollector {
  private sessionStartTime: Date = new Date();
  private totalScreenTime: number = 0; // minutes
  private notificationCount: number = 0;
  private lastActivityCheck: Date = new Date();
  private accelerometerSubscription: any = null;
  private recentAccelerometerData: number[] = [];
  
  constructor() {
    this.initializeAccelerometer();
    this.simulateNotifications();
  }

  /**
   * Initialize accelerometer for activity detection
   */
  private initializeAccelerometer() {
    try {
      Accelerometer.setUpdateInterval(5000); // Update every 5 seconds
      
      this.accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        this.recentAccelerometerData.push(magnitude);
        
        // Keep only last 12 readings (1 minute of data)
        if (this.recentAccelerometerData.length > 12) {
          this.recentAccelerometerData.shift();
        }
      });
    } catch (error) {
      console.log('Accelerometer not available, using simulated data');
    }
  }

  /**
   * Simulate notifications (would be real in production with permissions)
   */
  private simulateNotifications() {
    // Simulate random notifications throughout the day
    setInterval(() => {
      const hour = new Date().getHours();
      
      // More notifications during work hours
      if (hour >= 9 && hour <= 17) {
        if (Math.random() < 0.3) { // 30% chance every 5 minutes
          this.notificationCount += Math.floor(1 + Math.random() * 3);
        }
      } else {
        if (Math.random() < 0.1) { // 10% chance during off-hours
          this.notificationCount += 1;
        }
      }
      
      // Reset notification count at midnight
      if (hour === 0) {
        this.notificationCount = 0;
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Calculate activity level from accelerometer data
   */
  private getActivityLevel(): 'sedentary' | 'light' | 'moderate' | 'active' {
    if (this.recentAccelerometerData.length === 0) {
      // Simulate activity based on time of day if no real data
      const hour = new Date().getHours();
      
      if (hour >= 22 || hour <= 6) return 'sedentary'; // Sleep
      if (hour >= 7 && hour <= 9) return 'moderate'; // Morning routine
      if (hour >= 9 && hour <= 17) return 'light'; // Work hours
      if (hour >= 17 && hour <= 19) return 'moderate'; // Evening activity
      return 'light';
    }
    
    // Calculate average movement from accelerometer
    const avgMagnitude = 
      this.recentAccelerometerData.reduce((a, b) => a + b, 0) / 
      this.recentAccelerometerData.length;
    
    if (avgMagnitude < 1.05) return 'sedentary';
    if (avgMagnitude < 1.15) return 'light';
    if (avgMagnitude < 1.30) return 'moderate';
    return 'active';
  }

  /**
   * Calculate screen time (simulated - would need actual app usage API)
   */
  private getScreenTime(): number {
    const now = new Date();
    const minutesSinceStart = 
      (now.getTime() - this.sessionStartTime.getTime()) / (1000 * 60);
    
    // Simulate screen time patterns
    const hour = now.getHours();
    let screenTimeRatio = 0.3; // Default 30% of time on screen
    
    // Higher screen time during work hours
    if (hour >= 9 && hour <= 17) {
      screenTimeRatio = 0.6; // 60% during work
    } else if (hour >= 20 && hour <= 23) {
      screenTimeRatio = 0.5; // 50% in evening
    } else if (hour >= 0 && hour <= 7) {
      screenTimeRatio = 0.05; // 5% during sleep
    }
    
    this.totalScreenTime = Math.floor(minutesSinceStart * screenTimeRatio);
    return this.totalScreenTime;
  }

  /**
   * Simulate typing speed (would be real with keyboard monitoring)
   */
  private getTypingSpeed(): number {
    const hour = new Date().getHours();
    let baseSpeed = 45; // words per minute
    
    // Faster during work hours
    if (hour >= 9 && hour <= 17) {
      baseSpeed = 55;
    }
    
    // Slower when tired
    if (hour >= 22 || hour <= 6) {
      baseSpeed = 30;
    }
    
    // Add variation
    return Math.floor(baseSpeed + (Math.random() - 0.5) * 10);
  }

  /**
   * Simulate typing errors (would be real with keyboard monitoring)
   */
  private getTypingErrors(): number {
    const hour = new Date().getHours();
    let baseErrors = 3; // 3% error rate
    
    // More errors when tired or stressed
    if (hour >= 22 || hour <= 6) {
      baseErrors = 8; // 8% when tired
    } else if (hour >= 14 && hour <= 16) {
      baseErrors = 5; // 5% during afternoon slump
    }
    
    // Add variation
    return Math.max(0, Math.min(15, baseErrors + (Math.random() - 0.5) * 3));
  }

  /**
   * Get device information
   */
  private async getDeviceInfo() {
    try {
      return {
        model: Device.modelName || 'Unknown',
        os: Device.osName || 'Unknown',
        osVersion: Device.osVersion || 'Unknown',
      };
    } catch (error) {
      return {
        model: 'Simulator',
        os: 'iOS',
        osVersion: '17.0',
      };
    }
  }

  /**
   * Collect all phone data
   */
  public async collectData(): Promise<PhoneData> {
    const deviceInfo = await this.getDeviceInfo();
    
    return {
      timestamp: new Date(),
      screenTimeMinutes: this.getScreenTime(),
      notificationCount: this.notificationCount,
      activityLevel: this.getActivityLevel(),
      typingSpeed: this.getTypingSpeed(),
      typingErrors: this.getTypingErrors(),
      deviceInfo,
    };
  }

  /**
   * Reset daily counters (call at midnight)
   */
  public resetDailyCounters() {
    this.sessionStartTime = new Date();
    this.totalScreenTime = 0;
    this.notificationCount = 0;
  }

  /**
   * Cleanup
   */
  public cleanup() {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
    }
  }
}

// Singleton instance
let collectorInstance: PhoneDataCollector | null = null;

export const getPhoneDataCollector = (): PhoneDataCollector => {
  if (!collectorInstance) {
    collectorInstance = new PhoneDataCollector();
  }
  return collectorInstance;
};

export const cleanupPhoneDataCollector = () => {
  if (collectorInstance) {
    collectorInstance.cleanup();
  }
  collectorInstance = null;
};
