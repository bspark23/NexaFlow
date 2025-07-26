"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Sun,
  MapPin,
  RefreshCw,
  Search,
  Moon,
  SunIcon,
  Loader2,
  AlertCircle,
  Glasses,
  UmbrellaIcon,
  Clock,
  Lightbulb,
  Compass,
} from "lucide-react"
import { EcoTravelPlanner } from "./components/eco-travel-planner"

interface UVData {
  value: number
  lat: number
  lon: number
  date_iso: string
}

interface LocationData {
  city: string
  country: string
  lat: number
  lon: number
}

const UV_TIPS = {
  low: { text: "Low UV. You're safe to go out ☀️", color: "from-green-400 to-green-600", icon: Sun },
  moderate: { text: "Moderate UV. Use SPF 30+ 🧴", color: "from-yellow-400 to-orange-500", icon: UmbrellaIcon },
  high: { text: "High UV. Use SPF 50+, sunglasses, and hat 🕶️👒", color: "from-orange-500 to-red-500", icon: Glasses },
  veryHigh: {
    text: "Very High UV. Avoid going out from 10am to 4pm 🌞",
    color: "from-red-500 to-red-700",
    icon: AlertCircle,
  },
  extreme: { text: "Extreme UV. Stay indoors if possible 🚫☀️", color: "from-purple-600 to-red-800", icon: AlertCircle },
}

const FACTS = [
  "UV rays are strongest between 10 AM and 4 PM",
  "Snow, sand, and water can reflect UV rays and increase exposure",
  "Clouds don't completely block UV rays - you can still get sunburned on cloudy days",
  "UV exposure is cumulative - damage builds up over time",
  "SPF 30 blocks about 97% of UVB rays, while SPF 50 blocks about 98%",
  "Your eyes need protection too - UV can cause cataracts and other eye problems",
]

