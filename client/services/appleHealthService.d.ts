// Type declarations for Apple Health Service
declare const AppleHealthService: {
  initHealth: () => Promise<boolean>;
  getLatestMetrics: () => Promise<{
    heartRate?: number;
    hrv?: number;
    steps?: number;
    sleepQuality?: number;
    activeEnergy?: number;
    workouts?: any[];
  }>;
};

export default AppleHealthService;
