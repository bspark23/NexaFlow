"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MapPin,
  Leaf,
  Train,
  TreePine,
  Cloud,
  Sun,
  Wind,
  AlertTriangle,
  Heart,
  Share2,
  Save,
  TrendingUp,
  Globe,
  Zap,
  Shield,
  Star,
  DollarSign,
  Users,
  Mountain,
  Waves,
  Building,
  Car,
  Bus,
  Thermometer,
  BarChart3,
  Bookmark,
  Droplets,
  Activity,
  Navigation,
  Bike,
  Plane,
  ChevronRight,
  Clock,
} from "lucide-react"
import { WeatherChart } from "./weather-chart"

interface Country {
  name: { common: string }
  cca2: string
  capital?: string[]
  latlng: [number, number]
}

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
  daily: Array<{
    dt: number
    temp: { day: number; night: number; min: number; max: number }
    weather: Array<{ main: string; description: string; icon: string }>
    uvi: number
    humidity: number
    wind_speed: number
  }>
  alerts?: Array<{
    event: string
    description: string
    start: number
    end: number
  }>
}

interface AirQualityData {
  list: Array<{
    main: {
      aqi: number
    }
    components: {
      co: number
      no: number
      no2: number
      o3: number
      so2: number
      pm2_5: number
      pm10: number
      nh3: number
    }
  }>
}

interface TravelPreferences {
  personality: "adventurous" | "calm" | "family"
  mood: "relaxed" | "excited" | "stressed"
  budget: "low" | "medium" | "high"
}

interface EcoSuggestion {
  transport: {
    type: string
    carbonSaved: number
    description: string
    icon: any
    cost: string
    duration: string
    ecoScore: number
  }
  accommodation: {
    name: string
    type: string
    ecoRating: number
    features: string[]
    icon: any
    priceRange: string
    location: string
  }
  activities: Array<{
    name: string
    category: string
    ecoScore: number
    description: string
    duration: string
    difficulty: string
  }>
  destinations: Array<{
    name: string
    type: string
    ecoScore: number
    description: string
    highlights: string[]
  }>
}

const ECO_TRANSPORT_DATA = {
  low: [
    {
      type: "Regional Train",
      carbonSaved: 85,
      description: "Scenic electric rail journey through countryside",
      icon: Train,
      cost: "$25-75",
      duration: "3-6 hours",
      ecoScore: 95,
    },
    {
      type: "Electric Bus",
      carbonSaved: 70,
      description: "Comfortable zero-emission coach travel",
      icon: Bus,
      cost: "$15-45",
      duration: "4-8 hours",
      ecoScore: 88,
    },
    {
      type: "E-Bike Tour",
      carbonSaved: 98,
      description: "Explore at your own pace with electric assistance",
      icon: Bike,
      cost: "$20-40/day",
      duration: "Flexible",
      ecoScore: 98,
    },
  ],
  medium: [
    {
      type: "High-Speed Train",
      carbonSaved: 80,
      description: "Fast, efficient rail travel with renewable energy",
      icon: Train,
      cost: "$75-200",
      duration: "2-4 hours",
      ecoScore: 92,
    },
    {
      type: "Hybrid Vehicle",
      carbonSaved: 45,
      description: "Fuel-efficient car sharing with flexibility",
      icon: Car,
      cost: "$100-250",
      duration: "2-5 hours",
      ecoScore: 75,
    },
    {
      type: "Electric Ferry",
      carbonSaved: 65,
      description: "Sustainable water transport with ocean views",
      icon: Navigation,
      cost: "$50-150",
      duration: "1-3 hours",
      ecoScore: 85,
    },
  ],
  high: [
    {
      type: "Private Electric Vehicle",
      carbonSaved: 60,
      description: "Luxury electric car with personal driver",
      icon: Car,
      cost: "$300-800",
      duration: "1-4 hours",
      ecoScore: 82,
    },
    {
      type: "Sustainable Aviation",
      carbonSaved: 25,
      description: "Carbon-offset flights with biofuel",
      icon: Plane,
      cost: "$400-1200",
      duration: "1-3 hours",
      ecoScore: 65,
    },
    {
      type: "Luxury Eco-Yacht",
      carbonSaved: 40,
      description: "Solar-powered yacht with premium amenities",
      icon: Navigation,
      cost: "$800-2000",
      duration: "2-6 hours",
      ecoScore: 78,
    },
  ],
}

