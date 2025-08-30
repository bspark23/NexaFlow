/**
 * Navigation Assistant Hook for NexaFlow
 * Provides intelligent navigation assistance with voice guidance and real-time updates
 */

interface NavigationUpdate {
  instruction: string
  distance: string
  timeRemaining: string
  currentStep: number
  totalSteps: number
  speedAlert?: string
  trafficAlert?: string
}

interface LocationData {
  lat: number
  lng: number
  accuracy: number
  speed?: number
  heading?: number
}

class NavigationAssistantHook {
  private static instance: NavigationAssistantHook
  private isActive: boolean = false
  private lastLocation: LocationData | null = null
  private lastAnnouncement: number = 0
  private announcementInterval: number = 120000 // 2 minutes
  private speedThreshold: number = 10 // km/h over speed limit
  private voiceEnabled: boolean = true
  private currentRoute: any = null
  private watchId: number | null = null

  private constructor() {
    this.initializeVoiceSettings()
  }

  static getInstance(): NavigationAssistantHook {
    if (!NavigationAssistantHook.instance) {
      NavigationAssistantHook.instance = new NavigationAssistantHook()
    }
    return NavigationAssistantHook.instance
  }

  private initializeVoiceSettings(): void {
    const savedVoiceEnabled = localStorage.getItem('nexaflow-navigation-voice')
    if (savedVoiceEnabled !== null) {
      this.voiceEnabled = JSON.parse(savedVoiceEnabled)
    }
  }

  public startNavigation(route: any): void {
    this.isActive = true
    this.currentRoute = route
    this.lastAnnouncement = 0
    
    console.log('🧭 Navigation Assistant started')
    this.speak('Navigation started. I will provide turn-by-turn directions and traffic updates.')
    
    // Start location tracking
    this.startLocationTracking()
    
    // Schedule periodic announcements
    this.schedulePeriodicAnnouncements()
  }

  public stopNavigation(): void {
    this.isActive = false
    this.currentRoute = null
    
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
    
    console.log('🧭 Navigation Assistant stopped')
    this.speak('Navigation stopped.')
  }

