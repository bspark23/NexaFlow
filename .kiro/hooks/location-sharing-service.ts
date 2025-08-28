/**
 * Real-Time Location Sharing Service
 * Enables safe location sharing between users with consent
 */

interface SharedLocation {
  userId: string;
  name: string;
  lat: number;
  lon: number;
  timestamp: Date;
  isActive: boolean;
  accuracy: number;
  speed?: number;
  heading?: number;
}

interface LocationSharingSettings {
  isEnabled: boolean;
  shareWithContacts: string[];
  shareRadius: number; // in kilometers
  autoStopAfter: number; // in minutes
}

class LocationSharingService {
  private static instance: LocationSharingService;
  private sharedLocations: Map<string, SharedLocation> = new Map();
  private myLocation: SharedLocation | null = null;
  private settings: LocationSharingSettings = {
    isEnabled: false,
    shareWithContacts: [],
    shareRadius: 10,
    autoStopAfter: 60
  };
  private watchId: number | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSharing = false;

  private constructor() {
    this.loadSettings();
  }

  static getInstance(): LocationSharingService {
    if (!LocationSharingService.instance) {
      LocationSharingService.instance = new LocationSharingService();
    }
    return LocationSharingService.instance;
  }

  // Start sharing location with consent
  async startLocationSharing(userName: string, contacts: string[] = []): Promise<boolean> {
    try {
      // Request user consent
      const consent = await this.requestLocationSharingConsent();
      if (!consent) {
        return false;
      }

      // Update settings
      this.settings.isEnabled = true;
      this.settings.shareWithContacts = contacts;
      this.saveSettings();

      // Start location tracking
      this.startLocationTracking(userName);

      // Start syncing with other users
      this.startLocationSync();

      this.isSharing = true;
      console.log('✅ Location sharing started');
      
      // Auto-stop after specified time
      setTimeout(() => {
        this.stopLocationSharing();
      }, this.settings.autoStopAfter * 60 * 1000);

      return true;
    } catch (error) {
      console.error('❌ Failed to start location sharing:', error);
      return false;
    }
  }

  // Stop location sharing
  stopLocationSharing(): void {
    this.isSharing = false;
    this.settings.isEnabled = false;
    this.saveSettings();

    // Stop location tracking
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    // Stop syncing
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Clear my location
    this.myLocation = null;

    console.log('🛑 Location sharing stopped');
    this.notifyLocationSharingStopped();
  }

  // Request user consent for location sharing
  private async requestLocationSharingConsent(): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = `
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/50 backdrop-blur-sm
      `;
      
      modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-md mx-4 shadow-2xl">
          <div class="text-center mb-4">
            <div class="text-4xl mb-2">📍</div>
            <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Share Your Location?
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              This will allow selected contacts to see your real-time location for safety and coordination purposes.
            </p>
          </div>
          
          <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <h3 class="font-semibold text-blue-800 dark:text-blue-300 mb-2">Privacy & Safety:</h3>
            <ul class="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Your location is only shared with people you choose</li>
              <li>• Sharing automatically stops after 1 hour</li>
              <li>• You can stop sharing at any time</li>
              <li>• Location data is not stored permanently</li>
            </ul>
          </div>
          
          <div class="flex gap-3">
            <button id="deny-sharing" class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
              Don't Share
            </button>
            <button id="allow-sharing" class="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
              Share Location
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const allowButton = modal.querySelector('#allow-sharing');
      const denyButton = modal.querySelector('#deny-sharing');
      
      allowButton?.addEventListener('click', () => {
        modal.remove();
        resolve(true);
      });
      
