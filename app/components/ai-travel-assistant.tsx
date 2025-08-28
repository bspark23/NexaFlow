"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  MapPin, Navigation, Mic, MicOff, Route, AlertTriangle, Clock, Cloud, Sun,
  Umbrella, Wind, Thermometer, Bot, Send, Loader2, Navigation2, Shield, Zap,
  Play, Square, Target, MapIcon
} from "lucide-react"

interface AITravelAssistantProps {
  darkMode: boolean
}

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  message: string
  timestamp: Date
  weatherData?: any
  routeData?: any
}

interface NavigationState {
  isNavigating: boolean
  currentPosition: { lat: number; lon: number } | null
  destination: { lat: number; lon: number; name: string } | null
  route: Array<[number, number]> | null
  remainingDistance: number
  estimatedArrival: Date | null
  isMoving: boolean
  speed: number
  lastMovementTime: Date | null
}

export function AITravelAssistant({ darkMode }: AITravelAssistantProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null)
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false, currentPosition: null, destination: null, route: null,
    remainingDistance: 0, estimatedArrival: null, isMoving: false, speed: 0, lastMovementTime: null
  })
  const [fromLocation, setFromLocation] = useState("")
  const [toLocation, setToLocation] = useState("")

  const mapRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const destinationMarkerRef = useRef<any>(null)
  const routeLayerRef = useRef<any>(null)
  const watchIdRef = useRef<number | null>(null)

  const WEATHER_API_KEY = "f68e14d9f5d8fffea3bd365b3a9f8e4c8e8f8a8b8c" 
 // Initialize AI Travel Assistant
  useEffect(() => {
    const initializeAI = async () => {
      try {
        const welcomeMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          type: 'ai',
          message: "🤖 Hello! I'm your AI Travel Assistant with real-time navigation!\n\n🗺️ Live navigation with voice guidance\n🌤️ Weather-integrated route planning\n🎒 Smart packing suggestions\n🛡️ Travel safety tips\n\nTry: 'Navigate to Lagos' or 'Weather in Abuja'",
          timestamp: new Date()
        }
        setChatMessages([welcomeMessage])
        startLocationTracking()
        console.log('✅ AI Travel Assistant initialized')
      } catch (error) {
        console.error('❌ Failed to initialize AI Travel Assistant:', error)
      }
    }
    initializeAI()
    return () => stopLocationTracking()
  }, [])

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      if (mapRef.current && !mapInstanceRef.current) {
        try {
          await loadLeafletLibrary()
          const map = (window as any).L.map(mapRef.current).setView([9.0765, 7.3986], 6)
          mapInstanceRef.current = map

          (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
          }).addTo(map)

          map.on('click', (e: any) => {
            const { lat, lng } = e.latlng
            handleMapClick(lat, lng)
          })

          console.log('✅ Interactive map initialized')
        } catch (error) {
          console.error('❌ Failed to initialize map:', error)
        }
      }
    }
    const timer = setTimeout(initializeMap, 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const loadLeafletLibrary = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).L) {
        resolve()
        return
      }
      const cssLink = document.createElement('link')
      cssLink.rel = 'stylesheet'
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(cssLink)

      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Leaflet'))
      document.head.appendChild(script)
    })
  }  c