  private startLocationTracking(): void {
    if (!navigator.geolocation) {
      console.warn('🧭 Geolocation not supported')
      return
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined
        }
        
        this.updateLocation(location)
      },
      (error) => {
        console.error('🧭 Location tracking error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000
      }
    )
  }

  private updateLocation(location: LocationData): void {
    if (!this.isActive) return

    this.lastLocation = location
    
    // Check for navigation updates
    this.checkNavigationProgress(location)
    
    // Check for speed alerts
    this.checkSpeedAlerts(location)
    
    // Update UI with current location
    this.broadcastLocationUpdate(location)
  }

  private checkNavigationProgress(location: LocationData): void {
    if (!this.currentRoute) return

    // This would integrate with Google Maps Directions API
    // For now, we'll simulate navigation progress
    const now = Date.now()
    
    // Provide periodic updates every 2 minutes
    if (now - this.lastAnnouncement > this.announcementInterval) {
      this.provideNavigationUpdate()
      this.lastAnnouncement = now
    }
  }

  private checkSpeedAlerts(location: LocationData): void {
    if (!location.speed) return

    const speedKmh = location.speed * 3.6 // Convert m/s to km/h
    
    // Example speed limit check (would integrate with real speed limit data)
    const speedLimit = 50 // km/h
    
    if (speedKmh > speedLimit + this.speedThreshold) {
      this.speak(`Speed alert: You are going ${Math.round(speedKmh)} kilometers per hour in a ${speedLimit} zone.`)
      this.showNotification('🚨 Speed Alert', `Slow down! Current speed: ${Math.round(speedKmh)} km/h`, 'warning')
    }
  }

  private provideNavigationUpdate(): void {
    if (!this.voiceEnabled) return

    // Simulate navigation instructions (would integrate with real directions)
    const updates = [
      "Continue straight for 500 meters, then turn right.",
      "In 200 meters, turn left onto Main Street.",
      "You have 5 minutes remaining to your destination.",
      "Take the next exit and continue for 1 kilometer.",
      "Turn right at the traffic light in 100 meters."
    ]

    const randomUpdate = updates[Math.floor(Math.random() * updates.length)]
    this.speak(randomUpdate)
    
    this.showNotification('🧭 Navigation Update', randomUpdate, 'info')
  }

  private schedulePeriodicAnnouncements(): void {
    if (!this.isActive) return

    setTimeout(() => {
      if (this.isActive && this.voiceEnabled) {
        this.providePeriodicUpdate()
        this.schedulePeriodicAnnouncements() // Schedule next announcement
      }
    }, this.announcementInterval)
  }

  private providePeriodicUpdate(): void {
    const timeUpdates = [
      "You have approximately 15 minutes left to reach your destination.",
      "You're making good time. 10 minutes remaining.",
      "Traffic is light. You should arrive on schedule.",
      "You have 20 minutes left. Consider taking a break if needed.",
      "Almost there! 5 minutes to your destination."
    ]

    const randomTimeUpdate = timeUpdates[Math.floor(Math.random() * timeUpdates.length)]
    this.speak(randomTimeUpdate)
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.voiceEnabled = enabled
    localStorage.setItem('nexaflow-navigation-voice', JSON.stringify(enabled))
    
    if (enabled) {
      this.speak('Voice guidance enabled.')
    }
  }

  public announceTrafficUpdate(message: string): void {
    if (!this.voiceEnabled) return
    
    this.speak(`Traffic update: ${message}`)
    this.showNotification('🚦 Traffic Alert', message, 'warning')
  }

  public announceWeatherAlert(message: string): void {
    if (!this.voiceEnabled) return
    
    this.speak(`Weather alert for your route: ${message}`)
    this.showNotification('🌧️ Weather Alert', message, 'warning')
  }

  public announceArrival(): void {
    this.speak('You have arrived at your destination. Navigation complete.')
    this.showNotification('🎯 Destination Reached', 'You have arrived at your destination!', 'success')
    this.stopNavigation()
  }

  private speak(text: string): void {
    if (!this.voiceEnabled || !('speechSynthesis' in window)) return

    // Cancel any ongoing speech
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 0.8
    utterance.lang = 'en-US'

    // Use a more natural voice if available
    const voices = speechSynthesis.getVoices()
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('Alex') ||
      voice.name.includes('Samantha')
    )
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    speechSynthesis.speak(utterance)
    console.log('🔊 Navigation announcement:', text)
  }

  private showNotification(title: string, message: string, type: 'info' | 'warning' | 'success' | 'error'): void {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `
      fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm
      transform transition-all duration-300 ease-in-out
      ${this.getNotificationStyles(type)}
    `
    
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          ${this.getNotificationIcon(type)}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white">${title}</p>
          <p class="text-sm text-white/90 mt-1">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" 
                class="flex-shrink-0 text-white/80 hover:text-white">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `

    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)'
    }, 100)

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = 'translateX(100%)'
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove()
          }
        }, 300)
      }
    }, 5000)
  }

  private getNotificationStyles(type: string): string {
    const styles = {
      info: 'bg-gradient-to-r from-blue-500 to-blue-600',
      warning: 'bg-gradient-to-r from-orange-500 to-red-500',
      success: 'bg-gradient-to-r from-green-500 to-green-600',
      error: 'bg-gradient-to-r from-red-500 to-red-600'
    }
    return styles[type as keyof typeof styles] || styles.info
  }

  private getNotificationIcon(type: string): string {
    const icons = {
      info: '🧭',
      warning: '⚠️',
      success: '✅',
      error: '❌'
    }
    return icons[type as keyof typeof icons] || icons.info
  }

  private broadcastLocationUpdate(location: LocationData): void {
    // Broadcast location update to other components
    const event = new CustomEvent('navigationLocationUpdate', {
      detail: { location, isNavigating: this.isActive }
    })
    window.dispatchEvent(event)
  }

  // Public methods for external integration
  public getCurrentLocation(): LocationData | null {
    return this.lastLocation
  }

  public isNavigationActive(): boolean {
    return this.isActive
  }

  public getVoiceEnabled(): boolean {
    return this.voiceEnabled
  }

  // Integration with weather and traffic services
  public integrateWithWeatherService(): void {
    // Listen for weather alerts that might affect navigation
    window.addEventListener('weatherAlert', (event: any) => {
      if (this.isActive && event.detail.severity === 'severe') {
        this.announceWeatherAlert(event.detail.message)
      }
    })
  }

  public integrateWithTrafficService(): void {
    // Simulate traffic monitoring (would integrate with real traffic API)
    if (this.isActive) {
      setTimeout(() => {
        const trafficAlerts = [
          "Heavy traffic ahead. Consider alternate route.",
          "Accident reported on your route. Expect delays.",
          "Construction zone ahead. Reduce speed.",
          "Traffic is clearing up. You're making good time."
        ]
        
        if (Math.random() > 0.7) { // 30% chance of traffic alert
          const alert = trafficAlerts[Math.floor(Math.random() * trafficAlerts.length)]
          this.announceTrafficUpdate(alert)
        }
        
        // Schedule next traffic check
        this.integrateWithTrafficService()
      }, 300000) // Check every 5 minutes
    }
  }
}

export default NavigationAssistantHook