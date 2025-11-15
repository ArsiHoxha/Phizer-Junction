import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { getAllHealthMetrics } from '../services/healthKit';
import { metricsAPI } from '../services/api';

/**
 * Hook to fetch REAL metrics from HealthKit + Location
 * and submit to backend with real weather API integration
 */
export const useRealMetrics = (autoSubmit: boolean = false) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMetrics, setLastMetrics] = useState<any>(null);

  /**
   * Fetch all real metrics from device
   */
  const fetchRealMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission required for weather data');
      }

      // 2. Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 3. Get HealthKit metrics
      const healthMetrics = await getAllHealthMetrics();

      // 4. Combine all REAL data
      const realMetrics = {
        ...healthMetrics,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setLastMetrics(realMetrics);

      // 5. Submit to backend (which will fetch real weather)
      if (autoSubmit) {
        const response = await metricsAPI.submitRealMetrics(realMetrics);
        console.log('✅ Real metrics submitted:', response);
        return response;
      }

      return realMetrics;
    } catch (err: any) {
      console.error('Error fetching real metrics:', err);
      setError(err.message || 'Failed to fetch real metrics');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submit metrics manually
   */
  const submitMetrics = async (metrics?: any) => {
    try {
      setLoading(true);
      const metricsToSubmit = metrics || lastMetrics;
      
      if (!metricsToSubmit) {
        throw new Error('No metrics to submit. Call fetchRealMetrics first.');
      }

      const response = await metricsAPI.submitRealMetrics(metricsToSubmit);
      console.log('✅ Metrics submitted successfully');
      return response;
    } catch (err: any) {
      console.error('Error submitting metrics:', err);
      setError(err.message || 'Failed to submit metrics');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    lastMetrics,
    fetchRealMetrics,
    submitMetrics,
  };
};