onst startLocationTracking = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported')
      return
    }

    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPosition = { lat: position.coords.latitude, lon: position.coords.longitude }
        setUserLocation(newPosition)
        updateNavigationState(newPosition, position.coords.speed || 0)
        updateMapUserLocation(newPosition)
      },
      (error) => console.error('Location tracking error:', error),
      options
    )
  }

  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  const updateNavigationState = (newPosition: {lat: number, lon: number}, speed: number) => {
    setNavigationState(prev => {
      const isMoving = speed > 0.5
      let remainingDistance = prev.remainingDistance
      let estimatedArrival = prev.estimatedArrival
      
      if (prev.isNavigating && prev.destination) {
        remainingDistance = calculateDistance(newPosition, prev.destination)
        if (speed > 0) {
          const timeToArrival = (remainingDistance / (speed * 3.6)) * 1000
          estimatedArrival = new Date(Date.now() + timeToArrival)
        }
        if (remainingDistance < 0.1) {
          handleArrival(prev.destination.name)
        }
      }
      
      return {
        ...prev, currentPosition: newPosition, remainingDistance, estimatedArrival,
        isMoving, speed: speed * 3.6, lastMovementTime: isMoving ? new Date() : prev.lastMovementTime
      }
    })
  }

  const updateMapUserLocation = (position: {lat: number, lon: number}) => {
    if (!mapInstanceRef.current) return

    if (userMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current)
    }

    const movingIcon = (window as any).L.divIcon({
      html: `<div style="width: 20px; height: 20px; background: ${navigationState.isMoving ? '#10b981' : '#3b82f6'}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); ${navigationState.isMoving ? 'animation: pulse 2s infinite;' : ''}"></div>`,
      className: 'custom-user-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })

    userMarkerRef.current = (window as any).L.marker([position.lat, position.lon], { icon: movingIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<div><strong>Your Location</strong><br>Status: ${navigationState.isMoving ? '🚶 Moving' : '⏸️ Stationary'}<br>Speed: ${navigationState.speed.toFixed(1)} km/h<br>${navigationState.remainingDistance > 0 ? `Distance to destination: ${navigationState.remainingDistance.toFixed(1)} km` : ''}</div>`)

    if (!navigationState.isNavigating) {
      mapInstanceRef.current.setView([position.lat, position.lon], 15)
    }
  }  con
st handleMapClick = async (lat: number, lng: number) => {
    if (!userLocation) {
      showNotification('Please wait for your location to be detected first', 'warning')
      return
    }

    try {
      const locationName = await reverseGeocode(lat, lng)
      const confirmed = confirm(`Navigate to ${locationName}?`)
      if (confirmed) {
        await startNavigation(userLocation, { lat, lon: lng, name: locationName })
      }
    } catch (error) {
      console.error('Error handling map click:', error)
      showNotification('Failed to get location information', 'error')
    }
  }

  const startNavigation = async (from: {lat: number, lon: number}, to: {lat: number, lon: number, name: string}) => {
    try {
      const route = await getRoute(from, to)
      
      setNavigationState(prev => ({
        ...prev, isNavigating: true, destination: to, route: route.coordinates, remainingDistance: route.distance
      }))

      drawRoute(route.coordinates)
      addDestinationMarker(to)
      
      const bounds = (window as any).L.latLngBounds([[from.lat, from.lon], [to.lat, to.lon]])
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] })
      
      speak(`Navigation started to ${to.name}. Distance: ${route.distance.toFixed(1)} kilometers.`)
      
      const navMessage: ChatMessage = {
        id: `msg_${Date.now()}`, type: 'ai',
        message: `🗺️ Navigation started to ${to.name}\n📍 Distance: ${route.distance.toFixed(1)} km\n⏱️ Estimated time: ${route.duration} minutes\n\n🎤 I'll provide voice guidance as you travel!`,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, navMessage])
      
    } catch (error) {
      console.error('Failed to start navigation:', error)
      showNotification('Failed to start navigation', 'error')
    }
  }

  const stopNavigation = () => {
    setNavigationState(prev => ({
      ...prev, isNavigating: false, destination: null, route: null, remainingDistance: 0, estimatedArrival: null
    }))

    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current)
      routeLayerRef.current = null
    }
    if (destinationMarkerRef.current) {
      mapInstanceRef.current.removeLayer(destinationMarkerRef.current)
      destinationMarkerRef.current = null
    }

    speak('Navigation stopped')
    showNotification('Navigation stopped', 'info')
  }

  const getRoute = async (from: {lat: number, lon: number}, to: {lat: number, lon: number}) => {
    // Using a simple direct route calculation since OpenRouteService requires API key setup
    const distance = calculateDistance(from, to)
    const duration = Math.round(distance / 60) // Rough estimate: 60 km/h average
    const coordinates: Array<[number, number]> = [[from.lat, from.lon], [to.lat, to.lon]]
    
    return { coordinates, distance, duration }
  }  const d
