/**
 * Realistic Health Metrics Dataset
 * 100+ pre-generated realistic values for health metrics
 * Based on medical research and real-world patterns
 */

export interface HealthDataPoint {
  id: number;
  timestamp: Date;
  // Wearable Metrics
  hrv: number; // Heart Rate Variability (ms) - Normal: 50-100, Low: <40
  heartRate: number; // BPM - Normal: 60-80, Elevated: >90
  stress: number; // Percentage 0-100
  sleepQuality: number; // Percentage 0-100
  sleepHours: number; // Hours - Optimal: 7-9
  steps: number; // Daily steps
  
  // Screen & Activity
  screenTimeMinutes: number; // Daily screen time
  notificationCount: number; // Daily notifications
  activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'Active';
  
  // Environmental
  temperature: number; // Celsius
  humidity: number; // Percentage
  pressure: number; // hPa - Low pressure (<1010) = migraine trigger
  uvIndex: number; // 0-11+
  
  // Calendar/Stress
  calendarEvents: number; // Events today
  calendarStress: number; // 0-100
  
  // Profile
  migraineRisk: number; // 0-100 calculated risk
  hasMigraine: boolean; // Whether this led to a migraine
}

// Generate 100 realistic data points with medical patterns
function generateRealisticDataset(): HealthDataPoint[] {
  const dataset: HealthDataPoint[] = [];
  const baseDate = new Date('2025-10-01T00:00:00');
  
  // Generate data for ~33 days, 3 readings per day = ~100 entries
  for (let day = 0; day < 34; day++) {
    // Simulate weekly patterns and migraine cycles
    const dayOfWeek = day % 7;
    const weekNumber = Math.floor(day / 7);
    
    // Pattern variables
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    const isStressWeek = weekNumber % 3 === 2; // Every 3rd week is stressful
    const weatherCycleDays = Math.sin(day * 0.2) * 10; // Weather pressure cycles
    
    // Morning reading (8 AM)
    const morningData = generateDataPoint(
      dataset.length,
      new Date(baseDate.getTime() + day * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      {
        dayOfWeek,
        isWeekend,
        isStressWeek,
        weatherCycle: weatherCycleDays,
        timeOfDay: 'morning',
        previousSleep: 7.5 - (isStressWeek ? 1.5 : 0),
      }
    );
    dataset.push(morningData);
    
    // Afternoon reading (2 PM)
    const afternoonData = generateDataPoint(
      dataset.length,
      new Date(baseDate.getTime() + day * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
      {
        dayOfWeek,
        isWeekend,
        isStressWeek,
        weatherCycle: weatherCycleDays,
        timeOfDay: 'afternoon',
        previousSleep: 7.5 - (isStressWeek ? 1.5 : 0),
      }
    );
    dataset.push(afternoonData);
    
    // Evening reading (8 PM)
    const eveningData = generateDataPoint(
      dataset.length,
      new Date(baseDate.getTime() + day * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000),
      {
        dayOfWeek,
        isWeekend,
        isStressWeek,
        weatherCycle: weatherCycleDays,
        timeOfDay: 'evening',
        previousSleep: 7.5 - (isStressWeek ? 1.5 : 0),
      }
    );
    dataset.push(eveningData);
  }
  
  return dataset.slice(0, 100); // Exactly 100 entries
}

function generateDataPoint(id: number, timestamp: Date, context: any): HealthDataPoint {
  const { dayOfWeek, isWeekend, isStressWeek, weatherCycle, timeOfDay, previousSleep } = context;
  
  // Base values (healthy baseline)
  let hrv = 65;
  let heartRate = 72;
  let stress = 35;
  let sleepQuality = 80;
  let sleepHours = previousSleep;
  let steps = 8000;
  let screenTimeMinutes = 200;
  let notificationCount = 60;
  let activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'Active' = 'Moderate';
  let calendarEvents = 4;
  let calendarStress = 35;
  
  // Time of day adjustments
  if (timeOfDay === 'morning') {
    hrv += 5; // Higher HRV in morning
    heartRate -= 3;
    stress -= 5;
    steps = Math.floor(steps * 0.3);
    screenTimeMinutes = Math.floor(screenTimeMinutes * 0.3);
    notificationCount = Math.floor(notificationCount * 0.4);
  } else if (timeOfDay === 'afternoon') {
    stress += 10;
    heartRate += 4;
    steps = Math.floor(steps * 0.8);
    screenTimeMinutes = Math.floor(screenTimeMinutes * 0.8);
    notificationCount = Math.floor(notificationCount * 0.9);
    calendarEvents += 2;
    calendarStress += 15;
  } else if (timeOfDay === 'evening') {
    hrv -= 8;
    heartRate += 6;
    stress += 15;
    steps = steps;
    screenTimeMinutes = Math.floor(screenTimeMinutes * 1.2);
    notificationCount = Math.floor(notificationCount * 1.1);
    calendarEvents -= 1;
    calendarStress -= 10;
  }
  
  // Weekend adjustments (less stress, more sleep)
  if (isWeekend) {
    stress -= 15;
    calendarEvents -= 2;
    calendarStress -= 20;
    sleepHours += 0.8;
    sleepQuality += 10;
    hrv += 8;
    heartRate -= 5;
    screenTimeMinutes += 60; // More leisure screen time
    steps -= 2000; // Less walking on weekends
    activityLevel = 'Light';
  }
  
  // Stress week pattern (buildup to migraine)
  if (isStressWeek) {
    stress += 25;
    calendarEvents += 3;
    calendarStress += 30;
    sleepQuality -= 15;
    sleepHours -= 1.2;
    hrv -= 18;
    heartRate += 12;
    screenTimeMinutes += 120;
    notificationCount += 40;
    activityLevel = 'Sedentary';
  }
  
  // Weather adjustments
  const pressure = 1013 + weatherCycle;
  const temperature = 18 + Math.sin(dayOfWeek * 0.5) * 5;
  const humidity = 60 + weatherCycle;
  const uvIndex = Math.max(0, Math.min(10, 3 + Math.cos(dayOfWeek) * 3));
  
  // Low pressure increases migraine risk
  if (pressure < 1010) {
    stress += 10;
    hrv -= 5;
  }
  
  // Calculate migraine risk (BOOSTED FOR DEMO - more dramatic)
  let migraineRisk = 0;
  if (hrv < 45) migraineRisk += 35; // Was 30
  else if (hrv < 55) migraineRisk += 20; // Was 15
  
  if (stress > 70) migraineRisk += 30; // Was 25
  else if (stress > 50) migraineRisk += 18; // Was 12
  
  if (sleepQuality < 60) migraineRisk += 25; // Was 20
  else if (sleepQuality < 70) migraineRisk += 15; // Was 10
  
  if (pressure < 1008) migraineRisk += 18; // Was 15
  else if (pressure < 1010) migraineRisk += 12; // Was 8
  
  if (screenTimeMinutes > 350) migraineRisk += 15; // Was 10
  
  migraineRisk = Math.min(100, migraineRisk);
  
  // Migraine occurs when risk > 70 and multiple factors align
  const hasMigraine = migraineRisk > 70 && hrv < 45 && (stress > 65 || sleepQuality < 65 || pressure < 1009);
  
  // Add some randomness (±5%) for realism
  hrv = Math.round(hrv + (Math.random() - 0.5) * 10);
  heartRate = Math.round(heartRate + (Math.random() - 0.5) * 6);
  stress = Math.max(0, Math.min(100, Math.round(stress + (Math.random() - 0.5) * 8)));
  sleepQuality = Math.max(0, Math.min(100, Math.round(sleepQuality + (Math.random() - 0.5) * 10)));
  
  return {
    id,
    timestamp,
    hrv: Math.max(30, Math.min(100, hrv)),
    heartRate: Math.max(55, Math.min(110, heartRate)),
    stress: Math.max(0, Math.min(100, stress)),
    sleepQuality: Math.max(40, Math.min(100, sleepQuality)),
    sleepHours: Math.max(4, Math.min(10, sleepHours)),
    steps: Math.max(2000, Math.min(20000, steps)),
    screenTimeMinutes: Math.max(60, Math.min(500, screenTimeMinutes)),
    notificationCount: Math.max(20, Math.min(150, notificationCount)),
    activityLevel,
    temperature: Math.round(temperature * 10) / 10,
    humidity: Math.max(40, Math.min(80, Math.round(humidity))),
    pressure: Math.round(pressure),
    uvIndex: Math.round(uvIndex * 10) / 10,
    calendarEvents: Math.max(0, Math.min(12, calendarEvents)),
    calendarStress: Math.max(0, Math.min(100, calendarStress)),
    migraineRisk: Math.round(migraineRisk),
    hasMigraine,
  };
}

// Generate the dataset
export const HEALTH_DATASET: HealthDataPoint[] = generateRealisticDataset();

// Log dataset summary
console.log(`📊 Health Dataset Generated:
- Total entries: ${HEALTH_DATASET.length}
- Date range: ${HEALTH_DATASET[0].timestamp.toLocaleDateString()} - ${HEALTH_DATASET[HEALTH_DATASET.length - 1].timestamp.toLocaleDateString()}
- Migraines in dataset: ${HEALTH_DATASET.filter(d => d.hasMigraine).length}
- Average HRV: ${Math.round(HEALTH_DATASET.reduce((sum, d) => sum + d.hrv, 0) / HEALTH_DATASET.length)}ms
- Average Risk: ${Math.round(HEALTH_DATASET.reduce((sum, d) => sum + d.migraineRisk, 0) / HEALTH_DATASET.length)}%
`);

// Helper function to get data point by index
export function getDataPoint(index: number): HealthDataPoint {
  return HEALTH_DATASET[index % HEALTH_DATASET.length];
}

// Helper function to get current data point based on time
export function getCurrentDataPoint(): HealthDataPoint {
  const now = new Date();
  const minuteOfDay = now.getHours() * 60 + now.getMinutes();
  const dataPointsPerDay = 3; // Morning, Afternoon, Evening
  const totalDataPoints = HEALTH_DATASET.length;
  
  // Cycle through dataset based on current time
  const index = Math.floor((minuteOfDay / (24 * 60)) * dataPointsPerDay) % totalDataPoints;
  return HEALTH_DATASET[index];
}

// Helper to simulate progression through day
let currentIndex = 0;
export function getNextDataPoint(): HealthDataPoint {
  const dataPoint = HEALTH_DATASET[currentIndex % HEALTH_DATASET.length];
  currentIndex++;
  return dataPoint;
}

export function resetDataIndex() {
  currentIndex = 0;
}
