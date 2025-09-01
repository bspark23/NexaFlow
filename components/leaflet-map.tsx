"use client"

import { useEffect, useRef } from "react"

// Dynamic import to handle missing leaflet package gracefully
let L: any = null
try {
  L = require("leaflet")
  require("leaflet/dist/leaflet.css")
} catch (error) {
  console.warn("Leaflet not installed. Please run: npm install leaflet @types/leaflet")
}

  // Fix for default markers in Leaflet with Next.js
  if (L && L.Icon && L.Icon.Default) {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    })
  }

interface LocationCoords {
  lat: number
  lng: number
  address?: string
}

interface RouteInfo {
  distance: number
  duration: number
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

interface LeafletMapProps {
  currentLocation: LocationCoords | null
  destination: LocationCoords | null
  isNavigating: boolean
  routeInfo?: RouteInfo | null
  navigationState?: NavigationState
  routeGeometry?: [number, number][] | null
}

export default function LeafletMap({ 
  currentLocation, 
  destination, 
  isNavigating, 
  routeInfo, 
  navigationState,
  routeGeometry 
}: LeafletMapProps) {
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const routeRef = useRef<any>(null)

  // Show fallback if Leaflet is not available
  if (!L) {
    return (
      <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">🗺️</div>
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Map Package Required</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Please install Leaflet to see the interactive map:
            </p>
            <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded mt-2 inline-block">
              npm install leaflet @types/leaflet
            </code>
          </div>
          {currentLocation && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Current: {currentLocation.address}
            </div>
          )}
          {destination && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Destination: {destination.address}
            </div>
          )}
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map with better default location
      const initialLat = currentLocation?.lat || 51.505
      const initialLng = currentLocation?.lng || -0.09
      const map = L.map("leaflet-map").setView([initialLat, initialLng], 13)
      
      // Add English-language tile layer with better styling
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
        tileSize: 256,
        zoomOffset: 0,
        detectRetina: true,
        // Force English language for map labels
        language: 'en'
      }).addTo(map)
      
      // Add scale control
      L.control.scale({
        metric: true,
        imperial: false,
        position: 'bottomleft'
      }).addTo(map)
      
      mapRef.current = map
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [currentLocation])

  useEffect(() => {
    if (!mapRef.current) return

    const bounds = L?.latLngBounds ? L.latLngBounds([]) : null

    // Create custom icons for different markers
    const createCustomIcon = (color: string, symbol: string) => {
      if (!L.divIcon) return null
      return L.divIcon({
        html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 14px;">${symbol}</div>`,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    }

    // Handle current location marker - update position if exists, create if not
    if (currentLocation) {
      let currentMarker = markersRef.current.find(m => m.options?.icon?.options?.html?.includes('📍'))
      
      if (currentMarker) {
        // Update existing marker position
        currentMarker.setLatLng([currentLocation.lat, currentLocation.lng])
        currentMarker.getPopup()?.setContent(`📍 ${currentLocation.address || "Current Location"}`)
      } else {
        // Create new current location marker
        const currentIcon = createCustomIcon('#10b981', '📍')
        currentMarker = currentIcon 
          ? L.marker([currentLocation.lat, currentLocation.lng], { icon: currentIcon })
          : L.marker([currentLocation.lat, currentLocation.lng])
        
        currentMarker
          .addTo(mapRef.current)
          .bindPopup(`📍 ${currentLocation.address || "Current Location"}`)
        
        markersRef.current.push(currentMarker)
      }
      bounds?.extend([currentLocation.lat, currentLocation.lng])
    }

    // Handle destination marker - update position if exists, create if not
    if (destination) {
      let destMarker = markersRef.current.find(m => m.options?.icon?.options?.html?.includes('🎯'))
      
      if (destMarker) {
        // Update existing destination marker position
        destMarker.setLatLng([destination.lat, destination.lng])
        destMarker.getPopup()?.setContent(`🎯 ${destination.address || "Destination"}`)
      } else {
        // Create new destination marker
        const destIcon = createCustomIcon('#ef4444', '🎯')
        destMarker = destIcon
          ? L.marker([destination.lat, destination.lng], { icon: destIcon })
          : L.marker([destination.lat, destination.lng])
        
        destMarker
          .addTo(mapRef.current)
          .bindPopup(`🎯 ${destination.address || "Destination"}`)
        
        markersRef.current.push(destMarker)
      }
      bounds?.extend([destination.lat, destination.lng])
    }

    // Handle route - only recreate if route data changes significantly
    if (currentLocation && destination) {
      let routeCoordinates: [number, number][] = []
      
      // Use actual route geometry if available (from OSRM)
      if (routeGeometry && routeGeometry.length > 0) {
        routeCoordinates = routeGeometry
      } else if (routeInfo && routeInfo.steps.length > 0) {
        // Use detailed route steps
        routeCoordinates = [
          [currentLocation.lat, currentLocation.lng],
          ...routeInfo.steps.map(step => step.coordinates)
        ]
      } else {
        // Simple direct route
        routeCoordinates = [
          [currentLocation.lat, currentLocation.lng],
          [destination.lat, destination.lng]
        ]
      }

      // Remove existing route if it exists
      if (routeRef.current) {
        routeRef.current.remove()
        routeRef.current = null
      }

      // Draw the route line with enhanced styling
      const routeLine = L.polyline(routeCoordinates, {
        color: isNavigating ? '#10b981' : '#6366f1',
        weight: isNavigating ? 6 : 4,
        opacity: 0.9,
        dashArray: isNavigating ? undefined : '10, 5',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapRef.current)
      
      routeRef.current = routeLine
      bounds?.extend(routeLine.getBounds())
    }

    // Handle real-time navigation indicator
    if (isNavigating && currentLocation) {
      // Remove any existing navigation indicators
      const existingNavMarkers = markersRef.current.filter(m => m.options?.icon?.options?.html?.includes('🧭'))
      existingNavMarkers.forEach(marker => {
        marker.remove()
        markersRef.current = markersRef.current.filter(m => m !== marker)
      })

      // Add new real-time navigation indicator
      const navIcon = createCustomIcon('#10b981', '🧭')
      if (navIcon) {
        const navMarker = L.marker([currentLocation.lat, currentLocation.lng], { 
          icon: navIcon,
          zIndexOffset: 1000 // Ensure it's on top
        })
          .addTo(mapRef.current)
          .bindPopup(`
            <div style="text-align: center; font-family: system-ui;">
              <strong style="color: #10b981;">🧭 You are here</strong><br/>
              <small>Real-time GPS location</small><br/>
              <small>${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}</small>
            </div>
          `)
        
        markersRef.current.push(navMarker)
      }
      
      // Smoothly pan map to follow user's movement
      if (currentLocation && mapRef.current) {
        mapRef.current.panTo([currentLocation.lat, currentLocation.lng], {
          animate: true,
          duration: 1,
          easeLinearity: 0.25
        })
      }
    }

    // Fit map to show all markers
    if (bounds?.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [20, 20] })
    } else if (currentLocation) {
      mapRef.current.setView([currentLocation.lat, currentLocation.lng], 13)
    }
  }, [currentLocation, destination, isNavigating, routeInfo, navigationState, routeGeometry])

  return (
    <div 
      id="leaflet-map" 
      className="h-[700px] w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
      style={{ height: "700px", minHeight: "700px" }}
    />
  )
}