rawRoute = (coordinates: Array<[number, number]>) => {
    if (!mapInstanceRef.current) return

    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current)
    }

    routeLayerRef.current = (window as any).L.polyline(coordinates, {
      color: '#3b82f6', weight: 4, opacity: 0.8
    }).addTo(mapInstanceRef.current)
  }

  const addDestinationMarker = (destination: {lat: number, lon: number, name: string}) => {
    if (!mapInstanceRef.current) return

    if (destinationMarkerRef.current) {
      mapInstanceRef.current.removeLayer(destinationMarkerRef.current)
    }

    destinationMarkerRef.current = (window as any).L.marker([destination.lat, destination.lon])
      .addTo(mapInstanceRef.current)
      .bindPopup(`<strong>Destination:</strong><br>${destination.name}`)
  }

  const handleArrival = (destinationName: string) => {
    stopNavigation()
    showArrivalCelebration(destinationName)
    speak(`Congratulations! You have arrived at ${destinationName}. Welcome to your destination!`)
    
    const arrivalMessage: ChatMessage = {
      id: `msg_${Date.now()}`, type: 'ai',
      message: `🎉 Congratulations! You have arrived at ${destinationName}!\n\n${getRandomFunFact(destinationName)}`,
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, arrivalMessage])
  }

  const showArrivalCelebration = (destinationName: string) => {
    const celebration = document.createElement('div')
    celebration.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in'
    
    celebration.innerHTML = `
      <div class="bg-gradient-to-br from-green-400 to-blue-500 p-8 rounded-2xl text-white text-center shadow-2xl animate-bounce max-w-md mx-4">
        <div class="text-6xl mb-4 animate-pulse">🎉</div>
        <div class="text-2xl font-bold mb-2">Destination Reached!</div>
        <div class="text-lg mb-4">Welcome to ${destinationName}!</div>
        <div class="text-sm opacity-90 mb-4">${getRandomFunFact(destinationName)}</div>
        <button onclick="this.parentElement.parentElement.remove()" class="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg transition-colors">Continue</button>
      </div>
    `
    
    document.body.appendChild(celebration)
    setTimeout(() => { if (celebration.parentElement) celebration.remove() }, 10000)
  }

  const getRandomFunFact = (location: string): string => {
    const facts = [
      `Did you know? ${location} has its own unique weather patterns!`,
      `Fun fact: Every destination like ${location} has a story to tell.`,
      `Interesting: You've just completed another successful journey to ${location}!`,
      `Amazing: ${location} welcomes you with new possibilities!`,
      `Cool fact: Weather conditions in ${location} can vary significantly throughout the day!`
    ]
    return facts[Math.floor(Math.random() * facts.length)]
  }  cons
t reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${WEATHER_API_KEY}`)
      const data = await response.json()
      if (data.length > 0) {
        return data[0].name + (data[0].country ? `, ${data[0].country}` : '')
      }
      return `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`
    } catch (error) {
      return `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`
    }
  }

  const calculateDistance = (from: {lat: number, lon: number}, to: {lat: number, lon: number}): number => {
    const R = 6371
    const dLat = (to.lat - from.lat) * Math.PI / 180
    const dLon = (to.lon - from.lon) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`, type: 'user', message: inputMessage, timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsProcessing(true)

    try {
      const aiResponse = await processAIQuery(inputMessage)
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`, type: 'ai', message: aiResponse.message, timestamp: new Date(),
        weatherData: aiResponse.weatherData, routeData: aiResponse.routeData
      }
      setChatMessages(prev => [...prev, aiMessage])
      speak(aiResponse.message)
    } catch (error) {
      console.error('Error processing AI query:', error)
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`, type: 'ai',
        message: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const processAIQuery = async (query: string) => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('navigate to') || lowerQuery.includes('go to')) {
      return await handleNavigationQuery(query)
    }
    if (lowerQuery.includes('route') || (lowerQuery.includes('from') && lowerQuery.includes('to'))) {
      return await handleRouteQuery(query)
    }
    if (lowerQuery.includes('weather') || lowerQuery.includes('rain') || lowerQuery.includes('sun')) {
      return await handleWeatherQuery(query)
    }
    if (lowerQuery.includes('pack') || lowerQuery.includes('bring') || lowerQuery.includes('carry')) {
      return await handlePackingQuery(query)
    }
    if (lowerQuery.includes('safe') || lowerQuery.includes('danger') || lowerQuery.includes('risk')) {
      return await handleSafetyQuery(query)
    }
    return await handleGeneralQuery(query)
  }  cons
