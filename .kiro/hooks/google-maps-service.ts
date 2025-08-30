/**
 * Google Maps Service for NexaFlow Navigation
 * Handles Google Maps API integration for directions, distance matrix, and real-time navigation
 */

interface RouteOptions {
  origin: { lat: number; lng: number }
  destination: { lat: number; lng: number }
  travelMode: string
  avoidHighways?: boolean
  avoidTolls?: boolean
  waypoints?: any[]
}

interface NavigationStep {
  instruction: string
  distance: string
  duration: string
  startLocation: { lat: number; lng: number }
  endLocation: { lat: number; lng: number }
  maneuver?: string
}

interface RouteInfo {
  steps: NavigationStep[]
  totalDistance: string
  totalDuration: string
  bounds: any
  polyline: string
}

interface DistanceMatrixResult {
  distance: string
  duration: string
  status: string
}

class GoogleMapsService {
  private static instance: GoogleMapsService
  private directionsService: any = null
  private distanceMatrixService: any = null
  private placesService: any = null
  private geocoder: any = null
  private isInitialized: boolean = false

  private constructor() {
    this.initializeServices()
  }

  static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService()
    }
    return GoogleMapsService.instance
  }

  private async initializeServices(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Wait for Google Maps to be loaded
      await this.waitForGoogleMaps()
      
      this.directionsService = new google.maps.DirectionsService()
      this.distanceMatrixService = new google.maps.DistanceMatrixService()
      this.geocoder = new google.maps.Geocoder()
      
      // Initialize places service with a dummy map
      const dummyMap = new google.maps.Map(document.createElement('div'))
      this.placesService = new google.maps.places.PlacesService(dummyMap)
      
      this.isInitialized = true
      console.log('✅ Google Maps services initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Google Maps services:', error)
    }
  }

  private waitForGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve()
        return
      }

      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error('Google Maps failed to load'))
      }, 10000)
    })
  }

  public async calculateRoute(options: RouteOptions): Promise<RouteInfo> {
    if (!this.directionsService) {
      throw new Error('Directions service not initialized')
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.DirectionsRequest = {
        origin: options.origin,
        destination: options.destination,
        travelMode: options.travelMode,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: options.avoidHighways || false,
        avoidTolls: options.avoidTolls || false,
        waypoints: options.waypoints || [],
        optimizeWaypoints: true
      }

      this.directionsService.route(request, (result, status) => {
        if (status === 'OK' && result) {
          const route = result.routes[0]
          const leg = route.legs[0]
          
          const routeInfo: RouteInfo = {
            steps: leg.steps.map(step => ({
              instruction: this.cleanHtmlInstructions(step.instructions),
              distance: step.distance?.text || '',
              duration: step.duration?.text || '',
              startLocation: {
                lat: step.start_location.lat(),
                lng: step.start_location.lng()
              },
              endLocation: {
                lat: step.end_location.lat(),
                lng: step.end_location.lng()
              },
              maneuver: step.maneuver
            })),
            totalDistance: leg.distance?.text || '',
            totalDuration: leg.duration?.text || '',
            bounds: route.bounds,
            polyline: route.overview_polyline
          }
          
          resolve(routeInfo)
        } else {
          reject(new Error(`Route calculation failed: ${status}`))
        }
      })
    })
  }

  public async calculateDistanceMatrix(
    origins: google.maps.LatLngLiteral[],
    destinations: google.maps.LatLngLiteral[],
    travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING
  ): Promise<DistanceMatrixResult[][]> {
    if (!this.distanceMatrixService) {
      throw new Error('Distance Matrix service not initialized')
    }

    return new Promise((resolve, reject) => {
      this.distanceMatrixService!.getDistanceMatrix({
        origins: origins,
        destinations: destinations,
        travelMode: travelMode,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === 'OK' && response) {
          const results: DistanceMatrixResult[][] = []
          
          response.rows.forEach((row, i) => {
            results[i] = []
            row.elements.forEach((element, j) => {
              results[i][j] = {
                distance: element.distance?.text || 'N/A',
                duration: element.duration?.text || 'N/A',
                status: element.status
              }
            })
          })
          
          resolve(results)
        } else {
          reject(new Error(`Distance Matrix calculation failed: ${status}`))
        }
      })
    })
  }

  public async geocodeAddress(address: string): Promise<google.maps.LatLngLiteral> {
    if (!this.geocoder) {
      throw new Error('Geocoder service not initialized')
    }

    return new Promise((resolve, reject) => {
      this.geocoder!.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location
          resolve({
            lat: location.lat(),
            lng: location.lng()
          })
        } else {
          reject(new Error(`Geocoding failed: ${status}`))
        }
      })
    })
  }

  public async reverseGeocode(location: google.maps.LatLngLiteral): Promise<string> {
    if (!this.geocoder) {
      throw new Error('Geocoder service not initialized')
    }

    return new Promise((resolve, reject) => {
      this.geocoder!.geocode({ location }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].formatted_address)
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`))
        }
      })
    })
  }

  public async searchPlaces(
    query: string,
    location?: google.maps.LatLngLiteral,
    radius: number = 5000
  ): Promise<google.maps.places.PlaceResult[]> {
    if (!this.placesService) {
      throw new Error('Places service not initialized')
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.TextSearchRequest = {
        query: query,
        location: location ? new google.maps.LatLng(location.lat, location.lng) : undefined,
        radius: radius
      }

      this.placesService!.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results)
        } else {
          reject(new Error(`Places search failed: ${status}`))
        }
      })
    })
  }

  public async getNearbyPlaces(
    location: google.maps.LatLngLiteral,
    type: string,
    radius: number = 1000
  ): Promise<google.maps.places.PlaceResult[]> {
    if (!this.placesService) {
      throw new Error('Places service not initialized')
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius: radius,
        type: type as any
      }

      this.placesService!.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results)
        } else {
          reject(new Error(`Nearby search failed: ${status}`))
        }
      })
    })
  }

  public calculateDistance(
    point1: google.maps.LatLngLiteral,
    point2: google.maps.LatLngLiteral
  ): number {
    const lat1Rad = (point1.lat * Math.PI) / 180
    const lat2Rad = (point2.lat * Math.PI) / 180
    const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180
    const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const earthRadius = 6371000 // Earth's radius in meters
    
    return earthRadius * c
  }

  public calculateBearing(
    point1: google.maps.LatLngLiteral,
    point2: google.maps.LatLngLiteral
  ): number {
    const lat1Rad = (point1.lat * Math.PI) / 180
    const lat2Rad = (point2.lat * Math.PI) / 180
    const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180

    const y = Math.sin(deltaLngRad) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLngRad)

    const bearingRad = Math.atan2(y, x)
    const bearingDeg = (bearingRad * 180) / Math.PI

    return (bearingDeg + 360) % 360
  }

  public formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`
    } else {
      return `${(meters / 1000).toFixed(1)} km`
    }
  }

  public formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  private cleanHtmlInstructions(html: string): string {
    // Remove HTML tags and decode entities
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // Real-time navigation helpers
  public isOnRoute(
    currentLocation: google.maps.LatLngLiteral,
    routeSteps: NavigationStep[],
    tolerance: number = 50
  ): { onRoute: boolean; nearestStep: number; distanceFromRoute: number } {
    let nearestStep = 0
    let minDistance = Infinity

    routeSteps.forEach((step, index) => {
      const distanceToStart = this.calculateDistance(currentLocation, step.startLocation)
      const distanceToEnd = this.calculateDistance(currentLocation, step.endLocation)
      const minStepDistance = Math.min(distanceToStart, distanceToEnd)

      if (minStepDistance < minDistance) {
        minDistance = minStepDistance
        nearestStep = index
      }
    })

    return {
      onRoute: minDistance <= tolerance,
      nearestStep,
      distanceFromRoute: minDistance
    }
  }

  public getNextInstruction(
    currentLocation: google.maps.LatLngLiteral,
    routeSteps: NavigationStep[],
    currentStepIndex: number
  ): { instruction: string; distance: string; stepIndex: number } | null {
    if (currentStepIndex >= routeSteps.length) {
      return null
    }

    const currentStep = routeSteps[currentStepIndex]
    const distanceToStepEnd = this.calculateDistance(currentLocation, currentStep.endLocation)

    // If close to current step end (within 30 meters), move to next step
    if (distanceToStepEnd < 30 && currentStepIndex < routeSteps.length - 1) {
      const nextStep = routeSteps[currentStepIndex + 1]
      return {
        instruction: nextStep.instruction,
        distance: this.formatDistance(this.calculateDistance(currentLocation, nextStep.endLocation)),
        stepIndex: currentStepIndex + 1
      }
    }

    return {
      instruction: currentStep.instruction,
      distance: this.formatDistance(distanceToStepEnd),
      stepIndex: currentStepIndex
    }
  }

  // Traffic and alternative routes
  public async getAlternativeRoutes(options: RouteOptions): Promise<RouteInfo[]> {
    if (!this.directionsService) {
      throw new Error('Directions service not initialized')
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.DirectionsRequest = {
        ...options,
        provideRouteAlternatives: true,
        unitSystem: google.maps.UnitSystem.METRIC
      }

      this.directionsService.route(request, (result, status) => {
        if (status === 'OK' && result) {
          const routes: RouteInfo[] = result.routes.map(route => {
            const leg = route.legs[0]
            return {
              steps: leg.steps.map(step => ({
                instruction: this.cleanHtmlInstructions(step.instructions),
                distance: step.distance?.text || '',
                duration: step.duration?.text || '',
                startLocation: {
                  lat: step.start_location.lat(),
                  lng: step.start_location.lng()
                },
                endLocation: {
                  lat: step.end_location.lat(),
                  lng: step.end_location.lng()
                },
                maneuver: step.maneuver
              })),
              totalDistance: leg.distance?.text || '',
              totalDuration: leg.duration?.text || '',
              bounds: route.bounds,
              polyline: route.overview_polyline
            }
          })
          
          resolve(routes)
        } else {
          reject(new Error(`Alternative routes calculation failed: ${status}`))
        }
      })
    })
  }

  public isServiceInitialized(): boolean {
    return this.isInitialized
  }
}

export default GoogleMapsService