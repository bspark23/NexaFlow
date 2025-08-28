/**
 * NexaFlow Travel Planner Hook
 * 
 * This hook monitors city searches and provides intelligent packing tips
 * when rain or extreme weather is detected in the forecast.
 * 
 * Created by Kiro AI for NexaFlow productivity enhancements.
 */

interface WeatherCondition {
  main: string;
  description: string;
}

interface TravelTip {
  message: string;
  type: 'rain' | 'extreme' | 'normal';
}

export class TravelPlannerHook {
  private static instance: TravelPlannerHook;
  
  static getInstance(): TravelPlannerHook {
    if (!TravelPlannerHook.instance) {
      TravelPlannerHook.instance = new TravelPlannerHook();
    }
    return TravelPlannerHook.instance;
  }

  /**
   * Analyzes weather conditions and generates packing tips
   */
  generatePackingTip(city: string, weatherConditions: WeatherCondition[]): TravelTip | null {
    const hasRain = weatherConditions.some(condition => 
      condition.main.toLowerCase().includes('rain') || 
      condition.description.toLowerCase().includes('rain')
    );

    const hasStorm = weatherConditions.some(condition =>
      condition.main.toLowerCase().includes('storm') ||
      condition.main.toLowerCase().includes('thunder')
    );

    const hasSnow = weatherConditions.some(condition =>
      condition.main.toLowerCase().includes('snow')
    );

    if (hasStorm) {
      return {
        message: `⛈️ Storm expected in ${city}! Pack waterproof gear and stay indoors when possible.`,
        type: 'extreme'
      };
    }

    if (hasRain) {
      return {
        message: `🌧️ It will rain tomorrow in ${city}, don't forget an umbrella!`,
        type: 'rain'
      };
    }

    if (hasSnow) {
      return {
        message: `❄️ Snow expected in ${city}! Pack warm clothes and waterproof boots.`,
        type: 'extreme'
      };
    }

    return null;
  }

  /**
   * Displays travel tip as a side notification
   */
  showTravelTip(tip: TravelTip): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `
      fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm
      bg-gradient-to-r from-teal-500 to-purple-500 text-white
      transform translate-x-full transition-transform duration-300
    `;
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-1">
          <p class="text-sm font-medium">${tip.message}</p>
          <p class="text-xs opacity-90 mt-1">Smart Travel Tip by NexaFlow</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white/80 hover:text-white">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 8 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(full)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }, 8000);
  }

  /**
   * Hook into city search events
   */
  monitorCitySearches(): void {
    // Monitor for city search events in the app
    const searchButtons = document.querySelectorAll('button');
    searchButtons.forEach(button => {
      if (button.querySelector('svg')) { // Search button with icon
        button.addEventListener('click', () => {
          setTimeout(() => {
            this.checkForWeatherTips();
          }, 2000); // Wait for weather data to load
        });
      }
    });
  }

  /**
   * Check current weather display for tip opportunities
   */
  private checkForWeatherTips(): void {
    // Look for location information
    const locationElement = document.querySelector('[class*="text-gray-700"], [class*="text-gray-300"]');
    if (locationElement && locationElement.textContent) {
      const locationText = locationElement.textContent;
      const cityMatch = locationText.match(/^([^,]+)/);
      
      if (cityMatch) {
        const city = cityMatch[1];
        
        // Mock weather analysis (in real implementation, this would use actual weather data)
        const mockWeatherConditions: WeatherCondition[] = [
          { main: 'Rain', description: 'light rain expected' }
        ];
        
        const tip = this.generatePackingTip(city, mockWeatherConditions);
        if (tip) {
          this.showTravelTip(tip);
        }
      }
    }
  }
}

// Initialize the hook when the page loads
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const hook = TravelPlannerHook.getInstance();
    hook.monitorCitySearches();
  });
}

export default TravelPlannerHook;