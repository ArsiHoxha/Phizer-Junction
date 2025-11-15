const axios = require('axios');

// OpenWeatherMap API (free tier: 1000 calls/day)
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || ''; // Add your key to .env

/**
 * Get real weather data for a location
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object>} Weather data including pressure, temperature, humidity
 */
async function getCurrentWeather(latitude, longitude) {
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat: latitude,
        lon: longitude,
        appid: OPENWEATHER_API_KEY,
        units: 'metric' // Celsius
      }
    });

    const data = response.data;

    return {
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      pressure: data.main.pressure, // hPa - Critical for migraine prediction!
      humidity: data.main.humidity,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      windSpeed: data.wind.speed,
      cloudiness: data.clouds.all,
      visibility: data.visibility,
      uvIndex: 0, // Need separate API call for UV
      city: data.name,
      timestamp: new Date(data.dt * 1000),
    };
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    throw new Error('Failed to fetch weather data');
  }
}

/**
 * Get weather forecast (for predictive warnings)
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Array>} 5-day forecast
 */
async function getWeatherForecast(latitude, longitude) {
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat: latitude,
        lon: longitude,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        cnt: 40 // 5 days, 3-hour intervals
      }
    });

    return response.data.list.map(item => ({
      timestamp: new Date(item.dt * 1000),
      temperature: item.main.temp,
      pressure: item.main.pressure,
      humidity: item.main.humidity,
      condition: item.weather[0].main,
      description: item.weather[0].description,
    }));
  } catch (error) {
    console.error('Error fetching weather forecast:', error.message);
    throw new Error('Failed to fetch weather forecast');
  }
}

/**
 * Detect pressure drops (migraine trigger)
 * @param {Array} forecast 
 * @returns {Array} Warnings for significant pressure drops
 */
function detectPressureDrops(forecast) {
  const warnings = [];
  
  for (let i = 1; i < forecast.length; i++) {
    const pressureDrop = forecast[i - 1].pressure - forecast[i].pressure;
    
    // Pressure drop of 5+ hPa in 3 hours = migraine risk
    if (pressureDrop >= 5) {
      warnings.push({
        timestamp: forecast[i].timestamp,
        pressureDrop: Math.round(pressureDrop),
        severity: pressureDrop >= 10 ? 'high' : 'medium',
        message: `Pressure dropping ${Math.round(pressureDrop)} hPa - migraine risk!`
      });
    }
  }
  
  return warnings;
}

module.exports = {
  getCurrentWeather,
  getWeatherForecast,
  detectPressureDrops,
};