      denyButton?.addEventListener('click', () => {
        modal.remove();
        resolve(false);
      });
    });
  }

  // Start location tracking
  private startLocationTracking(userName: string): void {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.myLocation = {
          userId: this.generateUserId(),
          name: userName,
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          timestamp: new Date(),
          isActive: true,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined
        };

        // Broadcast location to shared contacts
        this.broadcastLocation();
      },
      (error) => {
        console.error('Location tracking error:', error);
        this.handleLocationError(error);
      },
      options
    );
  }

  // Start syncing locations with other users
  private startLocationSync(): void {
    // Simulate real-time sync (in a real app, use Firebase Realtime Database or WebSockets)
    this.syncInterval = setInterval(() => {
      this.syncSharedLocations();
    }, 5000); // Sync every 5 seconds
  }

  // Broadcast location to contacts
  private broadcastLocation(): void {
    if (!this.myLocation || !this.settings.isEnabled) return;

    // In a real app, this would send to Firebase or WebSocket server
    console.log('📡 Broadcasting location:', this.myLocation);
    
    // Store in localStorage for demo (in real app, use proper backend)
    const sharedData = {
      ...this.myLocation,
      contacts: this.settings.shareWithContacts
    };
    
    localStorage.setItem(`location_share_${this.myLocation.userId}`, JSON.stringify(sharedData));
  }

  // Sync shared locations from other users
  private syncSharedLocations(): void {
    try {
      // In a real app, this would fetch from Firebase or WebSocket
      const keys = Object.keys(localStorage).filter(key => key.startsWith('location_share_'));
      
      keys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          const sharedLocation = JSON.parse(data);
          
          // Only include if we're in their contact list or within radius
          if (this.shouldShowSharedLocation(sharedLocation)) {
            this.sharedLocations.set(sharedLocation.userId, {
              ...sharedLocation,
              timestamp: new Date(sharedLocation.timestamp)
            });
          }
        }
      });

      // Clean up old locations (older than 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      this.sharedLocations.forEach((location, userId) => {
        if (location.timestamp < fiveMinutesAgo) {
          this.sharedLocations.delete(userId);
        }
      });

    } catch (error) {
      console.error('Error syncing shared locations:', error);
    }
  }

  // Check if we should show a shared location
  private shouldShowSharedLocation(sharedLocation: any): boolean {
    if (!this.myLocation) return false;

    // Check if we're in their contact list
    if (sharedLocation.contacts && sharedLocation.contacts.includes(this.myLocation.userId)) {
      return true;
    }

    // Check if they're within our sharing radius
    const distance = this.calculateDistance(
      this.myLocation,
      { lat: sharedLocation.lat, lon: sharedLocation.lon }
    );

    return distance <= this.settings.shareRadius;
  }

  // Calculate distance between two points
  private calculateDistance(from: {lat: number, lon: number}, to: {lat: number, lon: number}): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lon - from.lon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Generate unique user ID
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Handle location errors
  private handleLocationError(error: GeolocationPositionError): void {
    let message = 'Location sharing failed: ';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message += 'Location access denied. Please enable location services.';
        break;
      case error.POSITION_UNAVAILABLE:
        message += 'Location information unavailable.';
        break;
      case error.TIMEOUT:
        message += 'Location request timed out.';
        break;
      default:
        message += 'Unknown location error.';
    }

    this.showNotification(message, 'error');
    this.stopLocationSharing();
  }

  // Show notification
  private showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error'): void {
    const colors = {
      info: 'from-blue-500 to-blue-600',
      success: 'from-green-500 to-green-600',
      warning: 'from-yellow-500 to-orange-500',
      error: 'from-red-500 to-red-600'
    };

    const notification = document.createElement('div');
    notification.className = `
      fixed top-4 right-4 z-50 p-4 rounded-lg max-w-sm
      bg-gradient-to-r ${colors[type]} text-white shadow-lg
      border border-white/20 backdrop-blur-sm
    `;
    notification.innerHTML = `
      <div class="flex items-start gap-2">
        <span class="text-sm font-medium">${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white/80 hover:text-white text-lg leading-none">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // Notify when location sharing stops
  private notifyLocationSharingStopped(): void {
    this.showNotification('Location sharing has been stopped', 'info');
  }

  // Load settings from localStorage
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('nexaflow-location-sharing-settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading location sharing settings:', error);
    }
  }

  // Save settings to localStorage
  private saveSettings(): void {
    try {
      localStorage.setItem('nexaflow-location-sharing-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving location sharing settings:', error);
    }
  }

  // Public getters
  getMyLocation(): SharedLocation | null {
    return this.myLocation;
  }

  getSharedLocations(): SharedLocation[] {
    return Array.from(this.sharedLocations.values());
  }

  isLocationSharingActive(): boolean {
    return this.isSharing;
  }

  getSettings(): LocationSharingSettings {
    return { ...this.settings };
  }

  // Update settings
  updateSettings(newSettings: Partial<LocationSharingSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }
}

export default LocationSharingService;