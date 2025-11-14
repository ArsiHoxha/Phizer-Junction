/**
 * Location & Weather Data Collector
 * Fetches GPS location and weather data (temp, humidity, pressure, UV index)
 */

import * as Location from 'expo-location';

export interface LocationWeatherData {
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  weather: {
    temperature: number; // Celsius
    humidity: number; // percentage
    pressure: number; // hPa
    uvIndex: number; // 0-11+
    condition: string;
  };
}

class LocationWeatherCollector {
  private lastLocation: Location.LocationObject | null = null;
  private locationPermissionGranted: boolean = false;

  /**
   * Request location permissions
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.locationPermissionGranted = status === 'granted';
      return this.locationPermissionGranted;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Get current location
   */
  private async getCurrentLocation(): Promise<Location.LocationObject | null> {
    if (!this.locationPermissionGranted) {
      await this.requestPermissions();
    }

    if (!this.locationPermissionGranted) {
      console.log('Location permission not granted, using simulated data');
      return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      this.lastLocation = location;
      return location;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  /**
   * Fetch weather data from OpenWeatherMap API
   */
  private async fetchWeatherData(latitude: number, longitude: number) {
    try {
      const OPENWEATHER_API_KEY = 'f482b7674bcdaab45f8730c925ef7eeb';
      
      // Fetch current weather data
      const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      
      // Fetch UV Index data
      const uvUrl = `https://api.openweathermap.org/data/2.5/uvi?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}`;
      
      const [weatherResponse, uvResponse] = await Promise.all([
        fetch(currentWeatherUrl),
        fetch(uvUrl)
      ]);
      
      const weatherData = await weatherResponse.json();
      const uvData = await uvResponse.json();
      
      if (weatherData.main && weatherData.weather) {
        return {
          temperature: weatherData.main.temp || 20,
          humidity: weatherData.main.humidity || 50,
          pressure: weatherData.main.pressure || 1013,
          uvIndex: uvData.value || 0,
          condition: weatherData.weather[0]?.main || 'Clear',
        };
      }
      
      return this.getSimulatedWeather();
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return this.getSimulatedWeather();
    }
  }

  /**
   * Determine weather condition from temperature and humidity
   */
  private getWeatherCondition(temp: number, humidity: number): string {
    if (temp > 30 && humidity > 70) return 'Hot & Humid';
    if (temp > 30) return 'Hot';
    if (temp < 5) return 'Cold';
    if (humidity > 80) return 'Humid';
    if (humidity < 30) return 'Dry';
    return 'Moderate';
  }

  /**
   * Generate simulated weather data (for when API fails or no location)
   */
  private getSimulatedWeather() {
    const hour = new Date().getHours();
    
    // Simulate daily temperature variation
    let baseTemp = 20;
    if (hour >= 12 && hour <= 16) {
      baseTemp = 26; // Afternoon peak
    } else if (hour >= 0 && hour <= 6) {
      baseTemp = 15; // Night low
    }
    
    // Simulate weather changes that could trigger migraines
    const isLowPressure = Math.random() < 0.2; // 20% chance of low pressure
    const isHighUV = hour >= 11 && hour <= 15 && Math.random() < 0.4; // 40% chance of high UV midday
    
    return {
      temperature: baseTemp + (Math.random() - 0.5) * 4,
      humidity: 50 + (Math.random() - 0.5) * 30,
      pressure: isLowPressure ? 990 + Math.random() * 15 : 1005 + Math.random() * 15,
      uvIndex: isHighUV ? 7 + Math.random() * 4 : 2 + Math.random() * 4,
      condition: this.getWeatherCondition(
        baseTemp,
        50 + (Math.random() - 0.5) * 30
      ),
    };
  }

  /**
   * Get city name from coordinates (reverse geocoding)
   */
  private async getCityName(latitude: number, longitude: number): Promise<string | undefined> {
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (geocode && geocode.length > 0) {
        return geocode[0].city || geocode[0].region || 'Unknown';
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
    return undefined;
  }

  /**
   * Collect location and weather data
   */
  public async collectData(): Promise<LocationWeatherData> {
    let latitude = 40.7128; // Default to NYC
    let longitude = -74.0060;
    let city: string | undefined = 'New York';
    
    // Try to get real location
    const location = await this.getCurrentLocation();
    if (location) {
      latitude = location.coords.latitude;
      longitude = location.coords.longitude;
      city = await this.getCityName(latitude, longitude);
    }
    
    // Fetch weather data
    const weather = await this.fetchWeatherData(latitude, longitude);
    
    return {
      timestamp: new Date(),
      location: {
        latitude,
        longitude,
        city,
      },
      weather,
    };
  }

  /**
   * Check if weather changes are significant (could trigger migraines)
   */
  public async detectWeatherTriggers(
    previousData: LocationWeatherData | null
  ): Promise<string[]> {
    if (!previousData) return [];
    
    const current = await this.collectData();
    const triggers: string[] = [];
    
    // Significant pressure drop (>5 hPa in 1 hour)
    const pressureChange = previousData.weather.pressure - current.weather.pressure;
    if (pressureChange > 5) {
      triggers.push('Rapid pressure drop detected');
    }
    
    // High UV index
    if (current.weather.uvIndex > 7) {
      triggers.push('High UV index');
    }
    
    // Extreme humidity
    if (current.weather.humidity > 85) {
      triggers.push('High humidity');
    }
    
    // Extreme temperature
    if (current.weather.temperature > 32 || current.weather.temperature < 5) {
      triggers.push('Extreme temperature');
    }
    
    return triggers;
  }
}

// Singleton instance
let collectorInstance: LocationWeatherCollector | null = null;

export const getLocationWeatherCollector = (): LocationWeatherCollector => {
  if (!collectorInstance) {
    collectorInstance = new LocationWeatherCollector();
  }
  return collectorInstance;
};