export default function EcoApp() {
  const [uvData, setUvData] = useState<UVData | null>(null)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [searchCity, setSearchCity] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentFact, setCurrentFact] = useState(0)
  const [activeTab, setActiveTab] = useState<"uv" | "travel">("uv")

  const API_KEY = "f68e14d9f5d8fffea3bd365b3a9f8e4d"

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("eco-dark-mode")
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode))
    }
  }, [])

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem("eco-dark-mode", JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const factTimer = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % FACTS.length)
    }, 10000)
    return () => clearInterval(factTimer)
  }, [])

  const getUVLevel = (uv: number) => {
    if (uv <= 2) return "low"
    if (uv <= 5) return "moderate"
    if (uv <= 7) return "high"
    if (uv <= 10) return "veryHigh"
    return "extreme"
  }

  const fetchUVData = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
      if (!response.ok) throw new Error("Failed to fetch UV data")
      return await response.json()
    } catch (err) {
      throw new Error("Unable to fetch UV data. Please try again.")
    }
  }

  const fetchLocationName = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`,
      )
      if (!response.ok) throw new Error("Failed to fetch location")
      const data = await response.json()
      if (data.length > 0) {
        return {
          city: data[0].name,
          country: data[0].country,
          lat,
          lon,
        }
      }
      throw new Error("Location not found")
    } catch (err) {
      return { city: "Unknown", country: "Location", lat, lon }
    }
  }

  const searchCityCoordinates = async (cityName: string) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`,
      )
      if (!response.ok) throw new Error("Failed to search city")
      const data = await response.json()
      if (data.length > 0) {
        return {
          city: data[0].name,
          country: data[0].country,
          lat: data[0].lat,
          lon: data[0].lon,
        }
      }
      throw new Error("City not found")
    } catch (err) {
      throw new Error("City not found. Please try a different search.")
    }
  }

  const getCurrentLocation = () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const [uvResponse, locationData] = await Promise.all([
            fetchUVData(latitude, longitude),
            fetchLocationName(latitude, longitude),
          ])

          setUvData(uvResponse)
          setLocation(locationData)
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        setError("Unable to get your location. Please enable location services or search for a city.")
        setLoading(false)
      },
    )
  }

  const handleCitySearch = async () => {
    if (!searchCity.trim()) return

    setLoading(true)
    setError(null)

    try {
      const locationData = await searchCityCoordinates(searchCity)
      const uvResponse = await fetchUVData(locationData.lat, locationData.lon)

      setUvData(uvResponse)
      setLocation(locationData)
      setSearchCity("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getCurrentLocation()
  }, [])

  const uvLevel = uvData ? getUVLevel(uvData.value) : "low"
  const uvInfo = UV_TIPS[uvLevel]
  const IconComponent = uvInfo.icon

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        darkMode
          ? "dark bg-gradient-to-br from-slate-900 via-emerald-900/20 to-teal-900/20"
          : "bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50"
      }`}
    >
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">🌱</span>
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Eco</h1>
              <p className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Sustainable Living</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            className={darkMode ? "text-white hover:bg-white/10" : "text-gray-600 hover:bg-black/5"}
          >
            {darkMode ? <SunIcon className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "uv" ? "default" : "outline"}
            onClick={() => setActiveTab("uv")}
            className={`flex-1 transition-all duration-300 ${
              activeTab === "uv"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg"
                : ""
            }`}
          >
            <Sun className="h-4 w-4 mr-2" />
            UV Index
          </Button>
          <Button
            variant={activeTab === "travel" ? "default" : "outline"}
            onClick={() => setActiveTab("travel")}
            className={`flex-1 transition-all duration-300 ${
              activeTab === "travel"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg"
                : ""
            }`}
          >
            <Compass className="h-4 w-4 mr-2" />
            Eco Travel
          </Button>
        </div>

        {activeTab === "uv" && (
          <div className="animate-in slide-in-from-right-2 duration-300">
            {/* Time and Date */}
            <Card
              className={`mb-4 transition-all duration-300 ${darkMode ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm" : "bg-white/70 backdrop-blur-sm border-white/50"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                  <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {currentTime.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Search */}
            <Card
              className={`mb-6 transition-all duration-300 ${darkMode ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm" : "bg-white/70 backdrop-blur-sm border-white/50"}`}
            >
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search city..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCitySearch()}
                    className={
                      darkMode ? "bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400" : "bg-white/80"
                    }
                  />
                  <Button
                    onClick={handleCitySearch}
                    disabled={loading}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Main UV Display */}
            <Card
              className={`mb-6 overflow-hidden transition-all duration-300 ${darkMode ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm" : "bg-white/70 backdrop-blur-sm border-white/50"}`}
            >
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2
                      className={`h-8 w-8 animate-spin mx-auto mb-4 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}
                    />
                    <p className={darkMode ? "text-gray-300" : "text-gray-600"}>Getting UV data...</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <AlertCircle className={`h-8 w-8 mx-auto mb-4 text-red-500`} />
                    <p className={`text-red-500 mb-4`}>{error}</p>
                    <Button onClick={getCurrentLocation} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : uvData && location ? (
                  <>
                    <div
                      className={`bg-gradient-to-r ${uvInfo.color} p-8 text-white text-center relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                      <IconComponent className="h-12 w-12 mx-auto mb-4 relative z-10" />
                      <div className="text-6xl font-bold mb-2 relative z-10">{uvData.value}</div>
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30 relative z-10">
                        UV Index
                      </Badge>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className={`h-4 w-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                        <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {location.city}, {location.country}
                        </span>
                      </div>
                      <p className={`text-lg font-medium mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {uvInfo.text}
                      </p>
                      <Button
                        onClick={getCurrentLocation}
                        variant="outline"
                        className="w-full bg-transparent hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>

            {/* Did You Know Section */}
            <Card
              className={`mb-6 transition-all duration-300 ${darkMode ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm" : "bg-white/70 backdrop-blur-sm border-white/50"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className={`h-5 w-5 mt-0.5 ${darkMode ? "text-yellow-400" : "text-yellow-600"}`} />
                  <div>
                    <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>Did you know?</h3>
                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{FACTS[currentFact]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* UV Scale Reference */}
            <Card
              className={`transition-all duration-300 ${darkMode ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm" : "bg-white/70 backdrop-blur-sm border-white/50"}`}
            >
              <CardContent className="p-4">
                <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>UV Index Scale</h3>
                <div className="space-y-2">
                  {[
                    { range: "0-2", level: "Low", color: "bg-green-500" },
                    { range: "3-5", level: "Moderate", color: "bg-yellow-500" },
                    { range: "6-7", level: "High", color: "bg-orange-500" },
                    { range: "8-10", level: "Very High", color: "bg-red-500" },
                    { range: "11+", level: "Extreme", color: "bg-purple-600" },
                  ].map((item) => (
                    <div key={item.range} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${item.color} shadow-sm`}></div>
                      <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {item.range}: {item.level}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "travel" && (
          <div className="animate-in slide-in-from-left-2 duration-300">
            <EcoTravelPlanner darkMode={darkMode} />
          </div>
        )}
      </div>
    </div>
  )
}
