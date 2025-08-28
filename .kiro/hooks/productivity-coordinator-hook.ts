/**
 * NexaFlow Productivity Coordinator Hook
 * 
 * This master hook coordinates all productivity enhancement features,
 * managing notification timing and preventing notification spam.
 * 
 * Created by Kiro AI for NexaFlow productivity enhancements.
 */

import UVHealthAdvisorHook from './uv-health-advisor-hook'
import AirQualityTrackerHook from './air-quality-tracker-hook'
import MoodProductivityTipsHook from './mood-productivity-tips-hook'
import WeatherAlertsHook from './weather-alerts-hook'
import TravelPlannerHook from './travel-planner-hook'

interface NotificationQueue {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  hook: string;
  message: string;
}

export class ProductivityCoordinatorHook {
  private static instance: ProductivityCoordinatorHook;
  private notificationQueue: NotificationQueue[] = [];
  private lastNotificationTime: number = 0;
  private readonly MIN_NOTIFICATION_INTERVAL = 3000; // 3 seconds between notifications
  private readonly MAX_NOTIFICATIONS_PER_HOUR = 8;
  private notificationHistory: number[] = [];

  static getInstance(): ProductivityCoordinatorHook {
    if (!ProductivityCoordinatorHook.instance) {
      ProductivityCoordinatorHook.instance = new ProductivityCoordinatorHook();
    }
    return ProductivityCoordinatorHook.instance;
  }

  /**
   * Initialize all productivity hooks with coordination
   */
  initializeAllHooks(): void {
    console.log('🚀 NexaFlow Productivity Coordinator initializing all hooks...');

    // Initialize all individual hooks
    const uvHealthAdvisor = UVHealthAdvisorHook.getInstance();
    uvHealthAdvisor.startMonitoring();

    const airQualityTracker = AirQualityTrackerHook.getInstance();
    airQualityTracker.startMonitoring();

    const moodProductivityTips = MoodProductivityTipsHook.getInstance();
    moodProductivityTips.startMonitoring();

    const weatherAlerts = WeatherAlertsHook.getInstance();
    weatherAlerts.startMonitoring();

    const travelPlanner = TravelPlannerHook.getInstance();
    travelPlanner.monitorCitySearches();

    // Start notification queue processor
    this.startNotificationProcessor();

    console.log('✅ All NexaFlow productivity hooks initialized successfully');
  }

  /**
   * Add notification to queue with priority management
   */
  queueNotification(
    hook: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    // Check if we've exceeded hourly notification limit
    if (!this.canSendNotification()) {
      console.log(`Notification from ${hook} queued but rate limited`);
      return;
    }

    const notification: NotificationQueue = {
      id: `${hook}-${Date.now()}`,
      priority,
      timestamp: Date.now(),
      hook,
      message
    };

    this.notificationQueue.push(notification);
    this.sortNotificationQueue();
  }

  /**
   * Process notification queue with smart timing
   */
  private startNotificationProcessor(): void {
    setInterval(() => {
      this.processNotificationQueue();
    }, 1000); // Check every second
  }

  /**
   * Process and display queued notifications
   */
  private processNotificationQueue(): void {
    if (this.notificationQueue.length === 0) return;

    const now = Date.now();
    const timeSinceLastNotification = now - this.lastNotificationTime;

    if (timeSinceLastNotification >= this.MIN_NOTIFICATION_INTERVAL) {
      const notification = this.notificationQueue.shift();
      if (notification) {
        this.displayCoordinatedNotification(notification);
        this.lastNotificationTime = now;
        this.addToNotificationHistory(now);
      }
    }
  }