t handleNavigationQuery = async (query: string) => {
    const locationMatch = query.match(/(?:navigate to|go to)\s+([a-zA-Z\s]+)/i)
    
    if (locationMatch && userLocation) {
      const destination = locationMatch[1].trim()
      try {
        const coords = await getCoordinates(destination)
        await startNavigation(userLocation, { lat: coords.lat, lon: coords.lon, name: destination })
        return {
          message: `🗺️ Starting navigation to ${destination}!\n\nI'll provide real-time voice guidance as you travel. You can see your route on the map above.`,
          weatherData: null, routeData: null
        }
      } catch (error) {
        return { message: `I couldn't find "${destination}". Please check the location name and try again.`, weatherData: null, routeData: null }
      }
    }
    return { message: "Please specify a destination. For example: 'Navigate to Lagos' or 'Go to Abuja'", weatherData: null, routeData: null }
  }

  const handleRouteQuery = async (query: string) => {
    const fromMatch = query.match(/from\s+([a-zA-Z\s]+?)(?:\s+to|\s+$)/i)
    const toMatch = query.match(/to\s+([a-zA-Z\s]+?)(?:\s+|$)/i)
    
    if (fromMatch && toMatch) {
      const from = fromMatch[1].trim()
      const to = toMatch[1].trim()
      
      try {
        const fromCoords = await getCoordinates(from)
        const toCoords = await getCoordinates(to)
        const fromWeather = await getWeatherData(fromCoords.lat, fromCoords.lon)
        const toWeather = await getWeatherData(toCoords.lat, toCoords.lon)
        
        const distance = calculateDistance(fromCoords, toCoords)
        const duration = Math.round(distance / 60)
        const weatherAnalysis = analyzeWeatherForRoute(fromWeather, toWeather, from, to)
        
        return {
          message: `🗺️ Route Analysis: ${from} to ${to}\n\n📍 Distance: ${Math.round(distance)} km\n⏱️ Estimated Duration: ${Math.floor(duration)}h ${Math.round((duration % 1) * 60)}m\n\n🌤️ Weather Conditions:\n• ${from}: ${Math.round(fromWeather.main.temp)}°C, ${fromWeather.weather[0].description}\n• ${to}: ${Math.round(toWeather.main.temp)}°C, ${toWeather.weather[0].description}\n\n${weatherAnalysis}\n\n💡 Recommendations:\n• Check traffic conditions before departure\n• Carry emergency supplies and water\n• Monitor weather updates during travel\n• Ensure your vehicle is well-maintained`,
          routeData: { from, to, distance, duration }, weatherData: { fromWeather, toWeather }
        }
      } catch (error) {
        return { message: `I couldn't find route information for "${query}". Please check the location names and try again.`, routeData: null, weatherData: null }
      }
    }
    return { message: "To help you plan a route, please specify both starting location and destination. For example: 'Route from Lagos to Abuja'", routeData: null, weatherData: null }
  }

  const handleWeatherQuery = async (query: string) => {
    const locationMatch = query.match(/(?:in|for|at)\s+([a-zA-Z\s]+)/i) || query.match(/([a-zA-Z\s]+)\s+weather/i)
    
    if (locationMatch) {
      const location = locationMatch[1].trim()
      try {
        const coords = await getCoordinates(location)
        const weather = await getWeatherData(coords.lat, coords.lon)
        const uvData = await getUVData(coords.lat, coords.lon)
        
        const uvLevel = getUVLevel(uvData.value)
        const safetyAdvice = getUVSafetyAdvice(uvData.value, uvLevel)
        
        return {
          message: `🌤️ Weather Report for ${location}:\n\n🌡️ Temperature: ${Math.round(weather.main.temp)}°C (feels like ${Math.round(weather.main.feels_like)}°C)\n☁️ Conditions: ${weather.weather[0].description}\n💨 Wind: ${Math.round(weather.wind.speed)} m/s\n💧 Humidity: ${weather.main.humidity}%\n☀️ UV Index: ${uvData.value} (${uvLevel.toUpperCase()})\n\n${safetyAdvice}\n\n🎒 Travel Tips:\n${getWeatherBasedTips(weather, uvData.value)}`,
          weatherData: { weather, uvData }, routeData: null
        }
      } catch (error) {
        return { message: `I couldn't find weather information for "${location}". Please check the location name and try again.`, weatherData: null, routeData: null }
      }
    }
    return { message: "Please specify a location for weather information. For example: 'What's the weather like in Lagos?'", weatherData: null, routeData: null }
  }  
