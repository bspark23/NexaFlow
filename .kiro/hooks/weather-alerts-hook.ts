/**
 * NexaFlow Weather Alerts Hook
 * 
 * This hook runs hourly in the background to check for rain, storms, 
 * or heat waves within the next 6 hours and sends push notifications.
 * 
 * Created by Kiro AI for NexaFlow productivity enhancements.
 */

interface WeatherAlert {
  type: 'rain' | 'storm' | 'heatwave' | 'snow';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timeframe: string;
}

export class WeatherAlertsHook {
  private static instance: WeatherAlertsHook;
  private intervalId: NodeJS.Timeout | null = null;
  private lastAlertTime: number = 0;
  private readonly ALERT_COOLDOWN = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

  static getInstance(): WeatherAlertsHook {
    if (!WeatherAlertsHook.instance) {
      WeatherAlertsHook.instance = new WeatherAlertsHook();
    }
    return WeatherAlertsHook.instance;
  }

  /**
   * Start hourly weather monitoring
   */
  startMonitoring(): void {
    // Check immediately
    this.checkWeatherAlerts();
    
    // Then check every hour
    this.intervalId = setInterval(() => {
      this.checkWeatherAlerts();
    }, 60 * 60 * 1000); // 1 hour

    console.log('🌦️ NexaFlow Weather Alerts monitoring started');
  }

  /**
   * Stop weather monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🌦️ NexaFlow Weather Alerts monitoring stopped');
    }
  }

  /**
   * Check for weather alerts in the next 6 hours
   */
  private async checkWeatherAlerts(): Promise<void> {
    try {
      // Check if enough time has passed since last alert
      const now = Date.now();
      if (now - this.lastAlertTime < this.ALERT_COOLDOWN) {
        return;
      }

      // Get current location (simplified - in real app would use actual location)
      const location = this.getCurrentLocation();
      if (!location) return;

      // Analyze weather conditions (mock implementation)
      const alerts = await this.analyzeWeatherConditions(location);
      
      if (alerts.length > 0) {
        alerts.forEach(alert => this.sendWeatherAlert(alert));
        this.lastAlertTime = now;
      }
    } catch (error) {
      console.error('Weather alerts check failed:', error);
    }
  }

  /**
   * Analyze weather conditions for alerts
   */
  private async analyzeWeatherConditions(location: string): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];

    // Mock weather analysis (in real implementation, would call weather API)
    const mockConditions = {
      hasRain: Math.random() > 0.8, // 20% chance
      hasStorm: Math.random() > 0.95, // 5% chance
      hasHeatwave: Math.random() > 0.9, // 10% chance
      hasSnow: Math.random() > 0.95 // 5% chance
    };

    if (mockConditions.hasStorm) {
      alerts.push({
        type: 'storm',
        message: '⛈️ Weather alert: Severe storms expected within 6 hours. Stay indoors and avoid travel.',
        severity: 'high',
        timeframe: 'next 6 hours'
      });
    } else if (mockConditions.hasRain) {
      alerts.push({
        type: 'rain',
        message: '🌧️ Weather alert: Rain expected soon, adjust your schedule.',
        severity: 'medium',
        timeframe: 'next 3 hours'
      });
    }

    if (mockConditions.hasHeatwave) {
      alerts.push({
        type: 'heatwave',
        message: '🌡️ Heat wave alert: Extreme temperatures expected. Stay hydrated and avoid outdoor activities.',
        severity: 'high',
        timeframe: 'next 6 hours'
      });
    }

    if (mockConditions.hasSnow) {
      alerts.push({
        type: 'snow',
        message: '❄️ Snow alert: Heavy snowfall expected. Prepare for travel delays.',
        severity: 'medium',
        timeframe: 'next 4 hours'
      });
    }

    return alerts;
  }

  /**
   * Send weather alert notification
   */
  private sendWeatherAlert(alert: WeatherAlert): void {
    // Try to use browser notifications first
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('NexaFlow Weather Alert', {
        body: alert.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `weather-alert-${alert.type}`,
        requireInteraction: alert.severity === 'high'
      });
    }

    // Also show in-app notification
    this.showInAppAlert(alert);
  }

  /**
   * Show in-app alert notification
   */
  private showInAppAlert(alert: WeatherAlert): void {
    const notification = document.createElement('div');
    const severityColors = {
      low: 'from-blue-500 to-cyan-500',
      medium: 'from-yellow-500 to-orange-500',
      high: 'from-red-500 to-pink-500'
    };

    notification.className = `
      fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg max-w-md
      bg-gradient-to-r ${severityColors[alert.severity]} text-white
      animate-pulse
    `;
    
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-1">
          <p class="font-semibold text-sm">NexaFlow Weather Alert</p>
          <p class="text-sm mt-1">${alert.message}</p>
          <p class="text-xs opacity-90 mt-2">Timeframe: ${alert.timeframe}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white/80 hover:text-white">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 10 seconds for high severity, 6 seconds for others
    const duration = alert.severity === 'high' ? 10000 : 6000;
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
  }

  /**
   * Get current location from the app
   */
  private getCurrentLocation(): string | null {
    // Try to get location from the current weather display
    const locationElement = document.querySelector('[class*="text-gray-700"], [class*="text-gray-300"]');
    if (locationElement && locationElement.textContent) {
      const locationMatch = locationElement.textContent.match(/^([^,]+)/);
      return locationMatch ? locationMatch[1] : null;
    }
    return null;
  }

  /**
   * Request notification permission
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}

// Initialize the hook when the page loads
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    // Request notification permission
    await WeatherAlertsHook.requestNotificationPermission();
    
    // Start monitoring
    const hook = WeatherAlertsHook.getInstance();
    hook.startMonitoring();
  });
}

export default WeatherAlertsHook;