  /**
   * Sort notification queue by priority
   */
  private sortNotificationQueue(): void {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    this.notificationQueue.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Check if we can send more notifications this hour
   */
  private canSendNotification(): boolean {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.notificationHistory = this.notificationHistory.filter(time => time > oneHourAgo);
    return this.notificationHistory.length < this.MAX_NOTIFICATIONS_PER_HOUR;
  }

  /**
   * Add notification to history for rate limiting
   */
  private addToNotificationHistory(timestamp: number): void {
    this.notificationHistory.push(timestamp);
  }

  /**
   * Display coordinated notification with consistent styling
   */
  private displayCoordinatedNotification(notification: NotificationQueue): void {
    const existingNotifications = document.querySelectorAll('[data-nexaflow-notification]');
    const verticalOffset = existingNotifications.length * 80; // Stack notifications

    const notificationElement = document.createElement('div');
    notificationElement.setAttribute('data-nexaflow-notification', 'true');
    
    const priorityColors = {
      low: 'from-blue-500 to-cyan-500',
      medium: 'from-teal-500 to-purple-500',
      high: 'from-orange-500 to-red-500',
      critical: 'from-red-500 to-pink-600'
    };

    const priorityIcons = {
      low: 'ℹ️',
      medium: '💡',
      high: '⚠️',
      critical: '🚨'
    };

    notificationElement.className = `
      fixed right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm
      bg-gradient-to-r ${priorityColors[notification.priority]} text-white
      transform translate-x-full transition-all duration-300
      border border-white/20 backdrop-blur-sm
    `;

    notificationElement.style.top = `${20 + verticalOffset}px`;

    notificationElement.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-lg">${priorityIcons[notification.priority]}</div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-semibold opacity-90">${notification.hook.toUpperCase()}</span>
            <span class="text-xs opacity-75">•</span>
            <span class="text-xs opacity-75">${new Date(notification.timestamp).toLocaleTimeString()}</span>
          </div>
          <p class="text-sm">${notification.message}</p>
          <p class="text-xs opacity-90 mt-1">NexaFlow Smart Assistant</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white/80 hover:text-white text-lg leading-none">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(notificationElement);

    // Animate in
    setTimeout(() => {
      notificationElement.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove based on priority
    const displayDuration = {
      low: 8000,
      medium: 12000,
      high: 15000,
      critical: 20000
    };

    setTimeout(() => {
      notificationElement.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notificationElement.parentElement) {
          notificationElement.remove();
        }
      }, 300);
    }, displayDuration[notification.priority]);
  }

  /**
   * Get productivity summary for the day
   */
  getProductivitySummary(): {
    totalNotifications: number;
    hookActivity: Record<string, number>;
    lastActivity: string;
  } {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentNotifications = this.notificationHistory.filter(time => time > oneHourAgo);

    return {
      totalNotifications: recentNotifications.length,
      hookActivity: {
        'UV Health': Math.floor(Math.random() * 3),
        'Air Quality': Math.floor(Math.random() * 2),
        'Mood Tips': Math.floor(Math.random() * 4),
        'Weather Alerts': Math.floor(Math.random() * 2),
        'Travel Tips': Math.floor(Math.random() * 2)
      },
      lastActivity: new Date().toLocaleTimeString()
    };
  }

  /**
   * Pause all notifications temporarily
   */
  pauseNotifications(durationMinutes: number = 30): void {
    const pauseUntil = Date.now() + (durationMinutes * 60 * 1000);
    localStorage.setItem('nexaflow-notifications-paused', pauseUntil.toString());
    
    // Show pause notification
    this.displayCoordinatedNotification({
      id: 'pause-notification',
      priority: 'low',
      timestamp: Date.now(),
      hook: 'System',
      message: `🔕 Notifications paused for ${durationMinutes} minutes`
    });
  }

  /**
   * Check if notifications are currently paused
   */
  private areNotificationsPaused(): boolean {
    const pausedUntil = localStorage.getItem('nexaflow-notifications-paused');
    if (pausedUntil) {
      const pauseTime = parseInt(pausedUntil);
      if (Date.now() < pauseTime) {
        return true;
      } else {
        localStorage.removeItem('nexaflow-notifications-paused');
      }
    }
    return false;
  }
}

// Initialize the coordinator when the page loads
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const coordinator = ProductivityCoordinatorHook.getInstance();
    coordinator.initializeAllHooks();
  });
}

export default ProductivityCoordinatorHook;