const handlePackingQuery = async (query: string) => {
    const packingTips = [
      "🧳 Essential Travel Items:",
      "• Weather-appropriate clothing",
      "• Sun protection (hat, sunglasses, SPF 50+ sunscreen)",
      "• Rain protection (umbrella, waterproof jacket)",
      "• Comfortable walking shoes",
      "• First aid kit with basic medications",
      "• Phone charger and portable power bank",
      "• Water bottle and healthy snacks",
      "• Important documents (ID, insurance)",
      "• Emergency contact information",
      "",
      "🌡️ Weather-Specific Items:",
      "• Hot weather: Extra water, cooling towel, light colors",
      "• Cold weather: Layers, warm hat, gloves",
      "• Rainy weather: Waterproof bags, extra socks",
      "• Windy weather: Secure loose items, windbreaker"
    ]
    return { message: packingTips.join('\n'), weatherData: null, routeData: null }
  }

  const handleSafetyQuery = async (query: string) => {
    const safetyTips = [
      "🛡️ Travel Safety Guidelines:",
      "",
      "📋 Before You Travel:",
      "• Share your itinerary with someone trusted",
      "• Check weather forecasts and road conditions",
      "• Ensure your vehicle is properly maintained",
      "• Carry emergency supplies and first aid kit",
      "",
      "🚗 During Travel:",
      "• Monitor weather conditions regularly",
      "• Take breaks every 2 hours on long trips",
      "• Avoid driving in severe weather",
      "• Keep emergency contacts accessible",
      "• Trust your instincts about unsafe situations",
      "",
      "⚠️ Weather-Related Safety:",
      "• Never drive through flooded roads",
      "• Pull over safely during severe storms",
      "• Stay hydrated in hot weather",
      "• Use maximum sun protection (UV 7+)",
      "• Reduce speed in high winds"
    ]
    return { message: safetyTips.join('\n'), weatherData: null, routeData: null }
  }

  const handleGeneralQuery = async (query: string) => {
    const responses = [
      "I'm here to help with your travel planning! I can assist with:",
      "🗺️ Real-time navigation with voice guidance",
      "🌤️ Weather analysis and forecasts",
      "🎒 Packing suggestions based on weather",
      "🛡️ Travel safety recommendations",
      "",
      "Try asking me:",
      "• 'Navigate to Lagos'",
      "• 'What's the weather like in Abuja?'",
      "• 'What should I pack for rainy weather?'",
      "• 'Route from Lagos to Port Harcourt'"
    ]
    return { message: responses.join('\n'), weatherData: null, routeData: null }
  }  /
