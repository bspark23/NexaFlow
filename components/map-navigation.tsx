"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  MapPin,
  Route,
  AlertCircle,
  Compass,
  Car,
  PersonStanding,
  Bike,
  Search,
  Navigation,
  Target,
  Clock,
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowRight,
} from "lucide-react"
import dynamic from "next/dynamic"

// Remove AI API key usage or references if any (none found in this file)

// Dynamically import Leaflet to avoid SSR issues
const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
        <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
  )
})

interface LocationCoords {
  lat: number
  lng: number
  address?: string
}

interface RouteInfo {
  distance: number // in kilometers
  duration: number // in minutes
  steps: NavigationStep[]
}

interface NavigationStep {
  instruction: string
  distance: number
  duration: number
  coordinates: [number, number]
  maneuver: string
}

interface NavigationState {
  currentStep: number
  distanceToNext: number
  timeRemaining: number
  totalDistance: number
  isRecalculating: boolean
}

export function MapNavigation() {
  const [error, setError] = useState<string | null>(null)
  const [destination, setDestination] = useState("")
  const [travelMode, setTravelMode] = useState<string>("DRIVING")
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<LocationCoords | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [loading, setLoading] = useState(false)

  // Remove unused useRef import warning
  const _ = useRef
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null)
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentStep: 0,
    distanceToNext: 0,
    timeRemaining: 0,
    totalDistance: 0,
    isRecalculating: false
  })
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [lastVoiceAnnouncement, setLastVoiceAnnouncement] = useState<number>(0)

  const watchIdRef = useRef<number | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis
    }
  }, [])

  // Get user's current location and set up real-time tracking
  useEffect(() => {
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: "Current Location"
            }
            setCurrentLocation(newLocation)

            // Update navigation if active
            if (isNavigating && routeInfo) {
              updateNavigationProgress(newLocation)
            }
          },
          (error) => {
            console.warn("Geolocation error:", error)
            // Default to London if geolocation fails
            setCurrentLocation({
              lat: 51.505,
              lng: -0.09,
              address: "Default Location"
            })
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        )
      } else {
        // Default location if geolocation not supported
        setCurrentLocation({
          lat: 51.505,
          lng: -0.09,
          address: "Default Location"
        })
      }
    }

    getCurrentLocation()

    // Set up real-time location tracking when navigating
    if (isNavigating && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Current Location"
          }
          setCurrentLocation(newLocation)
          updateNavigationProgress(newLocation)
        },
        (error) => console.warn("Location tracking error:", error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 }
      )
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [isNavigating])

  // Geocode destination address
  const searchDestination = async () => {
    if (!destination.trim()) return

    setLoading(true)
    setError(null)

    try {
      // Using Nominatim API for geocoding with English language preference
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1&accept-language=en&addressdetails=1`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const result = data[0]
        setDestinationCoords({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name
        })
        setError(null)
      } else {
        setError("Location not found. Please try a different address.")
      }
    } catch (err) {
      setError("Failed to search location. Please check your internet connection.")
    } finally {
      setLoading(false)
    }
  }

  const startNavigation = () => {
    if (currentLocation && destinationCoords) {
      setIsNavigating(true)
      // In a real app, this would start turn-by-turn navigation
      alert(`Navigation started from ${currentLocation.address} to ${destinationCoords.address}`)
    }
  }

  const stopNavigation = () => {
    setIsNavigating(false)
    setRouteInfo(null)
    setRouteGeometry(null)
    setNavigationState({
      currentStep: 0,
      distanceToNext: 0,
      timeRemaining: 0,
      totalDistance: 0,
      isRecalculating: false
    })
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }, [])

  // Get direction from bearing
  const getDirection = useCallback((bearing: number): string => {
    const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']
    const index = Math.round(bearing / 45) % 8
    return directions[index]
  }, [])

  // Real-time location tracking with high accuracy
  useEffect(() => {
    if (isNavigating && navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000 // Use fresh location data
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Current Location (GPS)"
          }
          setCurrentLocation(newLocation)
          updateNavigationProgress(newLocation)
        },
        (error) => {
          console.warn("Real-time location tracking error:", error)
          setError("GPS tracking interrupted. Navigation may be less accurate.")
        },
        options
      )

      return () => {
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }
      }
    }
  }, [isNavigating])

  // Text-to-speech announcements
  const announceNavigation = useCallback((timeRemaining: number, distance: number) => {
    if (!speechSynthesisRef.current || !voiceEnabled) return

    let message = ""
    if (distance < 0.1) {
      message = "You have arrived at your destination"
    } else if (distance < 0.5) {
      message = `You are ${Math.round(distance * 1000)} meters from your destination`
    } else if (timeRemaining < 5) {
      message = `You will arrive in ${Math.round(timeRemaining)} minutes`
    } else {
      message = `You have ${Math.round(timeRemaining)} minutes remaining to reach your destination`
    }

    const utterance = new SpeechSynthesisUtterance(message)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8
    speechSynthesisRef.current.speak(utterance)
  }, [voiceEnabled])

  // Enhanced route calculation with multiple routing services for accuracy
  const calculateRoute = useCallback(async (start: LocationCoords, end: LocationCoords) => {
    try {
      setNavigationState(prev => ({ ...prev, isRecalculating: true }))
      setError(null)

      let routeData = null
      let distance = 0
      let duration = 0
      let actualSteps: NavigationStep[] = []
      let routeGeometry: [number, number][] = []

      // Try OSRM first (most accurate for real routing)
      try {
        const profile = travelMode === "WALKING" ? "foot" : travelMode === "BICYCLING" ? "bike" : "driving"
        const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?steps=true&geometries=geojson&overview=full&language=en`

        const response = await fetch(osrmUrl)
        if (!response.ok) throw new Error(`OSRM API error: ${response.status}`)

        const data = await response.json()

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          distance = route.distance / 1000 // Convert to km
          duration = route.duration / 60 // Convert to minutes

          // Extract route geometry for accurate path drawing
          if (route.geometry && route.geometry.coordinates) {
            routeGeometry = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]])
          }

          // Extract detailed turn-by-turn directions
          if (route.legs && route.legs[0] && route.legs[0].steps) {
            actualSteps = route.legs[0].steps
              .filter((step: any) => step.distance > 10) // Filter out very short steps
              .map((step: any, index: number) => {
                // Create more natural instructions
                let instruction = step.maneuver.instruction || `Continue for ${(step.distance / 1000).toFixed(1)} km`

                // Enhance instructions based on maneuver type
                switch (step.maneuver.type) {
                  case 'depart':
                    instruction = `Start by heading ${getDirection(step.maneuver.bearing_after)}`
                    break
                  case 'turn':
                    const modifier = step.maneuver.modifier || ''
                    instruction = `Turn ${modifier} ${step.name ? `onto ${step.name}` : ''}`
                    break
                  case 'continue':
                    instruction = `Continue straight ${step.name ? `on ${step.name}` : ''}`
                    break
                  case 'arrive':
                    instruction = `Arrive at ${end.address || 'destination'}`
                    break
                  default:
                    instruction = step.maneuver.instruction || `Continue for ${(step.distance / 1000).toFixed(1)} km`
                }

                return {
                  instruction,
                  distance: step.distance / 1000, // Convert to km
                  duration: step.duration / 60, // Convert to minutes
                  coordinates: [step.maneuver.location[1], step.maneuver.location[0]] as [number, number],
                  maneuver: step.maneuver.type || "straight"
                }
              })
          }

          routeData = route
        }
      } catch (osrmError) {
        console.warn("OSRM routing failed:", osrmError)
        setError("Primary routing service unavailable, using backup calculation...")
      }

      // Fallback to direct calculation if OSRM fails
      if (!routeData) {
        distance = calculateDistance(start.lat, start.lng, end.lat, end.lng)
        const baseSpeed = travelMode === "WALKING" ? 5 : travelMode === "BICYCLING" ? 15 : 50 // km/h
        duration = (distance / baseSpeed) * 60 // minutes

        // Generate realistic turn-by-turn directions based on distance and direction
        const bearing = Math.atan2(end.lng - start.lng, end.lat - start.lat) * 180 / Math.PI
        const direction = bearing > -45 && bearing <= 45 ? "north" :
          bearing > 45 && bearing <= 135 ? "east" :
            bearing > 135 || bearing <= -135 ? "south" : "west"

        actualSteps = [
          {
            instruction: `Head ${direction} towards your destination`,
            distance: distance * 0.1,
            duration: duration * 0.1,
            coordinates: [start.lat + (end.lat - start.lat) * 0.1, start.lng + (end.lng - start.lng) * 0.1],
            maneuver: "depart"
          }
        ]

        // Add intermediate steps for longer routes
        if (distance > 2) {
          actualSteps.push({
            instruction: `Continue ${direction} on main route`,
            distance: distance * 0.7,
            duration: duration * 0.7,
            coordinates: [start.lat + (end.lat - start.lat) * 0.8, start.lng + (end.lng - start.lng) * 0.8],
            maneuver: "straight"
          })
        }

        actualSteps.push({
          instruction: `Arrive at ${end.address || "destination"}`,
          distance: distance * 0.2,
          duration: duration * 0.2,
          coordinates: [end.lat, end.lng],
          maneuver: "arrive"
        })
      }

      const routeInfo: RouteInfo = {
        distance,
        duration,
        steps: actualSteps
      }

      setRouteInfo(routeInfo)
      setRouteGeometry(routeGeometry)
      setNavigationState({
        currentStep: 0,
        distanceToNext: actualSteps[0]?.distance || distance,
        timeRemaining: duration,
        totalDistance: distance,
        isRecalculating: false
      })

      // Announce route found
      if (voiceEnabled) {
        const message = `Route calculated: ${distance.toFixed(1)} kilometers, estimated time ${Math.round(duration)} minutes`
        announceNavigation(duration, distance)
      }

      return routeInfo
    } catch (error) {
      console.error("Route calculation error:", error)
      setError("Failed to calculate route. Please check your internet connection.")
      setNavigationState(prev => ({ ...prev, isRecalculating: false }))
      return null
    }
  }, [calculateDistance, travelMode, voiceEnabled, announceNavigation])

  // Update navigation progress based on current location
  const updateNavigationProgress = useCallback((location: LocationCoords) => {
    if (!routeInfo || !destinationCoords) return

    const distanceToDestination = calculateDistance(
      location.lat, location.lng,
      destinationCoords.lat, destinationCoords.lng
    )

    // Update time remaining based on current distance and travel mode
    const baseSpeed = travelMode === "WALKING" ? 5 : travelMode === "BICYCLING" ? 15 : 50
    const timeRemaining = (distanceToDestination / baseSpeed) * 60

    setNavigationState(prev => ({
      ...prev,
      timeRemaining,
      distanceToNext: distanceToDestination
    }))

    // Voice announcements every 2 minutes or when close to destination
    const now = Date.now()
    const shouldAnnounce =
      (now - lastVoiceAnnouncement > 120000) || // Every 2 minutes
      (distanceToDestination < 0.5 && now - lastVoiceAnnouncement > 30000) // Every 30s when close

    if (shouldAnnounce && voiceEnabled) {
      announceNavigation(timeRemaining, distanceToDestination)
      setLastVoiceAnnouncement(now)
    }
  }, [routeInfo, destinationCoords, calculateDistance, travelMode, lastVoiceAnnouncement, voiceEnabled, announceNavigation])

  // Enhanced start navigation with route calculation
  const startNavigationWithRoute = async () => {
    if (currentLocation && destinationCoords) {
      setLoading(true)
      const route = await calculateRoute(currentLocation, destinationCoords)
      if (route) {
        setIsNavigating(true)
        if (voiceEnabled) {
          announceNavigation(route.duration, route.distance)
        }
      }
      setLoading(false)
    }
  }




  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-purple-500 bg-clip-text text-transparent">
          🗺️ Map & Navigation
        </h2>
        <p className="text-muted-foreground mt-2">
          Real-time GPS navigation with turn-by-turn directions
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-teal-500" />
            Location Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Location Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Location</label>
            <div className="flex gap-2">
              <Input
                value={currentLocation?.address || ""}
                onChange={(e) => {
                  // Allow manual input of current location
                  setCurrentLocation(prev => prev ? { ...prev, address: e.target.value } : { lat: 0, lng: 0, address: e.target.value })
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && currentLocation?.address && currentLocation.address !== "Current Location" && currentLocation.address !== "Default Location") {
                    // Auto-search on Enter
                    const searchCurrentLocation = async () => {
                      setLoading(true)
                      try {
                        const response = await fetch(
                          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(currentLocation.address || '')}&limit=1&accept-language=en`
                        )
                        const data = await response.json()
                        if (data && data.length > 0) {
                          const result = data[0]
                          setCurrentLocation({
                            lat: parseFloat(result.lat),
                            lng: parseFloat(result.lon),
                            address: result.display_name
                          })
                          setError(null)
                        } else {
                          setError("Current location not found. Please try a different address.")
                        }
                      } catch (err) {
                        setError("Failed to search current location.")
                      } finally {
                        setLoading(false)
                      }
                    }
                    searchCurrentLocation()
                  }
                }}
                placeholder="Enter your current location or use GPS"
                className="flex-1"
              />
              <Button
                onClick={async () => {
                  if (currentLocation?.address && currentLocation.address !== "Current Location" && currentLocation.address !== "Default Location") {
                    // Search for manually entered current location
                    setLoading(true)
                    try {
                      const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(currentLocation.address || '')}&limit=1`
                      )
                      const data = await response.json()
                      if (data && data.length > 0) {
                        const result = data[0]
                        setCurrentLocation({
                          lat: parseFloat(result.lat),
                          lng: parseFloat(result.lon),
                          address: result.display_name
                        })
                        setError(null)
                      } else {
                        setError("Current location not found. Please try a different address.")
                      }
                    } catch (err) {
                      setError("Failed to search current location.")
                    } finally {
                      setLoading(false)
                    }
                  }
                }}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={() => {
                  // Use GPS to get current location
                  if (navigator.geolocation) {
                    setLoading(true)
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setCurrentLocation({
                          lat: position.coords.latitude,
                          lng: position.coords.longitude,
                          address: "GPS Location"
                        })
                        setLoading(false)
                      },
                      (error) => {
                        console.warn("GPS error:", error)
                        setError("Failed to get GPS location. Please enter manually.")
                        setLoading(false)
                      },
                      { enableHighAccuracy: true, timeout: 10000 }
                    )
                  } else {
                    setError("GPS not supported. Please enter location manually.")
                  }
                }}
                disabled={loading}
                variant="outline"
                size="sm"
                title="Use GPS"
              >
                <Target className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Destination</label>
            <div className="flex gap-2">
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && destination.trim()) {
                    searchDestination()
                  }
                }}
                placeholder="Enter destination address"
                className="flex-1"
              />
              <Button
                onClick={searchDestination}
                disabled={loading || !destination.trim()}
                variant="outline"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Travel Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Travel Mode</label>
            <div className="flex gap-2">
              {[
                { mode: "DRIVING", label: "Driving", icon: <Car className="h-4 w-4" /> },
                { mode: "WALKING", label: "Walking", icon: <PersonStanding className="h-4 w-4" /> },
                { mode: "BICYCLING", label: "Cycling", icon: <Bike className="h-4 w-4" /> },
              ].map(({ mode, label, icon }) => (
                <Button
                  key={mode}
                  onClick={() => setTravelMode(mode)}
                  variant={travelMode === mode ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {icon}
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Removed Current Location Status to rely on real-time user input and map display */}

          {/* Destination Status */}
          {destinationCoords && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Destination Found</label>
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700 dark:text-green-300 truncate">
                  {destinationCoords.address}
                </span>
              </div>
            </div>
          )}

          {/* Route Actions */}
          <div className="flex gap-2">
            {!isNavigating ? (
              <Button
                onClick={startNavigationWithRoute}
                disabled={loading || !currentLocation || !destinationCoords}
                className="flex-1 bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                ) : (
                  <Navigation className="h-4 w-4 mr-2" />
                )}
                Start Navigation
              </Button>
            ) : (
              <Button
                onClick={stopNavigation}
                variant="destructive"
                className="flex-1"
              >
                Stop Navigation
              </Button>
            )}
            <Button
              onClick={searchDestination}
              disabled={loading || !destination.trim()}
              variant="outline"
            >
              <Route className="h-4 w-4 mr-2" />
              Find Route
            </Button>
            <Button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              variant="outline"
              size="sm"
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-teal-500" />
            Interactive Map
            {isNavigating && (
              <span className="ml-auto text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                Navigating
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <LeafletMap
            currentLocation={currentLocation}
            destination={destinationCoords}
            isNavigating={isNavigating}
            routeInfo={routeInfo}
            navigationState={navigationState}
            routeGeometry={routeGeometry}
          />
        </CardContent>
      </Card>

      {/* Route Information */}
      {routeInfo && !isNavigating && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Route className="h-5 w-5" />
              Route Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {routeInfo.distance.toFixed(1)} km
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Distance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(routeInfo.duration)} min
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Duration</div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Ready to start navigation with {travelMode.toLowerCase()} mode
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Navigation Status */}
      {isNavigating && routeInfo && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Navigation className="h-5 w-5" />
              Navigation Active
              {navigationState.isRecalculating && (
                <RotateCcw className="h-4 w-4 animate-spin ml-auto" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Real-time Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {navigationState.distanceToNext.toFixed(1)} km
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.round(navigationState.timeRemaining)} min
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">ETA</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {travelMode === "WALKING" ? "🚶" : travelMode === "BICYCLING" ? "🚴" : "🚗"}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Mode</div>
              </div>
            </div>

            {/* Current Navigation Step */}
            {routeInfo.steps[navigationState.currentStep] && (
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Next Direction</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {routeInfo.steps[navigationState.currentStep].instruction}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  In {routeInfo.steps[navigationState.currentStep].distance.toFixed(1)} km
                </div>
              </div>
            )}

            {/* Voice Control */}
            <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
              <span className="text-sm">Voice Announcements</span>
              <Button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                variant="ghost"
                size="sm"
              >
                {voiceEnabled ? (
                  <>
                    <Volume2 className="h-4 w-4 mr-1" />
                    On
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 mr-1" />
                    Off
                  </>
                )}
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-green-700 dark:text-green-300">
                <span>Progress</span>
                <span>
                  {Math.round(((routeInfo.distance - navigationState.distanceToNext) / routeInfo.distance) * 100)}%
                </span>
              </div>
              <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round(((routeInfo.distance - navigationState.distanceToNext) / routeInfo.distance) * 100)}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}