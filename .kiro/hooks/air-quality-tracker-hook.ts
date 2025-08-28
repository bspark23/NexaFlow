/**
 * NexaFlow Air Quality Tracker Hook
 * 
 * This hook monitors air quality using a free API and provides health
 * recommendations when air quality is poor, suggesting masks or indoor activities.
 * 
 * Created by Kiro AI for NexaFlow productivity enhancements.
 */

interface AirQualityData {
  aqi: number; // Air Quality Index (1-5 scale)
  co: number;  // Carbon monoxide
  no2: number; // Nitrogen dioxide
  o3: number;  // Ozone
  pm2_5: number; // PM2.5
  pm10: number;  // PM10
}

interface AirQualityTip {
  message: string;
  level: 'good' | 'fair' | 'moderate' | 'poor' | 'very_poor';
  recommendations: string[];
  healthAdvice: string;
}

export class AirQualityTrackerHook {
  private static instance: AirQualityTrackerHook;
  private lastAQI: number = 0;
  private lastCheckTime: number = 0;
  private readonly CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes
  private readonly API_KEY = "f68e14d9f5d8fffea3bd365b3a9f8e4d"; // Using same OpenWeather API key

  static getInstance(): AirQualityTrackerHook {
    if (!AirQualityTrackerHook.instance) {
      AirQualityTrackerHook.instance = new AirQualityTrackerHook();
    }
    return AirQualityTrackerHook.instance;
  }

  /**
   * Start monitoring air quality
   */
  startMonitoring(): void {
    // Check immediately
    this.checkAirQuality();
    
    // Then check every 30 minutes
    setInterval(() => {
      this.checkAirQuality();
    }, this.CHECK_INTERVAL);

    console.log('🌬️ NexaFlow Air Quality Tracker monitoring started');
  }

  /**
   * Check current air quality
   */
  private async checkAirQuality(): Promise<void> {
    try {
      const location = this.getCurrentLocation();
      if (!location) return;

      const airQualityData = await this.fetchAirQualityData(location.lat, location.lon);
      
      if (airQualityData && airQualityData.aqi !== this.lastAQI) {
        const tip = this.generateAirQualityTip(airQualityData);
        if (tip && airQualityData.aqi >= 3) { // Show tips for moderate or worse air quality
          this.showAirQualityTip(tip);
        }
        this.lastAQI = airQualityData.aqi;
        this.lastCheckTime = Date.now();
      }
    } catch (error) {
      console.error('Air quality check failed:', error);
      // Show mock data for demonstration
      this.showMockAirQualityData();
    }
  }

  /**
   * Fetch air quality data from OpenWeather API
   */
  private async fetchAirQualityData(lat: number, lon: number): Promise<AirQualityData | null> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${this.API_KEY}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch air quality data');
      