/ Helper functions
  const getCoordinates = async (location: string) => {
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${WEATHER_API_KEY}`)
    const data = await response.json()
    if (data.length === 0) throw new Error(`Location "${location}" not found`)
    return { lat: data[0].lat, lon: data[0].lon }
  }

  const getWeatherData = async (lat: number, lon: number) => {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`)
    return await response.json()
  }

  const getUVData = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`)
      return await response.json()
    } catch (error) {
      return { value: 5 }
    }
  }

  const getUVLevel = (uv: number) => {
    if (uv <= 2) return "low"
    if (uv <= 5) return "moderate"
    if (uv <= 7) return "high"
    if (uv <= 10) return "very high"
    return "extreme"
  }

  const getUVSafetyAdvice = (uv: number, level: string) => {
    if (uv <= 2) return "🟢 Low UV - Safe for outdoor activities"
    if (uv <= 5) return "🟡 Moderate UV - Use SPF 30+, wear sunglasses"
    if (uv <= 7) return "🟠 High UV - Use SPF 50+, seek shade 12-3 PM"
    if (uv <= 10) return "🔴 Very High UV - Avoid outdoor activities 10 AM-4 PM"
    return "🟣 Extreme UV - Stay indoors, maximum protection required"
  }

  const getWeatherBasedTips = (weather: any, uv: number) => {
    const tips = []
    if (weather.main.temp > 30) tips.push("• Carry extra water and stay hydrated")
    if (weather.main.temp < 15) tips.push("• Pack warm layers and protective clothing")
    if (weather.weather[0].main.includes('Rain')) tips.push("• Bring umbrella and waterproof gear")
    if (weather.wind.speed > 10) tips.push("• Secure loose items, drive carefully")
    if (uv > 6) tips.push("• Use SPF 50+ sunscreen and protective clothing")
    return tips.length > 0 ? tips.join('\n') : "• Standard travel precautions recommended"
  }

  const analyzeWeatherForRoute = (fromWeather: any, toWeather: any, from: string, to: string) => {
    const analysis = []
    const tempDiff = Math.abs(fromWeather.main.temp - toWeather.main.temp)
    if (tempDiff > 10) {
      analysis.push(`⚠️ Significant temperature difference (${Math.round(tempDiff)}°C) - pack layers`)
    }
    if (fromWeather.weather[0].main.includes('Rain') || toWeather.weather[0].main.includes('Rain')) {
      analysis.push("🌧️ Rain expected - bring waterproof gear and drive carefully")
    }
    if (fromWeather.wind.speed > 15 || toWeather.wind.speed > 15) {
      analysis.push("💨 Strong winds detected - reduce speed and be cautious")
    }
    return analysis.length > 0 ? analysis.join('\n') : "✅ Good weather conditions for travel"
  }  c
onst handleVoiceAssistant = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showNotification('Voice recognition not supported in this browser', 'error')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    
    recognition.onstart = () => setIsVoiceActive(true)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputMessage(transcript)
      setIsVoiceActive(false)
      setTimeout(() => handleSendMessage(), 500)
    }
    recognition.onend = () => setIsVoiceActive(false)
    recognition.onerror = () => {
      setIsVoiceActive(false)
      showNotification('Voice recognition failed. Please try again.', 'error')
    }
    
    try {
      recognition.start()
    } catch (error) {
      setIsVoiceActive(false)
      showNotification('Failed to start voice recognition', 'error')
    }
  }

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  const showNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    const colors = {
      info: 'from-blue-500 to-blue-600',
      success: 'from-green-500 to-green-600',
      warning: 'from-yellow-500 to-orange-500',
      error: 'from-red-500 to-red-600'
    }

    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg max-w-sm bg-gradient-to-r ${colors[type]} text-white shadow-lg border border-white/20 backdrop-blur-sm animate-slide-in-right`
    notification.innerHTML = `<div class="flex items-start gap-2"><span class="text-sm font-medium">${message}</span><button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white/80 hover:text-white text-lg leading-none">×</button></div>`
    
    document.body.appendChild(notification)
    setTimeout(() => { if (notification.parentElement) notification.remove() }, 5000)
  }

  const handleRoutePlanning = async () => {
    if (!fromLocation.trim() || !toLocation.trim()) {
      showNotification('Please enter both starting location and destination', 'warning')
      return
    }

    try {
      const fromCoords = await getCoordinates(fromLocation)
      const toCoords = await getCoordinates(toLocation)
      
      if (userLocation) {
        await startNavigation(fromCoords, { lat: toCoords.lat, lon: toCoords.lon, name: toLocation })
      } else {
        const aiResponse = await handleRouteQuery(`Route from ${fromLocation} to ${toLocation}`)
        const aiMessage: ChatMessage = {
          id: `msg_${Date.now()}`, type: 'ai', message: aiResponse.message, timestamp: new Date(),
          weatherData: aiResponse.weatherData, routeData: aiResponse.routeData
        }
        setChatMessages(prev => [...prev, aiMessage])
      }
      
      setFromLocation("")
      setToLocation("")
    } catch (error) {
      showNotification('Failed to plan route. Please check location names.', 'error')
    }
  }  return 
