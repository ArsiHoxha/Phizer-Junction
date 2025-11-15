import axios from 'axios';
import { API_URL } from '../config/config';
import type { 
  MigraineLog, 
  QuickLogRequest, 
  DetailedLogRequest,
  MigraineAIAnalysis 
} from '../types/migraine';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Clerk token to requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// User API
export const userAPI = {
  createOrUpdate: async (data: { email: string; firstName?: string; lastName?: string }) => {
    const response = await api.post('/user', data);
    return response.data;
  },
  
  getProfile: async (clerkId: string) => {
    const response = await api.get(`/user/${clerkId}`);
    return response.data;
  },
};

// Onboarding API
export const onboardingAPI = {
  savePermissions: async (permissions: any) => {
    const response = await api.post('/onboarding/permissions', { permissions });
    return response.data;
  },
  
  saveProfile: async (profile: { gender?: string; age?: number }) => {
    const response = await api.post('/onboarding/profile', profile);
    return response.data;
  },

  saveMenstrualTracking: async (menstrualTracking: { enabled: boolean; cycleLength?: number; lastPeriodDate?: string }) => {
    const response = await api.post('/onboarding/menstrual-tracking', menstrualTracking);
    return response.data;
  },
  
  saveTriggers: async (triggers: string[]) => {
    const response = await api.post('/onboarding/triggers', { triggers });
    return response.data;
  },
  
  saveDataSource: async (data: { mode: string; wearableType?: string }) => {
    const response = await api.post('/onboarding/data-source', data);
    return response.data;
  },
  
  complete: async () => {
    const response = await api.post('/onboarding/complete');
    return response.data;
  },
};

// Metrics API
export const metricsAPI = {
  add: async (metrics: any) => {
    const response = await api.post('/metrics', metrics);
    return response.data;
  },
  
  get: async (clerkId: string, period: 'today' | 'week' | 'month' = 'week') => {
    const response = await api.get(`/metrics/${clerkId}`, { params: { period } });
    return response.data;
  },
  
  // 🔥 NEW: Submit REAL metrics from HealthKit + Weather API
  submitRealMetrics: async (data: {
    hrv: number;
    heartRate: number;
    stress: number;
    sleepQuality: number;
    sleepHours: number;
    steps: number;
    latitude: number;
    longitude: number;
  }) => {
    const response = await api.post('/metrics/real', data);
    return response.data;
  },
};

// Risk API
export const riskAPI = {
  calculate: async (clerkId: string) => {
    const response = await api.get(`/risk/${clerkId}`);
    return response.data;
  },
  
  getHistory: async (clerkId: string, days: number = 7) => {
    const response = await api.get(`/risk-history/${clerkId}`, { params: { days } });
    return response.data;
  },
};

// Migraine Log API (Passive & Phase-Aware)
export const migraineAPI = {
  /**
   * Quick Log - One tap, AI does everything
   * User just confirms "I have a migraine"
   * AI automatically:
   * - Captures all passive metrics
   * - Detects current phase
   * - Identifies prodrome symptoms from past 48h
   * - Logs active triggers
   * - Provides phase-specific recommendations
   */
  quickLogMigraine: async (data?: QuickLogRequest): Promise<{ success: boolean; log: MigraineLog }> => {
    const response = await api.post('/migraine/quick-log', data || {});
    return response.data;
  },
  
  /**
   * Detailed Log - For power users
   * Still mostly passive but allows confirming AI detections
   */
  logMigraine: async (data: DetailedLogRequest): Promise<{ success: boolean; log: MigraineLog }> => {
    const response = await api.post('/migraine/log', data);
    return response.data;
  },
  
  /**
   * Get migraine history with phase information
   */
  getMigraineLogs: async (clerkId: string, days: number = 30): Promise<MigraineLog[]> => {
    const response = await api.get(`/migraine/${clerkId}`, { params: { days } });
    return response.data;
  },
  
  /**
   * Get AI analysis for a specific migraine
   * Includes phase detection, early warning signals, and recommendations
   */
  getAIAnalysis: async (migraineId: string): Promise<MigraineAIAnalysis> => {
    const response = await api.get(`/migraine/${migraineId}/analysis`);
    return response.data;
  },
  
  /**
   * Update migraine outcome (when it resolves)
   * Automatically logs postdrome phase
   */
  updateOutcome: async (migraineId: string, data: { 
    resolved: boolean; 
    duration?: number; 
    medicationTaken?: string;
  }): Promise<{ success: boolean }> => {
    const response = await api.patch(`/migraine/${migraineId}/outcome`, data);
    return response.data;
  },
};

export default api;