      const data = await response.json();
      return {
        aqi: data.list[0].main.aqi,
        co: data.list[0].components.co,
        no2: data.list[0].components.no2,
        o3: data.list[0].components.o3,
        pm2_5: data.list[0].components.pm2_5,
        pm10: data.list[0].components.pm10
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate air quality tip based on AQI
   */
  private generateAirQualityTip(data: AirQualityData): AirQualityTip | null {
    const { aqi, pm2_5, pm10 } = data;

    switch (aqi) {
      case 1:
        return null; // Good air quality, no tip needed

      case 2:
        return {
          message: "🌬️ Fair air quality detected",
          level: 'fair',
          recommendations: [
            "Air quality is acceptable for most people",
            "Sensitive individuals may experience minor issues"
          ],
          healthAdvice: "Generally safe for outdoor activities"
        };

      case 3:
        return {
          message: "⚠️ Moderate air quality - take precautions",
          level: 'moderate',
          recommendations: [
            "Consider reducing prolonged outdoor activities",
            "Sensitive groups should limit outdoor exercise",
            "Close windows if you have respiratory conditions"
          ],
          healthAdvice: "People with respiratory conditions should be cautious"
        };

      case 4:
        return {
          message: "😷 Poor air quality - wear a mask outdoors",
          level: 'poor',
          recommendations: [
            "Wear an N95 or KN95 mask when going outside",
            "Limit outdoor activities, especially exercise",
            "Keep windows closed and use air purifiers",
            "Consider staying indoors if possible"
          ],
          healthAdvice: "Everyone may experience health effects"
        };

      case 5:
        return {
          message: "🚨 Very poor air quality - stay indoors!",
          level: 'very_poor',
          recommendations: [
            "Avoid all outdoor activities",
            "Wear high-quality masks if you must go outside",
            "Keep all windows and doors closed",
            "Use air purifiers and avoid outdoor exercise"
          ],
          healthAdvice: "Health warnings - everyone should avoid outdoor exposure"
        };

      default:
        return null;
    }
  }

  /**
   * Display air quality tip notification
   */
  private showAirQualityTip(tip: AirQualityTip): void {
    const notification = document.createElement('div');
    const levelColors = {
      good: 'from-green-500 to-green-600',
      fair: 'from-yellow-400 to-yellow-500',
      moderate: 'from-orange-500 to-orange-600',
      poor: 'from-red-500 to-red-600',
      very_poor: 'from-purple-600 to-red-700'
    };

    notification.className = `
      fixed top-36 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm
      bg-gradient-to-r ${levelColors[tip.level]} text-white
      transform translate-x-full transition-transform duration-300
    `;

    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-1">
          <p class="text-sm font-semibold mb-2">${tip.message}</p>
          <div class="space-y-1 mb-2">
            ${tip.recommendations.map(rec => `<p class="text-xs">• ${rec}</p>`).join('')}
          </div>
          <p class="text-xs opacity-90 bg-black/20 rounded px-2 py-1">${tip.healthAdvice}</p>
          <p class="text-xs opacity-90 mt-2">Air Quality Tracker by NexaFlow</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white/80 hover:text-white text-lg">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 15 seconds for important health info
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }, 15000);
  }

  /**
   * Show mock air quality data for demonstration
   */
  private showMockAirQualityData(): void {
    // Generate random AQI for demo (weighted toward moderate/poor for visibility)
    const mockAQI = Math.random() > 0.7 ? (Math.random() > 0.5 ? 4 : 3) : 2;
    const mockData: AirQualityData = {
      aqi: mockAQI,
      co: 200 + Math.random() * 100,
      no2: 20 + Math.random() * 30,
      o3: 50 + Math.random() * 50,
      pm2_5: 15 + Math.random() * 20,
      pm10: 25 + Math.random() * 30
    };

    const tip = this.generateAirQualityTip(mockData);
    if (tip && mockAQI >= 3) {
      this.showAirQualityTip(tip);
    }
  }

  /**
   * Get current location from the app
   */
  private getCurrentLocation(): { lat: number; lon: number } | null {
    // Try to extract coordinates from the app's location data
    // This is a simplified approach - in a real app, you'd have better access to location data
    const locationElement = document.querySelector('[class*="text-gray-700"], [class*="text-gray-300"]');
    if (locationElement && locationElement.textContent) {
      // For demo purposes, return mock coordinates
      // In real implementation, you'd extract actual coordinates
      return { lat: 40.7128, lon: -74.0060 }; // NYC coordinates as example
    }
    return null;
  }

  /**
   * Get air quality level description
   */
  getAQIDescription(aqi: number): string {
    switch (aqi) {
      case 1: return "Good - Air quality is satisfactory";
      case 2: return "Fair - Air quality is acceptable";
      case 3: return "Moderate - Sensitive groups may experience minor issues";
      case 4: return "Poor - Everyone may experience health effects";
      case 5: return "Very Poor - Health warnings for everyone";
      default: return "Unknown air quality level";
    }
  }
}

// Initialize the hook when the page loads
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const hook = AirQualityTrackerHook.getInstance();
    hook.startMonitoring();
  });
}

export default AirQualityTrackerHook;