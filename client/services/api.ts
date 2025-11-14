import axios from 'axios';
import { API_URL } from '../config/config';

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
  
  saveDataSource: async (data: { mode: string; wearableType?: string }) => {
    const response = await api.post('/onboarding/data-source', data);
    return response.data;
  },
  
  saveTriggers: async (data: { frequency: string; triggers: string[] }) => {
    const response = await api.post('/onboarding/triggers', data);
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

export default api;