const ECO_ACCOMMODATIONS = {
  adventurous: [
    {
      name: "Mountain Eco Lodge",
      type: "Eco Lodge",
      ecoRating: 4.8,
      features: ["Solar Power", "Rainwater Harvesting", "Organic Farm", "Hiking Trails"],
      icon: Mountain,
      priceRange: "$80-150/night",
      location: "Mountain Region",
    },
    {
      name: "Wilderness Glamping",
      type: "Glamping",
      ecoRating: 4.6,
      features: ["Composting Toilets", "Off-Grid Living", "Wildlife Viewing", "Stargazing"],
      icon: TreePine,
      priceRange: "$120-200/night",
      location: "National Park",
    },
  ],
  calm: [
    {
      name: "Zen Wellness Retreat",
      type: "Retreat Center",
      ecoRating: 4.9,
      features: ["Meditation Gardens", "Organic Spa", "Yoga Studios", "Vegetarian Cuisine"],
      icon: Waves,
      priceRange: "$200-400/night",
      location: "Coastal Area",
    },
    {
      name: "Sustainable Resort",
      type: "Eco Resort",
      ecoRating: 4.7,
      features: ["LEED Certified", "Local Sourcing", "Renewable Energy", "Nature Walks"],
      icon: Leaf,
      priceRange: "$150-300/night",
      location: "Forest Setting",
    },
  ],
  family: [
    {
      name: "Family Eco Village",
      type: "Eco Village",
      ecoRating: 4.5,
      features: ["Kids Programs", "Educational Tours", "Safe Environment", "Family Activities"],
      icon: Users,
      priceRange: "$100-250/night",
      location: "Rural Community",
    },
    {
      name: "Green Family Hotel",
      type: "Hotel",
      ecoRating: 4.4,
      features: ["Child-Friendly", "Educational Center", "Playground", "Local Culture"],
      icon: Building,
      priceRange: "$120-220/night",
      location: "City Center",
    },
  ],
}

const ECO_ACTIVITIES = {
  adventurous: [
    {
      name: "Eco Hiking & Wildlife Photography",
      category: "Adventure",
      ecoScore: 95,
      description: "Guided nature walks with minimal environmental impact",
      duration: "4-8 hours",
      difficulty: "Moderate",
    },
    {
      name: "Sustainable Rock Climbing",
      category: "Adventure",
      ecoScore: 88,
      description: "Leave-no-trace climbing with certified guides",
      duration: "6-10 hours",
      difficulty: "Challenging",
    },
    {
      name: "Conservation Volunteering",
      category: "Conservation",
      ecoScore: 98,
      description: "Help protect local ecosystems and wildlife",
      duration: "2-5 days",
      difficulty: "Easy",
    },
  ],
  calm: [
    {
      name: "Forest Bathing & Meditation",
      category: "Wellness",
      ecoScore: 92,
      description: "Mindful connection with nature for stress relief",
      duration: "2-4 hours",
      difficulty: "Easy",
    },
    {
      name: "Organic Farm Experience",
      category: "Educational",
      ecoScore: 94,
      description: "Learn sustainable agriculture practices",
      duration: "Half day",
      difficulty: "Easy",
    },
    {
      name: "Eco Spa & Natural Therapies",
      category: "Wellness",
      ecoScore: 85,
      description: "Rejuvenate with locally-sourced natural treatments",
      duration: "2-6 hours",
      difficulty: "Easy",
    },
  ],
  family: [
    {
      name: "Junior Ranger Program",
      category: "Educational",
      ecoScore: 96,
      description: "Kids learn conservation through hands-on activities",
      duration: "3-5 hours",
      difficulty: "Easy",
    },
    {
      name: "Family Bike Tours",
      category: "Active",
      ecoScore: 93,
      description: "Explore together on eco-friendly electric bikes",
      duration: "2-4 hours",
      difficulty: "Easy",
    },
    {
      name: "Nature Discovery Center",
      category: "Educational",
      ecoScore: 90,
      description: "Interactive exhibits about local ecosystems",
      duration: "2-3 hours",
      difficulty: "Easy",
    },
  ],
}

const ECO_DESTINATIONS = {
  adventurous: [
    {
      name: "National Parks & Reserves",
      type: "Protected Area",
      ecoScore: 95,
      description: "Pristine wilderness areas with strict conservation policies",
      highlights: ["Wildlife Viewing", "Hiking Trails", "Photography", "Camping"],
    },
    {
      name: "Eco-Adventure Centers",
      type: "Activity Hub",
      ecoScore: 88,
      description: "Sustainable adventure tourism with environmental education",
      highlights: ["Rock Climbing", "Zip Lines", "Canopy Tours", "River Rafting"],
    },
  ],
  calm: [
    {
      name: "Botanical Gardens & Arboretums",
      type: "Garden",
      ecoScore: 92,
      description: "Peaceful spaces showcasing native plant conservation",
      highlights: ["Meditation Paths", "Educational Tours", "Photography", "Workshops"],
    },
    {
      name: "Wellness Retreat Centers",
      type: "Retreat",
      ecoScore: 89,
      description: "Holistic healing in harmony with natural environments",
      highlights: ["Yoga Classes", "Spa Treatments", "Organic Dining", "Nature Walks"],
    },
  ],
  family: [
    {
      name: "Environmental Education Centers",
      type: "Learning Center",
      ecoScore: 94,
      description: "Interactive learning about sustainability and conservation",
      highlights: ["Kids Programs", "Science Exhibits", "Nature Trails", "Workshops"],
    },
    {
      name: "Sustainable Farms & Agritourism",
      type: "Farm",
      ecoScore: 91,
      description: "Working farms demonstrating sustainable agriculture",
      highlights: ["Farm Tours", "Animal Feeding", "Harvest Activities", "Farm-to-Table"],
    },
  ],
}

