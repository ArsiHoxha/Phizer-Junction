/**
 * Simulated Wearable Engine
 * Generates realistic HRV, heart rate, sleep, and stress trends
 * Simulates migraine prediction patterns (HRV drops 6-12h before migraine)
 */

export interface WearableData {
  timestamp: Date;
  hrv: number; // milliseconds (30-100 typical, drops to 20-40 before migraine)
  heartRate: number; // bpm (60-100 typical, increases slightly before migraine)
  stress: number; // 0-100 scale
  sleepQuality: number; // 0-100 scale
  steps: number;
  isSimulated: boolean;
}

export interface MigraineSimulation {
  nextMigraineTime: Date | null;
  hoursUntilMigraine: number | null;
  isPreMigrainePhase: boolean;
}

class WearableSimulator {
  private baseHRV: number = 65; // Baseline HRV in milliseconds
  private baseHeartRate: number = 70; // Baseline heart rate
  private migraineSimulation: MigraineSimulation = {
    nextMigraineTime: null,
    hoursUntilMigraine: null,
    isPreMigrainePhase: false,
  };
  
  private lastDataPoint: WearableData | null = null;
  private dailySteps: number = 0;
  private sleepDebt: number = 0; // Accumulated sleep debt (hours)

  constructor() {
    this.initializeMigraineCycle();
  }

  /**
   * Initialize a random migraine cycle (every 5-15 days for chronic sufferers)
   */
  private initializeMigraineCycle() {
    const daysUntilNextMigraine = 7 + Math.random() * 8; // 7-15 days
    this.migraineSimulation.nextMigraineTime = new Date(
      Date.now() + daysUntilNextMigraine * 24 * 60 * 60 * 1000
    );
    this.updateMigrainePhase();
  }

  /**
   * Update migraine phase based on current time
   */
  private updateMigrainePhase() {
    if (!this.migraineSimulation.nextMigraineTime) return;

    const now = new Date();
    const hoursUntil = 
      (this.migraineSimulation.nextMigraineTime.getTime() - now.getTime()) / 
      (1000 * 60 * 60);

    this.migraineSimulation.hoursUntilMigraine = hoursUntil;
    this.migraineSimulation.isPreMigrainePhase = hoursUntil <= 12 && hoursUntil > 0;

    // If migraine time passed, schedule next one
    if (hoursUntil <= 0) {
      this.initializeMigraineCycle();
    }
  }

  /**
   * Get current simulated HRV (drops 6-12h before migraine)
   */
  private getSimulatedHRV(): number {
    this.updateMigrainePhase();
    
    let hrv = this.baseHRV;
    
    // Pre-migraine phase: HRV drops significantly
    if (this.migraineSimulation.isPreMigrainePhase) {
      const hoursUntil = this.migraineSimulation.hoursUntilMigraine!;
      const dropPercentage = Math.max(0, (12 - hoursUntil) / 12); // 0 to 1
      hrv = this.baseHRV - (dropPercentage * 35); // Drop up to 35ms
    }
    
    // Add sleep debt impact
    if (this.sleepDebt > 2) {
      hrv -= this.sleepDebt * 3; // -3ms per hour of sleep debt
    }
    
    // Add daily variation
    const hourOfDay = new Date().getHours();
    if (hourOfDay >= 22 || hourOfDay <= 6) {
      hrv += 10; // Higher HRV during sleep
    }
    
    // Add random noise
    hrv += (Math.random() - 0.5) * 8;
    
    return Math.max(25, Math.min(100, hrv));
  }

  /**
   * Get current simulated heart rate (increases before migraine)
   */
  private getSimulatedHeartRate(): number {
    let hr = this.baseHeartRate;
    
    // Pre-migraine phase: Heart rate increases
    if (this.migraineSimulation.isPreMigrainePhase) {
      const hoursUntil = this.migraineSimulation.hoursUntilMigraine!;
      const increasePercentage = Math.max(0, (12 - hoursUntil) / 12);
      hr += increasePercentage * 15; // Increase up to 15 bpm
    }
    
    // Stress impact
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour <= 17) {
      hr += 5; // Work hours stress
    }
    
    // Sleep/rest hours
    if (currentHour >= 22 || currentHour <= 6) {
      hr -= 10; // Lower during sleep
    }
    
    // Random variation
    hr += (Math.random() - 0.5) * 6;
    
