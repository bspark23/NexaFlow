/**
 * Smart Travel Notifications System
 * Provides intelligent travel alerts and notifications
 */

interface TravelNotification {
    id: string;
    type: 'weather' | 'traffic' | 'safety' | 'arrival' | 'departure';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    title: string;
    message: string;
    actionable: boolean;
    actions?: Array<{
        label: string;
        action: () => void;
    }>;
    timestamp: Date;
    expiresAt?: Date;
    location?: string;
    route?: {
        from: string;
        to: string;
    };
}

interface NotificationSettings {
    enabled: boolean;
    weatherAlerts: boolean;
    trafficAlerts: boolean;
    safetyAlerts: boolean;
    arrivalNotifications: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    quietHours: {
        enabled: boolean;
        start: string; // HH:MM format
        end: string;   // HH:MM format
    };
}

class SmartTravelNotifications {
    private static instance: SmartTravelNotifications;
    private notifications: Map<string, TravelNotification> = new Map();
    private settings: NotificationSettings = {
        enabled: true,
        weatherAlerts: true,
        trafficAlerts: true,
        safetyAlerts: true,
        arrivalNotifications: true,
        soundEnabled: true,
        vibrationEnabled: true,
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '07:00'
        }
    };
    private monitoringInterval: NodeJS.Timeout | null = null;
    private isMonitoring = false;
    private apiKey = "f68e14d9f5d8fffea3bd365b3a9f8e4d";

    private constructor() {
        this.loadSettings();
        this.requestNotificationPermission();
    }

    static getInstance(): SmartTravelNotifications {
        if (!SmartTravelNotifications.instance) {
            SmartTravelNotifications.instance = new SmartTravelNotifications();
        }
        return SmartTravelNotifications.instance;
    }

    // Start monitoring for travel notifications
    startMonitoring(): void {
        if (this.isMonitoring) return;

        this.isMonitoring = true;

        // Check for notifications every 2 minutes
        this.monitoringInterval = setInterval(() => {
            this.checkForTravelAlerts();
        }, 2 * 60 * 1000);

        // Initial check
        this.checkForTravelAlerts();

        console.log('🔔 Smart Travel Notifications monitoring started');
    }

    // Stop monitoring
    stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        console.log('🔕 Smart Travel Notifications monitoring stopped');
    }

    // Check for travel alerts
    private async checkForTravelAlerts(): Promise<void> {
        if (!this.settings.enabled) return;

        try {
            // Check weather alerts
            if (this.settings.weatherAlerts) {
                await this.checkWeatherAlerts();
            }

            // Check traffic alerts (simulated)
            if (this.settings.trafficAlerts) {
                await this.checkTrafficAlerts();
            }

            // Check safety alerts
            if (this.settings.safetyAlerts) {
                await this.checkSafetyAlerts();
            }

            // Clean up expired notifications
            this.cleanupExpiredNotifications();

        } catch (error) {
            console.error('Error checking travel alerts:', error);
        }
    }

    // Check weather alerts
    private async checkWeatherAlerts(): Promise<void> {
        try {
            // Get user's current location
            const position = await this.getCurrentPosition();
            if (!position) return;

            // Get weather data
            const weather = await this.getWeatherData(position.lat, position.lon);
            const forecast = await this.getWeatherForecast(position.lat, position.lon);

            // Check for severe weather conditions
            this.analyzeWeatherConditions(weather, forecast, position);

        } catch (error) {
            console.error('Error checking weather alerts:', error);
        }
    }

    // Analyze weather conditions for alerts
    private analyzeWeatherConditions(weather: any, forecast: any, position: { lat: number, lon: number }): void {
        const currentWeather = weather.weather[0];
        const temp = weather.main.temp;
        const windSpeed = weather.wind.speed;

        // Severe weather alerts
        if (currentWeather.main.toLowerCase().includes('thunderstorm')) {
            this.createNotification({
                type: 'weather',
                priority: 'high',
                title: '⛈️ Severe Thunderstorm Alert',
                message: 'Thunderstorms detected in your area. Avoid travel if possible and seek shelter.',
                actionable: true,
                actions: [
                    {
                        label: 'View Safety Tips',
                        action: () => this.showSafetyTips('thunderstorm')
                    }
                ],
                location: weather.name,
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
            });
        }

        // Extreme temperature alerts
        if (temp > 40) {
            this.createNotification({
                type: 'weather',
                priority: 'high',
                title: '🌡️ Extreme Heat Warning',
                message: `Dangerous heat levels (${Math.round(temp)}°C). Stay hydrated and avoid prolonged outdoor exposure.`,
                actionable: true,
                actions: [
                    {
                        label: 'Heat Safety Tips',
                        action: () => this.showSafetyTips('heat')
                    }
                ],
                location: weather.name,
                expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
            });
        }

        // High wind alerts
        if (windSpeed > 15) {
            this.createNotification({
                type: 'weather',
                priority: 'medium',
                title: '💨 High Wind Alert',
                message: `Strong winds detected (${Math.round(windSpeed)} m/s). Drive carefully and secure loose objects.`,
                actionable: false,
                location: weather.name,
                expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 hours
            });
        }

        // Check forecast for upcoming weather
        if (forecast.list && forecast.list.length > 0) {
            const next6Hours = forecast.list.slice(0, 2); // Next 6 hours (3-hour intervals)

            next6Hours.forEach((item: any, index: number) => {
                const timeOffset = (index + 1) * 3; // 3, 6 hours
                const itemWeather = item.weather[0];

                if (itemWeather.main.toLowerCase().includes('rain') && item.rain?.['3h'] > 5) {
                    this.createNotification({
                        type: 'weather',
                        priority: 'medium',
                        title: '🌧️ Heavy Rain Expected',
                        message: `Heavy rain expected in ${timeOffset} hours. Plan your travel accordingly.`,
                        actionable: true,
                        actions: [
                            {
                                label: 'View Forecast',
                                action: () => this.showDetailedForecast(forecast)
                            }
                        ],
                        location: weather.name,
                        expiresAt: new Date(Date.now() + timeOffset * 60 * 60 * 1000)
                    });
                }
            });
        }
    }

    // Check traffic alerts (simulated)
    private async checkTrafficAlerts(): Promise<void> {
        // In a real app, this would integrate with traffic APIs like Google Maps Traffic API
        // For demo purposes, we'll simulate some traffic conditions

        const trafficConditions = [
            {
                condition: 'heavy',
                location: 'Lagos-Ibadan Expressway',
                delay: 45,
                reason: 'Accident near Berger'
            },
            {
                condition: 'moderate',
                location: 'Third Mainland Bridge',
                delay: 20,
                reason: 'Rush hour traffic'
            }
        ];

        // Randomly show traffic alerts (for demo)
        if (Math.random() < 0.1) { // 10% chance
            const alert = trafficConditions[Math.floor(Math.random() * trafficConditions.length)];

            this.createNotification({
                type: 'traffic',
                priority: alert.condition === 'heavy' ? 'high' : 'medium',
                title: '🚗 Traffic Alert',
                message: `${alert.condition.toUpperCase()} traffic on ${alert.location}. Expected delay: ${alert.delay} minutes. Reason: ${alert.reason}`,
                actionable: true,
                actions: [
                    {
                        label: 'Find Alternative Route',
                        action: () => this.findAlternativeRoute(alert.location)
                    }
                ],
                location: alert.location,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
            });
        }
    }

    // Check safety alerts
    private async checkSafetyAlerts(): Promise<void> {
        try {
            const position = await this.getCurrentPosition();
            if (!position) return;

            // Check for extreme weather that affects safety
            const weather = await this.getWeatherData(position.lat, position.lon);
            const uvData = await this.getUVData(position.lat, position.lon);

            // UV safety alerts
            if (uvData.value > 8) {
                this.createNotification({
                    type: 'safety',
                    priority: 'medium',
                    title: '☀️ High UV Alert',
                    message: `Extreme UV levels detected (${uvData.value}). Use maximum sun protection.`,
                    actionable: true,
                    actions: [
                        {
                            label: 'UV Safety Guide',
                            action: () => this.showSafetyTips('uv')
                        }
                    ],
                    location: weather.name,
                    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
                });
            }

            // Air quality alerts (simulated)
            const airQuality = Math.floor(Math.random() * 200); // Simulate AQI
            if (airQuality > 150) {
                this.createNotification({
                    type: 'safety',
                    priority: 'high',
                    title: '😷 Poor Air Quality Alert',
                    message: `Air quality is unhealthy (AQI: ${airQuality}). Consider wearing a mask outdoors.`,
                    actionable: true,
                    actions: [
                        {
                            label: 'Air Quality Tips',
                            action: () => this.showSafetyTips('air-quality')
                        }
                    ],
                    location: weather.name,
                    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours
                });
            }

        } catch (error) {
            console.error('Error checking safety alerts:', error);
        }
    }

    // Create and display notification
    private createNotification(notification: Omit<TravelNotification, 'id' | 'timestamp'>): void {
        const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const fullNotification: TravelNotification = {
            ...notification,
            id,
            timestamp: new Date()
        };

        // Check if similar notification already exists
        const existingSimilar = Array.from(this.notifications.values()).find(
            n => n.type === notification.type &&
                n.title === notification.title &&
                n.location === notification.location
        );

        if (existingSimilar) {
            return; // Don't spam with duplicate notifications
        }

        // Check quiet hours
        if (this.isQuietHours()) {
            fullNotification.priority = 'low'; // Reduce priority during quiet hours
        }

        this.notifications.set(id, fullNotification);

        // Display the notification
        this.displayNotification(fullNotification);

        // Send browser notification if supported and enabled
        this.sendBrowserNotification(fullNotification);

        console.log('🔔 Travel notification created:', fullNotification.title);
    }

    // Display notification in UI
    private displayNotification(notification: TravelNotification): void {
        const priorityColors = {
            low: 'from-gray-500 to-gray-600',
            medium: 'from-yellow-500 to-orange-500',
            high: 'from-orange-500 to-red-500',
            urgent: 'from-red-600 to-red-800'
        };

        const notificationEl = document.createElement('div');
        notificationEl.className = `
      fixed top-4 left-4 z-50 max-w-sm p-4 rounded-lg shadow-xl
      bg-gradient-to-br ${priorityColors[notification.priority]} text-white
      border border-white/20 backdrop-blur-sm animate-slide-in-left
    `;

        notificationEl.innerHTML = `
      <div class="flex items-start justify-between mb-2">
        <div class="font-bold text-sm">${notification.title}</div>
        <button onclick="this.parentElement.parentElement.remove()" 
                class="text-white/80 hover:text-white text-lg leading-none ml-2">×</button>
      </div>
      
      <div class="text-sm mb-3 opacity-90">${notification.message}</div>
      
      ${notification.location ? `
        <div class="text-xs opacity-75 mb-3">📍 ${notification.location}</div>
      ` : ''}
      
      ${notification.actionable && notification.actions ? `
        <div class="flex gap-2 text-xs">
          ${notification.actions.map(action => `
            <button onclick="(${action.action.toString()})()" 
                    class="flex-1 bg-white/20 hover:bg-white/30 py-1 px-2 rounded transition-colors">
              ${action.label}
            </button>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="text-xs text-center mt-2 opacity-60">
        ${notification.timestamp.toLocaleTimeString()}
      </div>
    `;

        document.body.appendChild(notificationEl);

        // Auto-remove after delay based on priority
        const delays = { low: 5000, medium: 8000, high: 12000, urgent: 15000 };
        setTimeout(() => {
            if (notificationEl.parentElement) {
                notificationEl.remove();
            }
        }, delays[notification.priority]);

        // Play sound if enabled
        if (this.settings.soundEnabled && !this.isQuietHours()) {
            this.playNotificationSound(notification.priority);
        }

        // Vibrate if enabled and supported
        if (this.settings.vibrationEnabled && 'vibrate' in navigator) {
            const patterns = { low: [100], medium: [100, 50, 100], high: [200, 100, 200], urgent: [300, 100, 300, 100, 300] };
            navigator.vibrate(patterns[notification.priority]);
        }
    }

    // Send browser notification
    private sendBrowserNotification(notification: TravelNotification): void {
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id,
                requireInteraction: notification.priority === 'urgent'
            });

            browserNotification.onclick = () => {
                window.focus();
                browserNotification.close();
            };

            // Auto-close after 10 seconds
            setTimeout(() => {
                browserNotification.close();
            }, 10000);
        }
    }

    // Play notification sound
    private playNotificationSound(priority: TravelNotification['priority']): void {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Different tones for different priorities
            const frequencies = { low: 400, medium: 600, high: 800, urgent: 1000 };
            oscillator.frequency.setValueAtTime(frequencies[priority], audioContext.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    }

    // Helper functions
    private async getCurrentPosition(): Promise<{ lat: number, lon: number } | null> {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                () => resolve(null),
                { timeout: 10000, maximumAge: 300000 } // 5 minutes cache
            );
        });
    }

    private async getWeatherData(lat: number, lon: number) {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
        );
        return await response.json();
    }

    private async getWeatherForecast(lat: number, lon: number) {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
        );
        return await response.json();
    }

    private async getUVData(lat: number, lon: number) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${this.apiKey}`
            );
            return await response.json();
        } catch (error) {
            return { value: 5 }; // Default value
        }
    }

    private isQuietHours(): boolean {
        if (!this.settings.quietHours.enabled) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMin] = this.settings.quietHours.start.split(':').map(Number);
        const [endHour, endMin] = this.settings.quietHours.end.split(':').map(Number);

        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        if (startTime <= endTime) {
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            // Quiet hours span midnight
            return currentTime >= startTime || currentTime <= endTime;
        }
    }

    private cleanupExpiredNotifications(): void {
        const now = new Date();
        this.notifications.forEach((notification, id) => {
            if (notification.expiresAt && notification.expiresAt < now) {
                this.notifications.delete(id);
            }
        });
    }

    private async requestNotificationPermission(): Promise<void> {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    // Action handlers
    private showSafetyTips(type: string): void {
        const tips = {
            thunderstorm: [
                'Seek shelter in a sturdy building',
                'Avoid open areas and tall objects',
                'Stay away from windows',
                'Unplug electrical devices',
                'Wait 30 minutes after last thunder before going outside'
            ],
            heat: [
                'Stay in air-conditioned areas',
                'Drink plenty of water',
                'Wear light-colored, loose clothing',
                'Avoid strenuous outdoor activities',
                'Never leave anyone in a parked car'
            ],
            uv: [
                'Use SPF 50+ sunscreen',
                'Wear protective clothing and hat',
                'Seek shade between 10 AM - 4 PM',
                'Wear UV-blocking sunglasses',
                'Reapply sunscreen every 2 hours'
            ],
            'air-quality': [
                'Limit outdoor activities',
                'Wear an N95 mask when outside',
                'Keep windows closed',
                'Use air purifiers indoors',
                'Avoid exercising outdoors'
            ]
        };

        const tipsList = tips[type as keyof typeof tips] || [];

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
        modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-md mx-4 shadow-2xl">
        <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          Safety Tips - ${type.charAt(0).toUpperCase() + type.slice(1)}
        </h2>
        <ul class="space-y-2 mb-4">
          ${tipsList.map(tip => `<li class="text-sm text-gray-600 dark:text-gray-300">• ${tip}</li>`).join('')}
        </ul>
        <button onclick="this.parentElement.parentElement.remove()" 
                class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors">
          Got it
        </button>
      </div>
    `;

        document.body.appendChild(modal);
    }

    private showDetailedForecast(forecast: any): void {
        // Implementation for showing detailed forecast
        console.log('Showing detailed forecast:', forecast);
    }

    private findAlternativeRoute(location: string): void {
        // Implementation for finding alternative routes
        console.log('Finding alternative route for:', location);
    }

    // Public methods
    getActiveNotifications(): TravelNotification[] {
        return Array.from(this.notifications.values());
    }

    dismissNotification(id: string): void {
        this.notifications.delete(id);
    }

    updateSettings(newSettings: Partial<NotificationSettings>): void {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
    }

    getSettings(): NotificationSettings {
        return { ...this.settings };
    }

    private loadSettings(): void {
        try {
            const saved = localStorage.getItem('nexaflow-notification-settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading notification settings:', error);
        }
    }

    private saveSettings(): void {
        try {
            localStorage.setItem('nexaflow-notification-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving notification settings:', error);
        }
    }
}

export default SmartTravelNotifications;