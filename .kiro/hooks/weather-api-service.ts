/**
 * NexaFlow Weather API Service
 * 
 * This service provides comprehensive weather data fetching
 * with real-time accuracy and error handling.
 * 
 * Created by Kiro AI for NexaFlow weather features.
 */

interface WeatherResponse {
  coord: { lon: number; lat: number };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  name: string;
}

interface ForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      humidity: number;
    };
    weather: Array<{
      main: string;
      description: string;
    }>;
    dt_txt: string;
  }>;
}

interface AirPollutionResponse {
  list: Array<{
    main: {
      aqi: number;
    };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
  }>;
}

export class WeatherAPIService {
  private static instance: WeatherAPIService;
  private readonly API_KEY = "f68e14d9f5d8fffea3bd365b3a9f8e4d";
  private readonly BASE_URL = "https://api.openweathermap.org/data/2.5";

  static getInstance(): WeatherAPIService {
    if (!WeatherAPIService.instance) {
      WeatherAPIService.instance = new WeatherAPIService();
    }
    return WeatherAPIService.instance;
  }

  /**
   * Get comprehensive weather data for coordinates
   */
  async getWeatherData(lat: number, lon: number): Promise<{
    current: WeatherResponse;
    uv: any;
    airPollution: AirPollutionResponse;
    forecast: ForecastResponse;
  }> {
    try {
      console.log(`🌤️ Fetching comprehensive weather data for ${lat}, ${lon}`);
      
      const [currentWeather, uvData, airPollution, forecast] = await Promise.all([
        this.getCurrentWeather(lat, lon),
        this.getUVIndex(lat, lon),
        this.getAirPollution(lat, lon),
        this.getForecast(lat, lon)
      ]);

      console.log('✅ All weather data fetched successfully');
      
      return {
        current: currentWeather,
        uv: uvData,
        airPollution,
        forecast
      };
    } catch (error) {
      console.error('❌ Failed to fetch comprehensive weather data:', error);
      throw error;
    }
  }

  /**
   * Get current weather
   */
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherResponse> {
    const url = `${this.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🌡️ Current weather data:', data);
      return data;
    } catch (error) {
      console.error('Current weather fetch failed:', error);
      throw new Error('Failed to fetch current weather data');
    }
  }

  /**
   * Get UV Index
   */
  async getUVIndex(lat: number, lon: number): Promise<any> {
    const url = `${this.BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${this.API_KEY}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`UV API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('☀️ UV index data:', data);
      return data;
    } catch (error) {
      console.error('UV index fetch failed:', error);
      throw new Error('Failed to fetch UV index data');
    }
  }

  /**
   * Get Air Pollution data
   */
  async getAirPollution(lat: number, lon: number): Promise<AirPollutionResponse> {
    const url = `${this.BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${this.API_KEY}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Air pollution API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🌬️ Air pollution data:', data);
      return data;
    } catch (error) {
      console.error('Air pollution fetch failed:', error);
      throw new Error('Failed to fetch air pollution data');
    }
  }

  /**
   * Get 5-day forecast
   */
  async getForecast(lat: number, lon: number): Promise<ForecastResponse> {
    const url = `${this.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📅 Forecast data:', data);
      return data;
    } catch (error) {
      console.error('Forecast fetch failed:', error);
      throw new Error('Failed to fetch forecast data');
    }
  }

  /**
   * Search city coordinates with better error handling
   */
  async searchCity(cityName: string): Promise<{
    name: string;
    country: string;
    lat: number;
    lon: number;
    state?: string;
  }> {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=5&appid=${this.API_KEY}`;
    
    try {
      console.log(`🔍 Searching for city: ${cityName}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🗺️ Geocoding results:', data);
      
      if (data.length === 0) {
        throw new Error(`City "${cityName}" not found. Please check the spelling.`);
      }
      
      // Return the first (most relevant) result
      const result = data[0];
      return {
        name: result.name,
        country: result.country,
        lat: result.lat,
        lon: result.lon,
        state: result.state
      };
    } catch (error) {
      console.error('City search failed:', error);
      throw error;
    }
  }

  /**
   * Get weather alerts (if available)
   */
  async getWeatherAlerts(lat: number, lon: number): Promise<any[]> {
    // Note: Weather alerts require a different API endpoint or service
    // For now, we'll return mock alerts based on current conditions
    try {
      const currentWeather = await this.getCurrentWeather(lat, lon);
      const alerts = [];
      
      // Generate alerts based on conditions
      if (currentWeather.main.temp > 35) {
        alerts.push({
          event: 'Heat Warning',
          description: 'Extreme heat conditions. Stay hydrated and avoid prolonged outdoor exposure.',
          severity: 'high'
        });
      }
      
      if (currentWeather.weather[0].main.toLowerCase().includes('storm')) {
        alerts.push({
          event: 'Storm Warning',
          description: 'Severe weather conditions expected. Stay indoors and avoid travel.',
          severity: 'high'
        });
      }
      
      if (currentWeather.main.humidity > 80 && currentWeather.main.temp > 25) {
        alerts.push({
          event: 'High Humidity',
          description: 'Very humid conditions. Take breaks if exercising outdoors.',
          severity: 'medium'
        });
      }
      
      return alerts;
    } catch (error) {
      console.error('Weather alerts fetch failed:', error);
      return [];
    }
  }

  /**
   * Validate API key
   */
  async validateAPIKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/weather?q=London&appid=${this.API_KEY}`);
      return response.ok;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  /**
   * Get weather condition emoji
   */
  getWeatherEmoji(weatherMain: string, isDay: boolean = true): string {
    const weatherEmojis: Record<string, string> = {
      'Clear': isDay ? '☀️' : '🌙',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️'
    };
    
    return weatherEmojis[weatherMain] || '🌤️';
  }

  /**
   * Format temperature
   */
  formatTemperature(temp: number, unit: 'C' | 'F' = 'C'): string {
    if (unit === 'F') {
      temp = (temp * 9/5) + 32;
    }
    return `${Math.round(temp)}°${unit}`;
  }

  /**
   * Get air quality description
   */
  getAirQualityDescription(aqi: number): string {
    const descriptions = {
      1: 'Good',
      2: 'Fair', 
      3: 'Moderate',
      4: 'Poor',
      5: 'Very Poor'
    };
    return descriptions[aqi as keyof typeof descriptions] || 'Unknown';
  }
}

export default WeatherAPIService;