/**
 * Sleep Tracker
 * Infers sleep from phone inactivity and accelerometer data
 * Can sync with wearable data if available
 */

import { Accelerometer } from 'expo-sensors';

export interface SleepData {
  timestamp: Date;
  sleepStartTime: Date | null;
  sleepEndTime: Date | null;
  totalSleepMinutes: number;
  sleepQuality: number; // 0-100
  sleepDebt: number; // accumulated hours
  restlessness: number; // 0-100 (movement during sleep)
  isInferred: boolean;
}

interface SleepSession {
  startTime: Date;
  endTime: Date | null;
  movementCount: number;
}

class SleepTracker {
  private currentSession: SleepSession | null = null;
  private lastActivityTime: Date = new Date();
  private inactivityThresholdMinutes: number = 30;
  private recentMovement: number[] = [];
  private accelerometerSubscription: any = null;
  private totalSleepDebt: number = 0; // hours
  private lastSleepData: SleepData | null = null;
  
  constructor() {
    this.initializeAccelerometer();
  }

  /**
   * Initialize accelerometer for movement detection
   */
  private initializeAccelerometer() {
    try {
      Accelerometer.setUpdateInterval(10000); // Check every 10 seconds
      
      this.accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        
        // Detect significant movement
        if (magnitude > 1.1) {
          this.lastActivityTime = new Date();
          
          if (this.currentSession) {
            this.currentSession.movementCount++;
          }
        }
        
        this.recentMovement.push(magnitude);
        if (this.recentMovement.length > 30) {
          this.recentMovement.shift();
        }
      });
    } catch (error) {
      console.log('Accelerometer not available for sleep tracking');
    }
  }

  /**
   * Check if user is likely sleeping (based on inactivity)
   */
  private isLikelySleeping(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const minutesSinceActivity = 
      (now.getTime() - this.lastActivityTime.getTime()) / (1000 * 60);
    
    // Must be night time (9 PM - 9 AM) and inactive
    const isNightTime = hour >= 21 || hour <= 9;
    const isInactive = minutesSinceActivity >= this.inactivityThresholdMinutes;
    
    return isNightTime && isInactive;
  }

  /**
   * Calculate restlessness from movement during sleep
   */
  private calculateRestlessness(): number {
    if (!this.currentSession) return 0;
    
    const sessionDurationMinutes = this.currentSession.endTime
      ? (this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()) / (1000 * 60)
      : 0;
    
    if (sessionDurationMinutes === 0) return 0;
    
    // More movements = more restlessness
    const movementsPerHour = (this.currentSession.movementCount / sessionDurationMinutes) * 60;
    
    // Normal: 2-5 movements/hour, Restless: 10+ movements/hour
    return Math.min(100, Math.max(0, (movementsPerHour / 15) * 100));
  }

  /**
   * Calculate sleep quality based on duration and restlessness
   */
  private calculateSleepQuality(durationHours: number, restlessness: number): number {
    let quality = 100;
    
    // Ideal sleep: 7-9 hours
    if (durationHours < 6) {
      quality -= (6 - durationHours) * 15; // Lose 15 points per hour below 6
    } else if (durationHours > 9) {
      quality -= (durationHours - 9) * 10; // Lose 10 points per hour above 9
    }
    
    // Restlessness penalty
    quality -= restlessness * 0.5;
    
    return Math.max(0, Math.min(100, quality));
  }

  /**
   * Update sleep debt calculation
   */
  private updateSleepDebt(sleepHours: number) {
    const idealSleep = 8;
    const difference = idealSleep - sleepHours;
    
    if (difference > 0) {
      // Accumulate debt
      this.totalSleepDebt += difference;
    } else {
      // Reduce debt with extra sleep
      this.totalSleepDebt = Math.max(0, this.totalSleepDebt + difference * 0.5);
    }
    
    // Cap sleep debt at 20 hours
    this.totalSleepDebt = Math.min(20, this.totalSleepDebt);
  }

  /**
   * Start a new sleep session
   */
  private startSleepSession() {
    if (!this.currentSession) {
      this.currentSession = {
        startTime: new Date(),
        endTime: null,
        movementCount: 0,
      };
      console.log('Sleep session started');
    }
  }

  /**
   * End current sleep session
   */
  private endSleepSession() {
    if (this.currentSession && !this.currentSession.endTime) {
      this.currentSession.endTime = new Date();
      console.log('Sleep session ended');
    }
  }

  /**
   * Simulate realistic sleep data (for demo purposes)
   */
  private simulateSleepData(): SleepData {
    const now = new Date();
    const hour = now.getHours();
    
    // Simulate typical sleep schedule (11 PM - 7 AM)
    let sleepStart = new Date();
    sleepStart.setHours(23, 0, 0, 0);
    if (hour >= 0 && hour < 7) {
      sleepStart.setDate(sleepStart.getDate() - 1);
    }
    
    let sleepEnd = new Date();
    sleepEnd.setHours(7, 0, 0, 0);
    if (hour < 7) {
      // Still sleeping
      sleepEnd = now;
    }
    
    const sleepMinutes = (sleepEnd.getTime() - sleepStart.getTime()) / (1000 * 60);
    const sleepHours = sleepMinutes / 60;
    
    // Simulate some variation
    const adjustedSleepHours = sleepHours + (Math.random() - 0.5) * 2;
    const restlessness = 20 + Math.random() * 30; // 20-50% restlessness
    
    this.updateSleepDebt(adjustedSleepHours);
    
    return {
      timestamp: now,
      sleepStartTime: sleepStart,
      sleepEndTime: hour < 7 ? null : sleepEnd,
      totalSleepMinutes: Math.floor(adjustedSleepHours * 60),
      sleepQuality: this.calculateSleepQuality(adjustedSleepHours, restlessness),
      sleepDebt: this.totalSleepDebt,
      restlessness,
      isInferred: true,
    };
  }

  /**
   * Collect sleep data
   */
  public collectData(): SleepData {
    const isSleeping = this.isLikelySleeping();
    
    if (isSleeping && !this.currentSession) {
      this.startSleepSession();
    } else if (!isSleeping && this.currentSession && !this.currentSession.endTime) {
      this.endSleepSession();
    }
    
    // If we have a completed session, calculate real data
    if (this.currentSession && this.currentSession.endTime) {
      const sleepMinutes = 
        (this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()) / 
        (1000 * 60);
      const sleepHours = sleepMinutes / 60;
      const restlessness = this.calculateRestlessness();
      
      this.updateSleepDebt(sleepHours);
      
      const data: SleepData = {
        timestamp: new Date(),
        sleepStartTime: this.currentSession.startTime,
        sleepEndTime: this.currentSession.endTime,
        totalSleepMinutes: Math.floor(sleepMinutes),
        sleepQuality: this.calculateSleepQuality(sleepHours, restlessness),
        sleepDebt: this.totalSleepDebt,
        restlessness,
        isInferred: true,
      };
      
      this.lastSleepData = data;
      
      // Reset session after reporting
      this.currentSession = null;
      
      return data;
    }
    
    // Use simulated data for demo
    return this.simulateSleepData();
  }

  /**
   * Get current sleep status
   */
  public isSleeping(): boolean {
    return this.currentSession !== null && !this.currentSession.endTime;
  }

  /**
   * Get last night's sleep summary
   */
  public getLastNightSleep(): SleepData | null {
    return this.lastSleepData;
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
let trackerInstance: SleepTracker | null = null;

export const getSleepTracker = (): SleepTracker => {
  if (!trackerInstance) {
    trackerInstance = new SleepTracker();
  }
  return trackerInstance;
};

export const cleanupSleepTracker = () => {
  if (trackerInstance) {
    trackerInstance.cleanup();
  }
  trackerInstance = null;
};