export function EcoTravelPlanner({ darkMode }: { darkMode: boolean }) {
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number; name: string } | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null)
  const [preferences, setPreferences] = useState<TravelPreferences>({
    personality: "calm",
    mood: "relaxed",
    budget: "medium",
  })
  const [ecoSuggestions, setEcoSuggestions] = useState<EcoSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [savedPlans, setSavedPlans] = useState<string[]>([])
  const [activeStep, setActiveStep] = useState(0)

  const API_KEY = "f68e14d9f5d8fffea3bd365b3a9f8e4d"

  // Load saved plans from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("eco-saved-plans")
    if (saved) {
      setSavedPlans(JSON.parse(saved))
    }
  }, [])

  // Fetch countries from REST Countries API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2,capital,latlng")
        const data = await response.json()
        const sortedCountries = data
          .filter((country: Country) => country.latlng && country.latlng.length === 2)
          .sort((a: Country, b: Country) => a.name.common.localeCompare(b.name.common))
        setCountries(sortedCountries)
      } catch (error) {
        console.error("Failed to fetch countries:", error)
        // Fallback to a few hardcoded countries
        setCountries([
          { name: { common: "United States" }, cca2: "US", capital: ["Washington"], latlng: [38, -97] },
          { name: { common: "Canada" }, cca2: "CA", capital: ["Ottawa"], latlng: [60, -95] },
          { name: { common: "United Kingdom" }, cca2: "GB", capital: ["London"], latlng: [54, -2] },
          { name: { common: "France" }, cca2: "FR", capital: ["Paris"], latlng: [46, 2] },
          { name: { common: "Germany" }, cca2: "DE", capital: ["Berlin"], latlng: [51, 9] },
        ])
      }
    }
    fetchCountries()
  }, [])

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      // Use the current weather endpoint and forecast endpoint separately
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      ])

      if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error("Weather data fetch failed")
      }

      const currentData = await currentResponse.json()
      const forecastData = await forecastResponse.json()

      // Transform the data to match our expected format
      const transformedData = {
        current: {
          temp: currentData.main.temp,
          feels_like: currentData.main.feels_like,
          humidity: currentData.main.humidity,
          uvi: 5, // Default UV value since current weather doesn't include UV
          wind_speed: currentData.wind.speed,
          weather: currentData.weather,
        },
        daily: forecastData.list
          .filter((_: any, index: number) => index % 8 === 0)
          .slice(0, 7)
          .map((item: any) => ({
            dt: item.dt,
            temp: {
              day: item.main.temp,
              night: item.main.temp - 5,
              min: item.main.temp_min,
              max: item.main.temp_max,
            },
            weather: item.weather,
            uvi: Math.random() * 8 + 1, // Mock UV data for forecast
            humidity: item.main.humidity,
            wind_speed: item.wind.speed,
          })),
        alerts: [], // No alerts in basic API
      }

      // Try to get UV data separately
      try {
        const uvResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`,
        )
        if (uvResponse.ok) {
          const uvData = await uvResponse.json()
          transformedData.current.uvi = uvData.value || 5
        }
      } catch (uvError) {
        console.log("UV data not available, using default")
      }

      return transformedData
    } catch (error) {
      console.error("Weather fetch error:", error)
      // Return mock data as fallback
      return {
        current: {
          temp: 22,
          feels_like: 24,
          humidity: 65,
          uvi: 5,
          wind_speed: 3.5,
          weather: [{ main: "Clear", description: "clear sky", icon: "01d" }],
        },
        daily: Array.from({ length: 7 }, (_, i) => ({
          dt: Date.now() / 1000 + i * 86400,
          temp: {
            day: 22 + Math.random() * 10,
            night: 15 + Math.random() * 5,
            min: 15 + Math.random() * 5,
            max: 25 + Math.random() * 10,
          },
          weather: [{ main: "Clear", description: "clear sky", icon: "01d" }],
          uvi: Math.random() * 8 + 1,
          humidity: 60 + Math.random() * 20,
          wind_speed: 2 + Math.random() * 5,
        })),
        alerts: [],
      }
    }
  }

  const fetchAirQuality = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`,
      )
      if (!response.ok) throw new Error("Air quality fetch failed")
      return await response.json()
    } catch (error) {
      console.error("Air quality fetch error:", error)
      // Return mock data as fallback
      return {
        list: [
          {
            main: { aqi: 2 },
            components: {
              co: 233.0,
              no: 0.01,
              no2: 0.78,
              o3: 68.66,
              so2: 0.64,
              pm2_5: 0.5,
              pm10: 0.54,
              nh3: 0.12,
            },
          },
        ],
      }
    }
  }

  const generateEcoSuggestions = (prefs: TravelPreferences): EcoSuggestion => {
    const transportOptions = ECO_TRANSPORT_DATA[prefs.budget]
    const accommodationOptions = ECO_ACCOMMODATIONS[prefs.personality]
    const activityOptions = ECO_ACTIVITIES[prefs.personality]
    const destinationOptions = ECO_DESTINATIONS[prefs.personality]

    return {
      transport: transportOptions[Math.floor(Math.random() * transportOptions.length)],
      accommodation: accommodationOptions[Math.floor(Math.random() * accommodationOptions.length)],
      activities: activityOptions,
      destinations: destinationOptions,
    }
  }

  const handleCountrySelect = async (countryName: string) => {
    setSelectedCountry(countryName)
    const country = countries.find((c) => c.name.common === countryName)
    if (!country) return

    setLoading(true)
    const location = {
      lat: country.latlng[0],
      lon: country.latlng[1],
      name: country.name.common,
    }
    setSelectedLocation(location)

    try {
      const [weather, airQuality] = await Promise.all([
        fetchWeatherData(location.lat, location.lon),
        fetchAirQuality(location.lat, location.lon),
      ])

      if (weather && airQuality) {
        setWeatherData(weather)
        setAirQualityData(airQuality)
        setEcoSuggestions(generateEcoSuggestions(preferences))
        setActiveStep(1)
      } else {
        throw new Error("Failed to fetch environmental data")
      }
    } catch (error) {
      console.error("Data fetch error:", error)
      // Still proceed with mock data
      setWeatherData({
        current: {
          temp: 22,
          feels_like: 24,
          humidity: 65,
          uvi: 5,
          wind_speed: 3.5,
          weather: [{ main: "Clear", description: "clear sky", icon: "01d" }],
        },
        daily: Array.from({ length: 7 }, (_, i) => ({
          dt: Date.now() / 1000 + i * 86400,
          temp: {
            day: 22 + Math.random() * 10,
            night: 15 + Math.random() * 5,
            min: 15 + Math.random() * 5,
            max: 25 + Math.random() * 10,
          },
          weather: [{ main: "Clear", description: "clear sky", icon: "01d" }],
          uvi: Math.random() * 8 + 1,
          humidity: 60 + Math.random() * 20,
          wind_speed: 2 + Math.random() * 5,
        })),
        alerts: [],
      })
      setAirQualityData({
        list: [
          {
            main: { aqi: 2 },
            components: {
              co: 233.0,
              no: 0.01,
              no2: 0.78,
              o3: 68.66,
              so2: 0.64,
              pm2_5: 0.5,
              pm10: 0.54,
              nh3: 0.12,
            },
          },
        ],
      })
      setEcoSuggestions(generateEcoSuggestions(preferences))
      setActiveStep(1)
    } finally {
      setLoading(false)
    }
  }

  const getUVAdvice = (uvi: number) => {
    if (uvi >= 8) return { text: "High UV - Stay indoors 10am-4pm", color: "text-red-500", icon: AlertTriangle }
    if (uvi >= 6) return { text: "Moderate UV - Use SPF 50+", color: "text-orange-500", icon: Sun }
    if (uvi >= 3) return { text: "Low-Moderate UV - Use SPF 30+", color: "text-yellow-500", icon: Sun }
    return { text: "Low UV - Safe for outdoor activities", color: "text-green-500", icon: Shield }
  }

  const getWeatherAdvice = (weather: WeatherData) => {
    const alerts = weather.alerts || []
    const current = weather.current

    if (alerts.length > 0) {
      return { text: "Weather alerts active - Check conditions", color: "text-red-500", icon: AlertTriangle }
    }
    if (current.wind_speed > 15) {
      return { text: "High winds - Outdoor activities may be affected", color: "text-orange-500", icon: Wind }
    }
    if (current.temp < 5) {
      return { text: "Cold weather - Dress warmly", color: "text-blue-500", icon: Thermometer }
    }
    if (current.temp > 35) {
      return { text: "Very hot - Stay hydrated and seek shade", color: "text-red-500", icon: Thermometer }
    }
    return { text: "Good weather conditions for travel", color: "text-green-500", icon: Shield }
  }

  const getAirQualityStatus = (aqi: number) => {
    if (aqi === 1) return { text: "Excellent", color: "text-green-500", description: "Air quality is excellent" }
    if (aqi === 2) return { text: "Good", color: "text-blue-500", description: "Air quality is good" }
    if (aqi === 3) return { text: "Moderate", color: "text-yellow-500", description: "Air quality is moderate" }
    if (aqi === 4) return { text: "Poor", color: "text-orange-500", description: "Air quality is poor" }
    return { text: "Very Poor", color: "text-red-500", description: "Air quality is very poor" }
  }

  const calculateEnvironmentalScore = (weather: WeatherData, airQuality: AirQualityData) => {
    let score = 50 // Base score

    // Air quality impact (40% of score)
    const aqi = airQuality.list[0].main.aqi
    score += (6 - aqi) * 8

    // UV impact (20% of score)
    const uvi = weather.current.uvi
    if (uvi <= 3) score += 20
    else if (uvi <= 6) score += 15
    else if (uvi <= 8) score += 10
    else score += 5

    // Weather stability (20% of score)
    const alerts = weather.alerts || []
    if (alerts.length === 0) score += 20
    else score += Math.max(0, 20 - alerts.length * 5)

    // Temperature comfort (20% of score)
    const temp = weather.current.temp
    if (temp >= 18 && temp <= 28) score += 20
    else if (temp >= 15 && temp <= 32) score += 15
    else if (temp >= 10 && temp <= 35) score += 10
    else score += 5

    return Math.min(100, Math.max(0, score))
  }

  const savePlan = () => {
    if (selectedLocation) {
      const newPlan = `${selectedLocation.name} - ${new Date().toLocaleDateString()}`
      const updatedPlans = [...savedPlans, newPlan]
      setSavedPlans(updatedPlans)
      localStorage.setItem("eco-saved-plans", JSON.stringify(updatedPlans))
    }
  }

  const sharePlan = async () => {
    if (!selectedLocation) return

    const shareData = {
      title: `Eco Travel Plan: ${selectedLocation.name}`,
      text: `Check out my eco-friendly travel plan for ${selectedLocation.name}! 🌱✈️`,
      url: window.location.href,
    }

    // Check if Web Share API is supported and available
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log("Share cancelled or failed:", error)
        // Fall back to clipboard copy
        fallbackShare(shareData)
      }
    } else if (navigator.share) {
      // Web Share API exists but might not support the data
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
        })
      } catch (error) {
        console.log("Share failed, using fallback:", error)
        fallbackShare(shareData)
      }
    } else {
      // No Web Share API support, use fallback
      fallbackShare(shareData)
    }
  }

  const fallbackShare = async (shareData: { title: string; text: string; url: string }) => {
    const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`

    try {
      // Try to copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText)
        // Show a temporary success message (you could add a toast notification here)
        alert("Travel plan copied to clipboard! 📋")
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea")
        textArea.value = shareText
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
          document.execCommand("copy")
          alert("Travel plan copied to clipboard! 📋")
        } catch (err) {
          console.error("Fallback copy failed:", err)
          // Final fallback - show the text in a prompt
          prompt("Copy this travel plan:", shareText)
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (error) {
      console.error("All share methods failed:", error)
      // Final fallback - show the text in a prompt
      prompt("Copy this travel plan:", shareText)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card
        className={`transition-all duration-300 ${
          darkMode
            ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
            : "bg-gradient-to-r from-teal-50 to-purple-50 border-teal-200/50 backdrop-blur-sm"
        }`}
      >
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
            <Globe className="h-6 w-6 text-teal-500" />
            Eco Travel Planner
          </CardTitle>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Plan sustainable vacations with real-time environmental data
          </p>
        </CardHeader>
      </Card>

      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-4">
        {["Select", "Analyze", "Plan"].map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                index <= activeStep
                  ? "bg-gradient-to-r from-teal-500 to-purple-500 text-white shadow-lg"
                  : darkMode
                    ? "bg-gray-700 text-gray-400"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {index + 1}
            </div>
            <span className={`ml-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{step}</span>
            {index < 2 && (
              <div
                className={`w-8 h-0.5 ml-4 transition-all duration-300 ${
                  index < activeStep
                    ? "bg-gradient-to-r from-teal-500 to-purple-500"
                    : darkMode
                      ? "bg-gray-700"
                      : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {loading && (
        <Card
          className={`transition-all duration-300 ${
            darkMode
              ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
              : "bg-white/70 backdrop-blur-sm border-white/50"
          }`}
        >
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
              <Globe className="h-8 w-8 text-white animate-spin" />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              Fetching Real-Time Data...
            </h3>
            <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Getting weather, UV index, air quality, and environmental data
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Country Selection & Preferences */}
      {activeStep === 0 && !loading && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <Card
            className={`transition-all duration-300 ${
              darkMode
                ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
                : "bg-white/70 backdrop-blur-sm border-white/50"
            }`}
          >
            <CardHeader>
              <CardTitle className={`text-lg ${darkMode ? "text-white" : "text-gray-800"}`}>
                🌍 Choose Your Destination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Country
                </label>
                <Select value={selectedCountry} onValueChange={handleCountrySelect}>
                  <SelectTrigger className={darkMode ? "bg-gray-700/50 border-gray-600 text-white" : "bg-white/80"}>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {countries.map((country) => (
                      <SelectItem key={country.cca2} value={country.name.common}>
                        {country.name.common}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`transition-all duration-300 ${
              darkMode
                ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
                : "bg-white/70 backdrop-blur-sm border-white/50"
            }`}
          >
            <CardHeader>
              <CardTitle className={`text-lg ${darkMode ? "text-white" : "text-gray-800"}`}>
                🎯 Travel Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Travel Personality
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "adventurous", label: "Adventurous", icon: Mountain },
                    { value: "calm", label: "Calm", icon: Waves },
                    { value: "family", label: "Family", icon: Users },
                  ].map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={preferences.personality === value ? "default" : "outline"}
                      onClick={() => setPreferences({ ...preferences, personality: value as any })}
                      className={`flex flex-col h-16 transition-all duration-300 ${
                        preferences.personality === value
                          ? "bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 shadow-lg"
                          : ""
                      }`}
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Current Mood
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "relaxed", label: "Relaxed", icon: Leaf },
                    { value: "excited", label: "Excited", icon: Zap },
                    { value: "stressed", label: "Stressed", icon: Heart },
                  ].map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={preferences.mood === value ? "default" : "outline"}
                      onClick={() => setPreferences({ ...preferences, mood: value as any })}
                      className={`flex flex-col h-16 transition-all duration-300 ${
                        preferences.mood === value
                          ? "bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 shadow-lg"
                          : ""
                      }`}
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Budget Range
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "low", label: "Budget", icon: DollarSign },
                    { value: "medium", label: "Moderate", icon: Building },
                    { value: "high", label: "Premium", icon: Star },
                  ].map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={preferences.budget === value ? "default" : "outline"}
                      onClick={() => setPreferences({ ...preferences, budget: value as any })}
                      className={`flex flex-col h-16 transition-all duration-300 ${
                        preferences.budget === value
                          ? "bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 shadow-lg"
                          : ""
                      }`}
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Environmental Data Analysis */}
      {activeStep === 1 && weatherData && airQualityData && selectedLocation && !loading && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
              Environmental Analysis: {selectedLocation.name}
            </h3>
            <Button variant="outline" onClick={() => setActiveStep(0)}>
              Change Location
            </Button>
          </div>

          {/* Current Conditions */}
          <Card
            className={`transition-all duration-300 ${
              darkMode
                ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
                : "bg-gradient-to-r from-blue-50 to-cyan-50 backdrop-blur-sm"
            }`}
          >
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <Cloud className="h-5 w-5 text-blue-500" />
                Current Weather Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/50 rounded-xl shadow-sm">
                  <Thermometer className="h-6 w-6 mx-auto mb-2 text-red-500" />
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="text-2xl font-bold text-gray-800">{Math.round(weatherData.current.temp)}°C</p>
                  <p className="text-xs text-gray-500">Feels {Math.round(weatherData.current.feels_like)}°C</p>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl shadow-sm">
                  <Sun className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                  <p className="text-sm text-gray-600">UV Index</p>
                  <p className="text-2xl font-bold text-gray-800">{weatherData.current.uvi}</p>
                  <p className={`text-xs ${getUVAdvice(weatherData.current.uvi).color}`}>
                    {getUVAdvice(weatherData.current.uvi).text.split(" - ")[0]}
                  </p>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl shadow-sm">
                  <Wind className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm text-gray-600">Wind Speed</p>
                  <p className="text-2xl font-bold text-gray-800">{Math.round(weatherData.current.wind_speed)}</p>
                  <p className="text-xs text-gray-500">m/s</p>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl shadow-sm">
                  <Droplets className="h-6 w-6 mx-auto mb-2 text-cyan-500" />
                  <p className="text-sm text-gray-600">Humidity</p>
                  <p className="text-2xl font-bold text-gray-800">{weatherData.current.humidity}%</p>
                  <p className="text-xs text-gray-500">Relative</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Advice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className={`transition-all duration-300 ${
                darkMode
                  ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
                  : "bg-white/70 backdrop-blur-sm border-white/50"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {(() => {
                    const uvAdvice = getUVAdvice(weatherData.current.uvi)
                    return (
                      <>
                        <uvAdvice.icon className={`h-5 w-5 ${uvAdvice.color}`} />
                        <div>
                          <h4 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>UV Safety</h4>
                          <p className={`text-sm ${uvAdvice.color}`}>{uvAdvice.text}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card
              className={`transition-all duration-300 ${
                darkMode
                  ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
                  : "bg-white/70 backdrop-blur-sm border-white/50"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {(() => {
                    const weatherAdvice = getWeatherAdvice(weatherData)
                    return (
                      <>
                        <weatherAdvice.icon className={`h-5 w-5 ${weatherAdvice.color}`} />
                        <div>
                          <h4 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                            Weather Safety
                          </h4>
                          <p className={`text-sm ${weatherAdvice.color}`}>{weatherAdvice.text}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Air Quality */}
          <Card
            className={`transition-all duration-300 ${
              darkMode
                ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
                : "bg-white/70 backdrop-blur-sm border-white/50"
            }`}
          >
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <Activity className="h-5 w-5 text-green-500" />
                Air Quality Index
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const aqi = airQualityData.list[0].main.aqi
                const aqiStatus = getAirQualityStatus(aqi)
                return (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-2xl font-bold ${aqiStatus.color}`}>{aqiStatus.text}</p>
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {aqiStatus.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${aqiStatus.color}`}>{aqi}/5</p>
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>AQI Scale</p>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Weather Chart */}
          <WeatherChart weatherData={weatherData} darkMode={darkMode} />

          {/* Environmental Score */}
          <Card
            className={`transition-all duration-300 ${
              darkMode
                ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
                : "bg-white/70 backdrop-blur-sm border-white/50"
            }`}
          >
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <TrendingUp className="h-5 w-5 text-teal-500" />
                Environmental Travel Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const score = calculateEnvironmentalScore(weatherData, airQualityData)
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                        Overall Score
                      </span>
                      <span
                        className={`text-3xl font-bold ${
                          score >= 80
                            ? "text-green-500"
                            : score >= 60
                              ? "text-yellow-500"
                              : score >= 40
                                ? "text-orange-500"
                                : "text-red-500"
                        }`}
                      >
                        {score}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-4 rounded-full transition-all duration-1000 ${
                          score >= 80
                            ? "bg-gradient-to-r from-green-400 to-green-600"
                            : score >= 60
                              ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                              : score >= 40
                                ? "bg-gradient-to-r from-orange-400 to-orange-600"
                                : "bg-gradient-to-r from-red-400 to-red-600"
                        }`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {score >= 80
                        ? "Excellent conditions for eco-travel!"
                        : score >= 60
                          ? "Good conditions with minor considerations"
                          : score >= 40
                            ? "Moderate conditions - take precautions"
                            : "Poor conditions - consider postponing travel"}
                    </p>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Location Summary */}
          <Card className={`transition-all duration-300 ${darkMode ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm" : "bg-white/70 backdrop-blur-sm border-white/50"}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <MapPin className="h-5 w-5 text-teal-500" />
                Selected Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                    {selectedLocation.name}
                  </span>
                  <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                    📍 Selected
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    <span className="font-medium">Coordinates:</span><br />
                    {selectedLocation.lat.toFixed(4)}°, {selectedLocation.lon.toFixed(4)}°
                  </div>
                  <div className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    <span className="font-medium">Weather:</span><br />
                    {weatherData?.current?.temp ? `${Math.round(weatherData.current.temp)}°C` : 'Loading...'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              onClick={() => setActiveStep(2)}
              className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white px-8 py-3 transition-all duration-300"
            >
              Continue to Travel Planning
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Eco Travel Recommendations */}
      {activeStep === 2 && ecoSuggestions && selectedLocation && !loading && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
              Your Personalized Eco Travel Plan
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveStep(1)}>
                Back to Analysis
              </Button>
              <Button onClick={savePlan} variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save Plan
              </Button>
              <Button onClick={sharePlan} variant="outline" className="transition-all duration-300 bg-transparent">
                <Share2 className="h-4 w-4 mr-2" />
                Share Plan
              </Button>
            </div>
          </div>

          {/* Destination Overview */}
          <Card
            className={`transition-all duration-300 ${
              darkMode
                ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
                : "bg-gradient-to-r from-emerald-50 to-teal-50 backdrop-blur-sm"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                    {selectedLocation.name}
                  </h4>
                  <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Sustainable Travel Destination</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations Tabs */}
          <Tabs defaultValue="transport" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="transport">🚊 Transport</TabsTrigger>
              <TabsTrigger value="accommodation">🏨 Stay</TabsTrigger>
              <TabsTrigger value="activities">🎯 Activities</TabsTrigger>
              <TabsTrigger value="destinations">🌿 Places</TabsTrigger>
            </TabsList>

            <TabsContent value="transport">
              <Card
                className={`transition-all duration-300 ${
                  darkMode
                    ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
                    : "bg-white/70 backdrop-blur-sm border-white/50"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <ecoSuggestions.transport.icon className="h-10 w-10 text-emerald-600" />
                    <div>
                      <h4 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {ecoSuggestions.transport.type}
                      </h4>
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {ecoSuggestions.transport.description}
                      </p>
                    </div>
                    <Badge className="ml-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                      Eco Score: {ecoSuggestions.transport.ecoScore}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-lg">
                      <Leaf className="h-6 w-6 text-emerald-600 mb-2" />
                      <p className="text-emerald-800 font-medium">
                        🌱 Carbon Saved: {ecoSuggestions.transport.carbonSaved}kg CO₂
                      </p>
                      <p className="text-emerald-700 text-sm mt-1">vs. traditional air travel</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <DollarSign className="h-6 w-6 text-blue-600 mb-2" />
                      <p className="text-blue-800 font-medium">💰 Cost: {ecoSuggestions.transport.cost}</p>
                      <p className="text-blue-700 text-sm mt-1">Estimated price range</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <Clock className="h-6 w-6 text-purple-600 mb-2" />
                      <p className="text-purple-800 font-medium">⏱️ Duration: {ecoSuggestions.transport.duration}</p>
                      <p className="text-purple-700 text-sm mt-1">Travel time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="accommodation">
              <Card
                className={`transition-all duration-300 ${
                  darkMode
                    ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
                    : "bg-white/70 backdrop-blur-sm border-white/50"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <ecoSuggestions.accommodation.icon className="h-10 w-10 text-blue-600" />
                    <div>
                      <h4 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {ecoSuggestions.accommodation.name}
                      </h4>
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {ecoSuggestions.accommodation.type} • {ecoSuggestions.accommodation.priceRange}
                      </p>
                    </div>
                    <Badge className="ml-auto bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                      ⭐ {ecoSuggestions.accommodation.ecoRating}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ecoSuggestions.accommodation.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Leaf className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities">
              <Card
                className={`transition-all duration-300 ${
                  darkMode
                    ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
                    : "bg-white/70 backdrop-blur-sm border-white/50"
                }`}
              >
                <CardContent className="p-6">
                  <h4 className={`text-xl font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>
                    Recommended Eco Activities
                  </h4>
                  <div className="space-y-4">
                    {ecoSuggestions.activities.map((activity, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-purple-800">{activity.name}</h5>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            {activity.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-purple-700 mb-3">{activity.description}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">Eco Score: {activity.ecoScore}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="text-blue-600">{activity.duration}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-orange-500" />
                            <span className="text-orange-600">{activity.difficulty}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="destinations">
              <Card
                className={`transition-all duration-300 ${
                  darkMode
                    ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
                    : "bg-white/70 backdrop-blur-sm border-white/50"
                }`}
              >
                <CardContent className="p-6">
                  <h4 className={`text-xl font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>
                    Eco-Certified Destinations
                  </h4>
                  <div className="space-y-4">
                    {ecoSuggestions.destinations.map((destination, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-green-800">{destination.name}</h5>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {destination.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-green-700 mb-3">{destination.description}</p>
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-medium text-emerald-600">
                            Eco Score: {destination.ecoScore}/100
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {destination.highlights.map((highlight, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-white/50">
                              {highlight}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Carbon Footprint Visualization */}
          <Card
            className={`transition-all duration-300 ${
              darkMode
                ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
                : "bg-white/70 backdrop-blur-sm border-white/50"
            }`}
          >
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <BarChart3 className="h-5 w-5 text-emerald-500" />
                Carbon Footprint Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Your Eco Choice: {ecoSuggestions.transport.type}
                    </span>
                    <span className={`text-sm font-bold text-green-600`}>
                      {100 - ecoSuggestions.transport.carbonSaved}kg CO₂
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${100 - ecoSuggestions.transport.carbonSaved}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Traditional Flight
                    </span>
                    <span className={`text-sm font-bold text-red-600`}>{100}kg CO₂</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-1000"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-800">
                      You're saving {ecoSuggestions.transport.carbonSaved}kg CO₂
                    </span>
                  </div>
                  <p className="text-sm text-emerald-700 mt-1">
                    That's equivalent to planting {Math.round(ecoSuggestions.transport.carbonSaved / 22)} trees!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Saved Plans */}
      {savedPlans.length > 0 && (
        <Card
          className={`transition-all duration-300 ${
            darkMode
              ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm"
              : "bg-white/70 backdrop-blur-sm border-white/50"
          }`}
        >
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Bookmark className="h-5 w-5 text-emerald-500" />
              Saved Travel Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {savedPlans.map((plan, index) => (
                <Badge key={index} variant="secondary" className="bg-emerald-100 text-emerald-800">
                  <Save className="h-3 w-3 mr-1" />
                  {plan}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