    return Math.max(50, Math.min(120, hr));
  }

  /**
   * Get stress level (0-100)
   */
  private getSimulatedStress(): number {
    let stress = 30; // Base stress
    
    // Pre-migraine stress spike
    if (this.migraineSimulation.isPreMigrainePhase) {
      const hoursUntil = this.migraineSimulation.hoursUntilMigraine!;
      const stressIncrease = Math.max(0, (12 - hoursUntil) / 12);
      stress += stressIncrease * 40;
    }
    
    // Time of day pattern
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour <= 12) {
      stress += 20; // Morning rush
    } else if (currentHour >= 14 && currentHour <= 17) {
      stress += 25; // Afternoon peak
    } else if (currentHour >= 22 || currentHour <= 6) {
      stress = 10; // Sleep/rest
    }
    
    // Sleep debt increases stress
    stress += this.sleepDebt * 5;
    
    // Random variation
    stress += (Math.random() - 0.5) * 15;
    
    return Math.max(0, Math.min(100, stress));
  }

  /**
   * Get sleep quality (0-100)
   */
  private getSimulatedSleepQuality(): number {
    let quality = 75; // Base quality
    
    // Pre-migraine: Poor sleep quality
    if (this.migraineSimulation.isPreMigrainePhase) {
      quality -= 30;
    }
    
    // Sleep debt impact
    quality -= this.sleepDebt * 8;
    
    // Random variation
    quality += (Math.random() - 0.5) * 20;
    
    return Math.max(20, Math.min(100, quality));
  }

  /**
   * Simulate daily steps with realistic patterns
   */
  private updateSteps() {
    const currentHour = new Date().getHours();
    
    // Reset steps at midnight
    if (currentHour === 0 && this.lastDataPoint) {
      const lastHour = this.lastDataPoint.timestamp.getHours();
      if (lastHour === 23) {
        this.dailySteps = 0;
      }
    }
    
    // Add steps based on time of day
    let stepsIncrement = 0;
    if (currentHour >= 7 && currentHour <= 9) {
      stepsIncrement = 150 + Math.random() * 100; // Morning activity
    } else if (currentHour >= 12 && currentHour <= 13) {
      stepsIncrement = 100 + Math.random() * 80; // Lunch walk
    } else if (currentHour >= 17 && currentHour <= 19) {
      stepsIncrement = 120 + Math.random() * 100; // Evening activity
    } else if (currentHour >= 10 && currentHour <= 16) {
      stepsIncrement = 50 + Math.random() * 50; // Work hours
    } else {
      stepsIncrement = Math.random() * 20; // Minimal movement
    }
    
    this.dailySteps += Math.floor(stepsIncrement);
  }

  /**
   * Update sleep debt based on sleep patterns
   */
  private updateSleepDebt() {
    const currentHour = new Date().getHours();
    
    // Check if user is "sleeping" (between 10 PM and 7 AM)
    if (currentHour >= 22 || currentHour <= 7) {
      // Reduce sleep debt during sleep hours
      this.sleepDebt = Math.max(0, this.sleepDebt - 0.1);
    } else {
      // Accumulate sleep debt during wake hours if debt exists
      if (Math.random() < 0.1) { // 10% chance per reading
        this.sleepDebt = Math.min(8, this.sleepDebt + 0.5);
      }
    }
  }

  /**
   * Generate current wearable data point
   */
  public getCurrentData(): WearableData {
    this.updateSteps();
    this.updateSleepDebt();
    
    const data: WearableData = {
      timestamp: new Date(),
      hrv: this.getSimulatedHRV(),
      heartRate: this.getSimulatedHeartRate(),
      stress: this.getSimulatedStress(),
      sleepQuality: this.getSimulatedSleepQuality(),
      steps: this.dailySteps,
      isSimulated: true,
    };
    
    this.lastDataPoint = data;
    return data;
  }

  /**
   * Get migraine prediction info for debugging/display
   */
  public getMigrainePrediction(): MigraineSimulation {
    this.updateMigrainePhase();
    return { ...this.migraineSimulation };
  }

  /**
   * Get current migraine risk percentage (0-100)
   */
  public getCurrentRisk(): number {
    this.updateMigrainePhase();
    
    if (!this.migraineSimulation.isPreMigrainePhase) {
      return 10 + Math.random() * 20; // Low baseline risk
    }
    
    const hoursUntil = this.migraineSimulation.hoursUntilMigraine!;
    const risk = Math.max(0, 100 - (hoursUntil / 12) * 70); // Increases as migraine approaches
    
    return Math.min(95, risk);
  }
}

// Singleton instance
let simulatorInstance: WearableSimulator | null = null;

export const getWearableSimulator = (): WearableSimulator => {
  if (!simulatorInstance) {
    simulatorInstance = new WearableSimulator();
  }
  return simulatorInstance;
};

export const resetWearableSimulator = () => {
  simulatorInstance = null;
};
