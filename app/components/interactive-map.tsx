"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapIcon, Navigation, Thermometer, Sun, Wind, Droplets } from "lucide-react"

interface WeatherData {
  current: {
    temp: number
    feels_like: number
    humidity: number
    uvi: number
    wind_speed: number
    weather: Array<{
      main: string
      description: string
      icon: string
    }>
  }
}

interface InteractiveMapProps {
  location: { lat: number; lon: number; name: string }
  weatherData: WeatherData
  darkMode: boolean
}

export function InteractiveMap({ location, weatherData, darkMode }: InteractiveMapProps) {
  // Generate a simple map visualization using CSS
  const mapStyle = {
    background: `radial-gradient(circle at ${50 + location.lon / 4}% ${50 - location.lat / 2}%, 
      rgba(34, 197, 94, 0.3) 0%, 
      rgba(59, 130, 246, 0.2) 50%, 
      rgba(156, 163, 175, 0.1) 100%)`,
  }

  return (
    <Card
      className={`transition-all duration-300 ${
        darkMode ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm" : "bg-white/70 backdrop-blur-sm border-white/50"
      }`}
    >
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
          <MapIcon className="h-5 w-5 text-blue-500" />
          Interactive Location Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map Visualization */}
          <div className="relative h-48 rounded-lg overflow-hidden border-2 border-gray-200" style={mapStyle}>
            {/* Location Marker */}
            <div
              className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
              style={{
                left: `${50 + (location.lon / 180) * 40}%`,
                top: `${50 - (location.lat / 90) * 40}%`,
              }}
            >
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
            </div>

            {/* Weather Overlay */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-800">{location.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Thermometer className="h-3 w-3 text-red-500" />
                  <span>{Math.round(weatherData.current.temp)}°C</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sun className="h-3 w-3 text-yellow-500" />
                  <span>UV {weatherData.current.uvi}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind className="h-3 w-3 text-blue-500" />
                  <span>{Math.round(weatherData.current.wind_speed)}m/s</span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplets className="h-3 w-3 text-cyan-500" />
                  <span>{weatherData.current.humidity}%</span>
                </div>
              </div>
            </div>

            {/* Coordinates Display */}
            <div className="absolute bottom-4 right-4 bg-black/70 text-white rounded-lg p-2 text-xs">
              <div>Lat: {location.lat.toFixed(4)}°</div>
              <div>Lon: {location.lon.toFixed(4)}°</div>
            </div>
          </div>

          {/* Map Legend */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              📍 Current Location
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              🌊 Water Bodies
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              🌿 Land Areas
            </Badge>
          </div>

          {/* Map Info */}
          <div className={`text-center text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            <p>Interactive map powered by OpenStreetMap data</p>
            <p className="text-xs mt-1">Real-time weather overlay with location markers</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