(
    <div className="space-y-6">
      {/* Header */}
      <Card className={`${darkMode ? "bg-gray-900/90 border-gray-700" : "bg-white/80 border-white/60"} backdrop-blur-sm`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                🤖 AI Travel Assistant
              </h1>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Real-time navigation with AI-powered travel guidance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-300">
                <Zap className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
                <Shield className="h-3 w-3 mr-1" />
                Real-time
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Status */}
      {navigationState.isNavigating && (
        <Card className={`${darkMode ? "bg-green-900/20 border-green-700" : "bg-green-50 border-green-200"} backdrop-blur-sm`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="animate-pulse">
                  <Navigation className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className={`font-semibold ${darkMode ? "text-green-300" : "text-green-800"}`}>
                    Navigating to {navigationState.destination?.name}
                  </div>
                  <div className={`text-sm ${darkMode ? "text-green-400" : "text-green-600"}`}>
                    {navigationState.remainingDistance.toFixed(1)} km remaining
                    {navigationState.estimatedArrival && ` • ETA: ${navigationState.estimatedArrival.toLocaleTimeString()}`}
                  </div>
                </div>
              </div>
              <Button onClick={stopNavigation} variant="outline" size="sm">
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Interface */}
        <Card className={`${darkMode ? "bg-gray-900/90 border-gray-700" : "bg-white/80 border-white/60"} backdrop-blur-sm`}>
          <CardContent className="p-6">
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              💬 AI Chat Assistant
            </h2>
            
            {/* Chat Messages */}
            <div className={`h-96 overflow-y-auto mb-4 p-4 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
              {chatMessages.map((message) => (
                <div key={message.id} className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-teal-500 to-purple-500 text-white' 
                      : darkMode 
                        ? 'bg-gray-700 text-gray-100' 
                        : 'bg-white text-gray-800 shadow-sm'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm">{message.message}</div>
                    <div className={`text-xs mt-1 opacity-70`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="text-left mb-4">
                  <div className={`inline-block p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white shadow-sm'}`}>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me about travel, weather, routes, navigation..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isProcessing}
                className="flex-1"
              />
              <Button
                onClick={handleVoiceAssistant}
                disabled={isVoiceActive || isProcessing}
                variant="outline"
                size="icon"
                className={isVoiceActive ? 'animate-pulse bg-red-500 text-white' : ''}
              >
                {isVoiceActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isProcessing}
                className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>    
    {/* Live Map */}
        <Card className={`${darkMode ? "bg-gray-900/90 border-gray-700" : "bg-white/80 border-white/60"} backdrop-blur-sm`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                🗺️ Interactive Navigation Map
              </h2>
              {userLocation && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-300">
                  <MapPin className="h-3 w-3 mr-1" />
                  GPS Active
                </Badge>
              )}
            </div>
            
            <div 
              ref={mapRef}
              className={`w-full h-96 rounded-lg border ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'}`}
              style={{ minHeight: '400px' }}
            >
              {/* Map will be initialized here */}
              <div className={`flex items-center justify-center h-full ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="text-center">
                  <MapIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Interactive map loading...</p>
                  <p className="text-sm mt-1">Click anywhere to set destination</p>
                </div>
              </div>
            </div>
            
            {/* Movement Status */}
            {userLocation && (
              <div className={`mt-4 p-3 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${navigationState.isMoving ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                      {navigationState.isMoving ? 'Moving' : 'Stationary'}
                    </span>
                  </div>
                  <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                    Speed: {navigationState.speed.toFixed(1)} km/h
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Route Planning */}
      <Card className={`${darkMode ? "bg-gray-900/90 border-gray-700" : "bg-white/80 border-white/60"} backdrop-blur-sm`}>
        <CardContent className="p-6">
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
            🗺️ Route Planning
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              placeholder="From location"
            />
            <Input
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              placeholder="To destination"
            />
            <Button
              onClick={handleRoutePlanning}
              className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600"
            >
              <Route className="h-4 w-4 mr-2" />
              Plan Route
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className={`${darkMode ? "bg-gray-900/90 border-gray-700" : "bg-white/80 border-white/60"} backdrop-blur-sm`}>
        <CardContent className="p-6">
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
            ⚡ Quick Actions
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => setInputMessage("What's the weather like in Lagos?")}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Cloud className="h-6 w-6" />
              <span className="text-sm">Weather Check</span>
            </Button>
            
            <Button
              onClick={() => setInputMessage("Navigate to Lagos")}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Navigation2 className="h-6 w-6" />
              <span className="text-sm">Start Navigation</span>
            </Button>
            
            <Button
              onClick={() => setInputMessage("What should I pack for hot weather?")}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Bot className="h-6 w-6" />
              <span className="text-sm">Packing Tips</span>
            </Button>
            
            <Button
              onClick={() => setInputMessage("What are the safety tips for travel?")}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Shield className="h-6 w-6" />
              <span className="text-sm">Safety Guide</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}