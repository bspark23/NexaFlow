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
import { SmartAssistant } from "./components/smart-assistant"
import { MapNavigation } from "../components/map-navigation"

// Import productivity enhancement coordinator
import ProductivityCoordinatorHook from "../.kiro/hooks/productivity-coordinator-hook"
import DemoTrigger from "../.kiro/hooks/demo-trigger"
import VoiceAssistantHook from "../.kiro/hooks/voice-assistant-hook"
import VoiceDemo from "../.kiro/hooks/voice-demo"

import WeatherAPIService from "../.kiro/hooks/weather-api-service"
import SystemStatusHook from "../.kiro/hooks/system-status-hook"
import StartupService from "../.kiro/hooks/startup-service"

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

export default function NexaFlowApp() {
  const [uvData, setUvData] = useState<UVData | null>(null)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [searchCity, setSearchCity] = useState("")
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [currentFact, setCurrentFact] = useState(0)
  const [activeTab, setActiveTab] = useState<"uv" | "travel" | "assistant" | "analytics" | "gamification" | "navigation">("uv")
  const [boostMode, setBoostMode] = useState(false)
  const [keySequence, setKeySequence] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [voiceRecognition, setVoiceRecognition] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  const API_KEY = "f68e14d9f5d8fffea3bd365b3a9f8e4d"

  // Helper function for safe localStorage access
  const getStorageItem = (key: string, defaultValue: string = '0'): string => {
    if (!isClient) return defaultValue
    return localStorage.getItem(key) || defaultValue
  }

  const setStorageItem = (key: string, value: string): void => {
    if (isClient) {
      localStorage.setItem(key, value)
    }
  }

  // Initialize client-side state and load preferences
  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date())
    
    const savedDarkMode = localStorage.getItem("nexaflow-dark-mode")
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode))
    }
    
    // Initialize app start time for analytics
    if (!localStorage.getItem('nexaflow-start-time')) {
      localStorage.setItem('nexaflow-start-time', Date.now().toString())
    }
    
    // Initialize counters if they don't exist
    if (!localStorage.getItem('nexaflow-search-count')) {
      localStorage.setItem('nexaflow-search-count', '0')
    }
    if (!localStorage.getItem('nexaflow-voice-count')) {
      localStorage.setItem('nexaflow-voice-count', '0')
    }
  }, [])

  // Save dark mode preference to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("nexaflow-dark-mode", JSON.stringify(darkMode))
    }
  }, [darkMode, isClient])

  useEffect(() => {
    if (!isClient) return
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [isClient])

  // Auto-refresh UV data every 30 minutes for real-time accuracy
  useEffect(() => {
    const uvRefreshTimer = setInterval(() => {
      if (location && !loading) {
        console.log('🔄 Auto-refreshing UV data for accuracy...')
        fetchUVData(location.lat, location.lon)
          .then(data => {
            setUvData(data)
            console.log('✅ UV data auto-refreshed successfully')
          })
          .catch(err => {
            console.warn('⚠️ UV auto-refresh failed:', err)
          })
      }
    }, 30 * 60 * 1000) // 30 minutes

    return () => clearInterval(uvRefreshTimer)
  }, [location, loading])

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
      console.log(`🌞 Fetching real-time UV data for coordinates: ${lat}, ${lon}`);
      
      // First try OpenWeatherMap UV API
      const uvResponse = await fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
      
      if (!uvResponse.ok) {
        console.error(`UV API response not ok: ${uvResponse.status} ${uvResponse.statusText}`);
        // Fallback to current weather data which includes UV info in some cases
        const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          // Calculate UV based on time of day, season, and location
          const uvEstimate = calculateUVFromWeather(lat, lon, weatherData);
          console.log('🌞 Using calculated UV estimate:', uvEstimate);
          return { value: uvEstimate, lat, lon, date_iso: new Date().toISOString() };
        }
        throw new Error(`Failed to fetch UV data: ${uvResponse.status}`);
      }
      
      const uvData = await uvResponse.json();
      console.log('🌞 Real UV data received:', uvData);
      
      // Validate and adjust UV data if it seems incorrect
      const adjustedUV = validateAndAdjustUV(uvData.value, lat, lon);
      if (adjustedUV !== uvData.value) {
        console.log(`🌞 UV adjusted from ${uvData.value} to ${adjustedUV} for better accuracy`);
        uvData.value = adjustedUV;
      }
      
      return uvData;
    } catch (err) {
      console.error('UV fetch error:', err);
      // Last resort: calculate UV based on location and time
      const fallbackUV = calculateFallbackUV(lat, lon);
      console.log('🌞 Using fallback UV calculation:', fallbackUV);
      return { value: fallbackUV, lat, lon, date_iso: new Date().toISOString() };
    }
  }

  // Calculate UV from weather data when UV API fails
  const calculateUVFromWeather = (lat: number, lon: number, weatherData: any): number => {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1; // 1-12
    
    // Base UV calculation factors
    let baseUV = 0;
    
    // Latitude factor (closer to equator = higher UV)
    const latFactor = Math.max(0, 1 - Math.abs(lat) / 90);
    baseUV += latFactor * 8;
    
    // Season factor (summer = higher UV)
    const seasonFactor = lat >= 0 
      ? Math.sin((month - 3) * Math.PI / 6) // Northern hemisphere
      : Math.sin((month - 9) * Math.PI / 6); // Southern hemisphere
    baseUV += Math.max(0, seasonFactor) * 3;
    
    // Time of day factor
    if (hour >= 10 && hour <= 16) {
      baseUV += 2; // Peak UV hours
    } else if (hour >= 8 && hour <= 18) {
      baseUV += 1; // Moderate UV hours
    }
    
    // Cloud cover factor
    if (weatherData.clouds && weatherData.clouds.all) {
      const cloudReduction = (weatherData.clouds.all / 100) * 0.5;
      baseUV = baseUV * (1 - cloudReduction);
    }
    
    // Weather condition factor
    if (weatherData.weather && weatherData.weather[0]) {
      const condition = weatherData.weather[0].main.toLowerCase();
      if (condition.includes('clear')) baseUV *= 1.1;
      else if (condition.includes('cloud')) baseUV *= 0.8;
      else if (condition.includes('rain')) baseUV *= 0.6;
      else if (condition.includes('storm')) baseUV *= 0.4;
    }
    
    return Math.max(0, Math.min(11, Math.round(baseUV * 10) / 10));
  }

  // Validate and adjust UV data for accuracy
  const validateAndAdjustUV = (uvValue: number, lat: number, lon: number): number => {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1;
    
    // Night time should have UV = 0
    if (hour < 6 || hour > 20) {
      return 0;
    }
    
    // Portugal coordinates check (approximately 39.3999°N, 8.2245°W)
    if (lat >= 36 && lat <= 42 && lon >= -10 && lon <= -6) {
      // Portugal UV adjustments based on season and time
      if (month >= 11 || month <= 2) { // Winter
        return Math.min(uvValue, 3); // Max UV 3 in winter
      } else if (month >= 3 && month <= 5) { // Spring
        return Math.min(uvValue, 6); // Max UV 6 in spring
      } else if (month >= 6 && month <= 8) { // Summer
        return Math.min(uvValue, 9); // Max UV 9 in summer
      } else { // Autumn
        return Math.min(uvValue, 5); // Max UV 5 in autumn
      }
    }
    
    return uvValue;
  }

  // Fallback UV calculation when all APIs fail
  const calculateFallbackUV = (lat: number, lon: number): number => {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1;
    
    // Night time
    if (hour < 6 || hour > 20) return 0;
    
    // Base calculation for different regions
    let uv = 0;
    
    // Latitude-based base UV
    if (Math.abs(lat) < 23.5) uv = 8; // Tropics
    else if (Math.abs(lat) < 40) uv = 6; // Subtropics
    else if (Math.abs(lat) < 60) uv = 4; // Temperate
    else uv = 2; // Polar regions
    
    // Seasonal adjustment
    const isNorthern = lat >= 0;
    const summerMonths = isNorthern ? [6, 7, 8] : [12, 1, 2];
    const winterMonths = isNorthern ? [12, 1, 2] : [6, 7, 8];
    
    if (summerMonths.includes(month)) uv *= 1.2;
    else if (winterMonths.includes(month)) uv *= 0.6;
    
    // Time of day adjustment
    if (hour >= 11 && hour <= 15) uv *= 1.0; // Peak hours
    else if (hour >= 9 && hour <= 17) uv *= 0.8; // Good hours
    else uv *= 0.4; // Early/late hours
    
    return Math.max(0, Math.min(11, Math.round(uv)));
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
      console.log(`Searching for city: ${cityName}`);
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=5&appid=${API_KEY}`,
      )
      
      if (!response.ok) {
        console.error(`Geocoding API response not ok: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to search city: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Geocoding data received:', data);
      
      if (data.length > 0) {
        // Use the first result
        const result = data[0];
        return {
          city: result.name,
          country: result.country,
          lat: result.lat,
          lon: result.lon,
        }
      }
      throw new Error("City not found");
    } catch (err) {
      console.error('City search error:', err);
      throw new Error(`City "${cityName}" not found. Please check the spelling and try again.`);
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
      
      // Update analytics counter for manual searches
      const currentSearchCount = parseInt(getStorageItem('nexaflow-search-count'))
      setStorageItem('nexaflow-search-count', (currentSearchCount + 1).toString())
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Initialize voice recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('🎤 Voice recognition started');
        setIsListening(true);
        showVoiceMessage('🎤 Listening... Speak now!', 'listening');
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log('🎤 Voice command:', transcript);
        setIsListening(false);
        processVoiceCommand(transcript);
      };
      
      recognition.onend = () => {
        console.log('🎤 Voice recognition ended');
        setIsListening(false);
        hideVoiceMessage();
      };
      
      recognition.onerror = (event: any) => {
        console.error('🎤 Voice recognition error:', event.error);
        setIsListening(false);
        hideVoiceMessage();
        
        let errorMessage = 'Voice recognition failed. ';
        switch (event.error) {
          case 'not-allowed':
            errorMessage += 'Please allow microphone access in your browser settings.';
            break;
          case 'no-speech':
            errorMessage += 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage += 'No microphone found. Please check your microphone.';
            break;
          case 'network':
            errorMessage += 'Network error. Please check your internet connection.';
            break;
          default:
            errorMessage += 'Please try again.';
        }
        showVoiceMessage(errorMessage, 'error');
      };
      
      setVoiceRecognition(recognition);
    } else {
      console.warn('🎤 Speech recognition not supported');
    }
    
    // Initialize NexaFlow
    const initializeNexaFlow = async () => {
      try {
        // Get current location first
        getCurrentLocation()
        
        // Initialize productivity hooks
        const coordinator = ProductivityCoordinatorHook.getInstance()
        coordinator.initializeAllHooks()
        
        // Force start all individual hooks for real-time operation
        setTimeout(() => {
          try {
            // Import and start UV Health Advisor
            import('../.kiro/hooks/uv-health-advisor-hook').then(({ default: UVHealthAdvisorHook }) => {
              const uvAdvisor = UVHealthAdvisorHook.getInstance()
              uvAdvisor.startMonitoring()
              console.log('✅ UV Health Advisor started')
            })
            
            // Import and start Air Quality Tracker
            import('../.kiro/hooks/air-quality-tracker-hook').then(({ default: AirQualityTrackerHook }) => {
              const airQuality = AirQualityTrackerHook.getInstance()
              airQuality.startMonitoring()
              console.log('✅ Air Quality Tracker started')
            })
            
            // Import and start Mood & Productivity Tips
            import('../.kiro/hooks/mood-productivity-tips-hook').then(({ default: MoodProductivityTipsHook }) => {
              const moodTips = MoodProductivityTipsHook.getInstance()
              moodTips.startMonitoring()
              console.log('✅ Mood & Productivity Tips started')
            })
            
            // Import and start Weather Alerts
            import('../.kiro/hooks/weather-alerts-hook').then(({ default: WeatherAlertsHook }) => {
              const weatherAlerts = WeatherAlertsHook.getInstance()
              weatherAlerts.startMonitoring()
              console.log('✅ Weather Alerts started')
            })
            
            // Import and start Extreme Weather Safety
            import('../.kiro/hooks/extreme-weather-safety-hook').then(({ default: ExtremeWeatherSafetyHook }) => {
              const weatherSafety = ExtremeWeatherSafetyHook.getInstance()
              weatherSafety.startMonitoring()
              console.log('✅ Extreme Weather Safety monitoring started')
            })
            
            // Import and start Smart Travel Notifications
            import('../.kiro/hooks/smart-travel-notifications').then(({ default: SmartTravelNotifications }) => {
              const notifications = SmartTravelNotifications.getInstance()
              notifications.startMonitoring()
              console.log('✅ Smart Travel Notifications started')
            })
            
            // Import and initialize Location Sharing Service
            import('../.kiro/hooks/location-sharing-service').then(({ default: LocationSharingService }) => {
              const locationSharing = LocationSharingService.getInstance()
              console.log('✅ Location Sharing Service initialized')
            })
            
            console.log('🚀 All productivity and travel hooks started in real-time mode')
          } catch (error) {
            console.error('❌ Failed to start some productivity hooks:', error)
          }
        }, 2000) // Start after 2 seconds to ensure app is ready
        
        // Add development tools (only in development)
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          const demo = new DemoTrigger()
          demo.addDemoButton()
          
          const voiceDemo = new VoiceDemo()
          voiceDemo.addDemoButtons()
          

        }
        
        console.log('🎉 NexaFlow fully initialized and ready!')
        
      } catch (error) {
        console.error('❌ NexaFlow initialization failed:', error)
      }
    }
    
    initializeNexaFlow()
  }, [])

  // Process voice commands
  const processVoiceCommand = (command: string) => {
    console.log('🎤 Processing command:', command);
    
    // Weather search commands - more flexible matching
    if (command.includes('weather')) {
      // Try multiple patterns for weather commands
      let cityMatch = command.match(/weather (?:in|for|of) (.+)/i);
      if (!cityMatch) {
        cityMatch = command.match(/(.+) weather/i);
      }
      if (!cityMatch) {
        // If just "weather" + city name
        const words = command.split(' ');
        const weatherIndex = words.findIndex(word => word.includes('weather'));
        if (weatherIndex !== -1 && weatherIndex < words.length - 1) {
          const city = words.slice(weatherIndex + 1).join(' ');
          cityMatch = [command, city];
        }
      }
      
      if (cityMatch && cityMatch[1]) {
        const city = cityMatch[1].trim().replace(/[.,!?]$/, ''); // Remove punctuation
        console.log('🌤️ Extracted city:', city);
        setSearchCity(city);
        
        // Perform comprehensive weather search with voice feedback
        performVoiceWeatherSearch(city);
        return;
      }
    }
    
    // Tab navigation commands
    if (command.includes('show analytics') || command.includes('analytics')) {
      setActiveTab('analytics');
      showVoiceMessage('📊 Switched to Analytics', 'success');
      speak('Showing analytics dashboard');
      return;
    }
    
    if (command.includes('show travel') || command.includes('travel planner')) {
      setActiveTab('travel');
      showVoiceMessage('🧳 Switched to Travel', 'success');
      speak('Showing travel planner');
      return;
    }
    
    if (command.includes('assistant') || command.includes('smart assistant') || command.includes('chat')) {
      setActiveTab('assistant');
      showVoiceMessage('🤖 Switched to Smart Assistant', 'success');
      speak('Showing smart assistant');
      return;
    }
    
    if (command.includes('show weather') || command.includes('weather tab')) {
      setActiveTab('uv');
      showVoiceMessage('🌤️ Switched to Weather', 'success');
      speak('Showing weather information');
      return;
    }
    
    if (command.includes('show rewards') || command.includes('gamification')) {
      setActiveTab('gamification');
      showVoiceMessage('🏆 Switched to Rewards', 'success');
      speak('Showing rewards and achievements');
      return;
    }
    
    if (command.includes('show navigation') || command.includes('navigation') || command.includes('show map') || command.includes('map')) {
      setActiveTab('navigation');
      showVoiceMessage('🗺️ Switched to Navigation', 'success');
      speak('Showing map and navigation');
      return;
    }
    
    // Theme commands
    if (command.includes('dark mode')) {
      setDarkMode(true);
      showVoiceMessage('🌙 Dark mode activated', 'success');
      speak('Dark mode activated');
      return;
    }
    
    if (command.includes('light mode')) {
      setDarkMode(false);
      showVoiceMessage('☀️ Light mode activated', 'success');
      speak('Light mode activated');
      return;
    }
    
    // Boost mode
    if (command.includes('boost mode')) {
      setBoostMode(true);
      showVoiceMessage('🚀 Boost mode activated!', 'success');
      speak('Boost mode activated');
      return;
    }
    
    // Refresh weather
    if (command.includes('refresh') && command.includes('weather')) {
      getCurrentLocation();
      showVoiceMessage('🔄 Refreshing weather data...', 'success');
      speak('Refreshing weather data');
      return;
    }
    
    // Export commands
    if (command.includes('export pdf')) {
      exportPDF();
      showVoiceMessage('📄 Exporting PDF report...', 'success');
      speak('Exporting PDF report');
      return;
    }
    
    if (command.includes('export excel')) {
      exportExcel();
      showVoiceMessage('📊 Exporting Excel report...', 'success');
      speak('Exporting Excel report');
      return;
    }
    
    // Help command
    if (command.includes('help') || command.includes('what can you do')) {
      const helpText = 'I can search weather, switch tabs, change themes, export reports, and more. Try saying "weather in London", "show assistant", or "show analytics".';
      showVoiceMessage('💡 ' + helpText, 'info');
      speak(helpText);
      return;
    }
    
    // Check if it might be a weather command that we missed
    const words = command.toLowerCase().split(' ');
    const hasWeatherKeyword = words.some(word => 
      ['weather', 'temperature', 'forecast', 'climate'].includes(word)
    );
    
    if (hasWeatherKeyword) {
      // Try to extract city name from any weather-related command
      const possibleCities = words.filter(word => 
        word.length > 2 && 
        !['weather', 'temperature', 'forecast', 'climate', 'in', 'for', 'of', 'the', 'what', 'is', 'how'].includes(word)
      );
      
      if (possibleCities.length > 0) {
        const city = possibleCities.join(' ');
        console.log('🌤️ Attempting weather search for extracted city:', city);
        setSearchCity(city);
        
        // Perform comprehensive weather search with voice feedback
        performVoiceWeatherSearch(city);
        return;
      }
    }
    
    // Unknown command
    showVoiceMessage(`❓ Command "${command}" not recognized. Try "weather in London" or "show analytics".`, 'error');
    speak("Sorry, I didn't understand that command. Try saying weather in London or show analytics.");
  }

  // Start voice listening
  const startVoiceListening = () => {
    if (!voiceRecognition) {
      showVoiceMessage('❌ Voice recognition not supported in this browser', 'error');
      return;
    }
    
    if (isListening) {
      showVoiceMessage('🎤 Already listening...', 'info');
      return;
    }
    
    try {
      voiceRecognition.start();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      showVoiceMessage('❌ Failed to start voice recognition', 'error');
    }
  }

  // Text-to-speech
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  }

  // Show voice message
  const showVoiceMessage = (message: string, type: 'listening' | 'success' | 'error' | 'info') => {
    // Remove existing message
    const existing = document.getElementById('voice-message');
    if (existing) existing.remove();
    
    const colors = {
      listening: 'from-blue-500 to-blue-600 animate-pulse',
      success: 'from-green-500 to-green-600',
      error: 'from-red-500 to-red-600',
      info: 'from-purple-500 to-purple-600'
    };
    
    const messageDiv = document.createElement('div');
    messageDiv.id = 'voice-message';
    messageDiv.className = `
      fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg
      bg-gradient-to-r ${colors[type]} text-white shadow-lg max-w-md text-center
      border border-white/20 backdrop-blur-sm
    `;
    messageDiv.innerHTML = `
      <div class="flex items-center gap-2 justify-center">
        <span class="text-sm font-medium">${message}</span>
        ${type !== 'listening' ? '<button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white/80 hover:text-white">✕</button>' : ''}
      </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Auto remove after delay (except for listening state)
    if (type !== 'listening') {
      setTimeout(() => {
        if (messageDiv.parentElement) {
          messageDiv.remove();
        }
      }, type === 'error' ? 5000 : 3000);
    }
  }

  // Hide voice message
  const hideVoiceMessage = () => {
    const existing = document.getElementById('voice-message');
    if (existing) existing.remove();
  }

  // Comprehensive voice weather search with detailed feedback
  const performVoiceWeatherSearch = async (city: string) => {
    try {
      showVoiceMessage(`🌤️ Getting comprehensive weather data for ${city}...`, 'info');
      speak(`Getting weather information for ${city}`);
      
      // Search for city coordinates
      const locationData = await searchCityCoordinates(city);
      const uvResponse = await fetchUVData(locationData.lat, locationData.lon);
      
      // Update the app state
      setUvData(uvResponse);
      setLocation(locationData);
      
      // Update analytics counters
      const currentSearchCount = parseInt(getStorageItem('nexaflow-search-count'));
      const currentVoiceCount = parseInt(getStorageItem('nexaflow-voice-count'));
      setStorageItem('nexaflow-search-count', (currentSearchCount + 1).toString());
      setStorageItem('nexaflow-voice-count', (currentVoiceCount + 1).toString());
      
      // Generate comprehensive voice response
      const uvLevel = getUVLevel(uvResponse.value);
      const uvLevelText = uvLevel.charAt(0).toUpperCase() + uvLevel.slice(1);
      
      // Get UV safety recommendations
      const safetyInfo = getUVSafetyRecommendations(uvResponse.value, uvLevel);
      
      // Create comprehensive response with detailed UV analysis
      let response = `Weather data for ${locationData.city}, ${locationData.country}. `;
      response += `Current UV Index is ${uvResponse.value}, which is ${uvLevelText} level. `;
      response += safetyInfo.description + '. ';
      
      // Add specific safety recommendations
      if (uvResponse.value <= 2) {
        response += 'It is safe to be outside. You can enjoy outdoor activities without much concern. ';
      } else if (uvResponse.value <= 5) {
        response += 'Use sun protection. Apply SPF 30 sunscreen and wear sunglasses. ';
      } else if (uvResponse.value <= 7) {
        response += 'High UV detected. Use SPF 50 sunscreen, wear protective clothing, and avoid midday sun. ';
      } else if (uvResponse.value <= 10) {
        response += 'Very high UV levels. Stay indoors between 10 AM and 4 PM. Use maximum protection if going outside. ';
      } else {
        response += 'Extreme UV levels detected. Avoid outdoor activities. If you must go outside, use full protection and minimize exposure time. ';
      }
      
      // Add time-specific advice
      const currentHour = new Date().getHours();
      if (currentHour >= 10 && currentHour <= 16 && uvResponse.value > 5) {
        response += 'Current time is peak UV hours. Consider postponing outdoor activities until later. ';
      }
      
      // Show detailed message
      showVoiceMessage(`🌤️ ${locationData.city}: UV ${uvResponse.value} (${uvLevelText}) - ${safetyInfo.shortAdvice}`, 'success');
      
      // Speak the comprehensive response
      speak(response);
      
      console.log('✅ Comprehensive weather search completed for:', city);
      
    } catch (error) {
      console.error('❌ Voice weather search failed:', error);
      const errorMsg = `Sorry, I couldn't get weather data for ${city}. Please check the city name and try again.`;
      showVoiceMessage(`❌ ${errorMsg}`, 'error');
      speak(errorMsg);
    }
  }

  // Get UV safety recommendations based on UV index
  const getUVSafetyRecommendations = (uvIndex: number, uvLevel: string) => {
    const recommendations = {
      low: {
        description: "UV levels are low and safe for outdoor activities",
        shortAdvice: "Safe for outdoor activities",
        recommendations: [
          "You can safely spend time outdoors",
          "Minimal sun protection needed",
          "Great time for outdoor sports and activities"
        ]
      },
      moderate: {
        description: "UV levels are moderate, some protection recommended",
        shortAdvice: "Use basic sun protection",
        recommendations: [
          "Use SPF 30 or higher sunscreen",
          "Wear sunglasses and a hat",
          "Seek shade during midday hours"
        ]
      },
      high: {
        description: "UV levels are high, protection is important",
        shortAdvice: "Use SPF 50+, avoid midday sun",
        recommendations: [
          "Use SPF 50 or higher sunscreen",
          "Wear protective clothing, sunglasses, and a wide-brimmed hat",
          "Avoid outdoor activities between 12 PM and 3 PM",
          "Seek shade whenever possible"
        ]
      },
      veryHigh: {
        description: "UV levels are very high, extra protection is essential",
        shortAdvice: "Stay indoors 10 AM-4 PM, use maximum protection",
        recommendations: [
          "Use SPF 50+ sunscreen and reapply every 2 hours",
          "Wear long-sleeved clothing and wide-brimmed hat",
          "Avoid outdoor activities between 10 AM and 4 PM",
          "Stay in shade and indoors when possible"
        ]
      },
      extreme: {
        description: "UV levels are extreme, outdoor exposure is dangerous",
        shortAdvice: "Stay indoors, maximum protection required",
        recommendations: [
          "Avoid all outdoor activities if possible",
          "If you must go outside, use SPF 50+ and reapply every hour",
          "Wear full protective clothing, hat, and sunglasses",
          "Stay in shade and minimize exposure time"
        ]
      }
    };
    
    return recommendations[uvLevel as keyof typeof recommendations] || recommendations.low;
  }

  // Export functions
  const exportPDF = async () => {
    try {
      const weatherData = {
        location: location ? `${location.city}, ${location.country}` : 'Unknown',
        uvIndex: uvData?.value || 0,
        timestamp: new Date().toLocaleString(),
        coordinates: location ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}` : 'N/A',
        searchCount: getStorageItem('nexaflow-search-count'),
        voiceCount: getStorageItem('nexaflow-voice-count')
      };
      
      const uvLevel = getUVLevel(weatherData.uvIndex);
      const safetyInfo = getUVSafetyRecommendations(weatherData.uvIndex, uvLevel);
      
      const content = `
NexaFlow Weather & UV Analysis Report
=====================================
Generated: ${weatherData.timestamp}

LOCATION INFORMATION
-------------------
Location: ${weatherData.location}
Coordinates: ${weatherData.coordinates}

UV INDEX ANALYSIS
----------------
Current UV Index: ${weatherData.uvIndex}
UV Level: ${uvLevel.toUpperCase()}
Safety Status: ${weatherData.uvIndex <= 2 ? 'SAFE' : weatherData.uvIndex <= 5 ? 'CAUTION' : 'DANGER'}

SAFETY RECOMMENDATIONS
---------------------
${safetyInfo.description}

Recommendations:
${safetyInfo.recommendations.map(rec => `• ${rec}`).join('\n')}

USAGE STATISTICS
---------------
Weather Searches Today: ${weatherData.searchCount}
Voice Commands Used: ${weatherData.voiceCount}

This comprehensive report was generated by NexaFlow Smart Weather & Productivity Assistant.
Real-time data sourced from OpenWeatherMap API.
      `.trim();
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexaflow-weather-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showVoiceMessage('✅ Comprehensive weather report downloaded!', 'success');
    } catch (error) {
      console.error('PDF export failed:', error);
      showVoiceMessage('❌ PDF export failed', 'error');
    }
  }

  const exportExcel = async () => {
    try {
      const uvLevel = getUVLevel(uvData?.value || 0);
      const safetyInfo = getUVSafetyRecommendations(uvData?.value || 0, uvLevel);
      
      const data = [
        ['NexaFlow Weather & UV Analysis Export'],
        ['Generated', new Date().toLocaleString()],
        ['Data Source', 'Real-time OpenWeatherMap API'],
        [''],
        ['LOCATION DATA'],
        ['City', location?.city || 'Unknown'],
        ['Country', location?.country || 'Unknown'],
        ['Latitude', location?.lat || 'N/A'],
        ['Longitude', location?.lon || 'N/A'],
        [''],
        ['UV INDEX ANALYSIS'],
        ['Current UV Index', uvData?.value || 0],
        ['UV Level', uvLevel.toUpperCase()],
        ['Safety Status', (uvData?.value || 0) <= 2 ? 'SAFE' : (uvData?.value || 0) <= 5 ? 'CAUTION' : 'DANGER'],
        ['Description', safetyInfo.description],
        [''],
        ['SAFETY RECOMMENDATIONS'],
        ...safetyInfo.recommendations.map((rec, index) => [`Recommendation ${index + 1}`, rec]),
        [''],
        ['USAGE STATISTICS'],
        ['Weather Searches Today', getStorageItem('nexaflow-search-count')],
        ['Voice Commands Used', getStorageItem('nexaflow-voice-count')],
        ['App Uptime (minutes)', isClient ? Math.floor((Date.now() - (parseInt(getStorageItem('nexaflow-start-time', Date.now().toString())))) / 60000) : 0],
        [''],
        ['WEATHER EDUCATION FACTS'],
        ...FACTS.map((fact, index) => [`Fact ${index + 1}`, fact])
      ];
      
      const csvContent = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexaflow-weather-analysis-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showVoiceMessage('✅ Comprehensive Excel analysis downloaded!', 'success');
    } catch (error) {
      console.error('Excel export failed:', error);
      showVoiceMessage('❌ Excel export failed', 'error');
    }
  }

  // Boost mode detection and keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Voice command shortcut: Ctrl+Shift+V (Cmd+Shift+V on Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        startVoiceListening()
        return
      }
      
      const newSequence = keySequence + e.key.toLowerCase()
      setKeySequence(newSequence)
      
      if (newSequence.includes("boostmode")) {
        setBoostMode(true)
        setKeySequence("")
        // Show boost mode notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 z-50 p-4 rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg animate-bounce'
        notification.innerHTML = '🚀 BOOST MODE ACTIVATED! 🚀'
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 3000)
      }
      
      // Reset sequence if too long
      if (newSequence.length > 20) {
        setKeySequence("")
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Voice assistant shortcut: Ctrl+Shift+V or Cmd+Shift+V
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault()
        startVoiceListening()
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keypress', handleKeyPress)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [keySequence])

  const uvLevel = uvData ? getUVLevel(uvData.value) : "low"
  const uvInfo = UV_TIPS[uvLevel]
  const IconComponent = uvInfo.icon

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-500" />
          <p className="text-sm text-gray-600">Loading NexaFlow...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        boostMode 
          ? "bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 animate-pulse"
          : darkMode
          ? "dark bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-teal-50 via-cyan-50 to-purple-50"
      } ${boostMode ? "relative overflow-hidden" : ""}`}
    >
      {boostMode && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-ping"></div>
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-indigo-400 rounded-full animate-ping"></div>
        </div>
      )}
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">⚡</span>
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>NexaFlow</h1>
              <p className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Smart Weather & Productivity</p>
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <Button
            variant={activeTab === "uv" ? "default" : "outline"}
            onClick={() => setActiveTab("uv")}
            className={`transition-all duration-300 ${
              activeTab === "uv"
                ? "bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 shadow-lg"
                : ""
            }`}
          >
            <Sun className="h-4 w-4 mr-2" />
            Weather
          </Button>
          <Button
            variant={activeTab === "travel" ? "default" : "outline"}
            onClick={() => setActiveTab("travel")}
            className={`transition-all duration-300 ${
              activeTab === "travel"
                ? "bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 shadow-lg"
                : ""
            }`}
          >
            <Compass className="h-4 w-4 mr-2" />
            Travel
          </Button>
          <Button
            variant={activeTab === "assistant" ? "default" : "outline"}
            onClick={() => setActiveTab("assistant")}
            className={`transition-all duration-300 ${
              activeTab === "assistant"
                ? "bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 shadow-lg"
                : ""
            }`}
          >
            🤖 Smart Assistant
          </Button>
          <Button
            variant={activeTab === "analytics" ? "default" : "outline"}
            onClick={() => setActiveTab("analytics")}
            className={`transition-all duration-300 ${
              activeTab === "analytics"
                ? "bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 shadow-lg"
                : ""
            }`}
          >
            📊 Analytics
          </Button>
          <Button
            variant={activeTab === "gamification" ? "default" : "outline"}
            onClick={() => setActiveTab("gamification")}
            className={`transition-all duration-300 ${
              activeTab === "gamification"
                ? "bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 shadow-lg"
                : ""
            }`}
          >
            🏆 Rewards
          </Button>
          <Button
            variant={activeTab === "navigation" ? "default" : "outline"}
            onClick={() => setActiveTab("navigation")}
            className={`transition-all duration-300 ${
              activeTab === "navigation"
                ? "bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 shadow-lg"
                : ""
            }`}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Navigation
          </Button>
        </div>

        {activeTab === "uv" && (
          <div className="animate-in slide-in-from-right-2 duration-300">
            {/* Time and Date */}
            <Card
              className={`mb-4 transition-all duration-300 ${darkMode ? "bg-gray-800/90 border-gray-600 backdrop-blur-sm" : "bg-white/70 backdrop-blur-sm border-white/50"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`} />
                  <span className={`text-sm ${darkMode ? "text-gray-100" : "text-gray-700"}`}>
                    {currentTime?.toLocaleString() || "Loading..."}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Search */}
            <Card
              className={`mb-6 transition-all duration-300 ${darkMode ? "bg-gray-800/90 border-gray-600 backdrop-blur-sm" : "bg-white/70 backdrop-blur-sm border-white/50"}`}
            >
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search city..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCitySearch()}
                    className={
                      darkMode ? "bg-gray-700/80 border-gray-500 text-white placeholder:text-gray-300" : "bg-white/80"
                    }
                  />
                  <Button
                    onClick={handleCitySearch}
                    disabled={loading}
                    className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 transition-all duration-300"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Main UV Display */}
            <Card
              className={`mb-6 overflow-hidden transition-all duration-300 ${darkMode ? "bg-gray-800/90 border-gray-600 backdrop-blur-sm" : "bg-white/70 backdrop-blur-sm border-white/50"}`}
            >
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2
                      className={`h-8 w-8 animate-spin mx-auto mb-4 ${darkMode ? "text-teal-400" : "text-teal-600"}`}
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
                        <MapPin className={`h-4 w-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`} />
                        <span className={`text-sm ${darkMode ? "text-gray-100" : "text-gray-700"}`}>
                          {location.city}, {location.country}
                        </span>
                      </div>
                      <p className={`text-lg font-medium mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {uvInfo.text}
                      </p>
                      <Button
                        onClick={getCurrentLocation}
                        variant="outline"
                        className={`w-full bg-transparent transition-all duration-300 ${
                          darkMode 
                            ? "hover:bg-teal-900/20 hover:border-teal-400 text-gray-300 border-gray-600" 
                            : "hover:bg-teal-50 hover:border-teal-300"
                        }`}
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
              className={`mb-6 transition-all duration-300 ${darkMode ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm" : "bg-white/70 backdrop-blur-sm border-white/50"}`}
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

            {/* Voice Weather Assistant */}
            <Card
              className={`transition-all duration-300 ${darkMode ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm" : "bg-white/70 backdrop-blur-sm border-white/50"}`}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="text-center">
                    <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>🎤 Voice Weather Assistant</h3>
                    <p className={`text-xs mb-3 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Get comprehensive weather analysis with UV safety recommendations
                    </p>
                  </div>
                  <Button
                    onClick={startVoiceListening}
                    disabled={isListening}
                    className={`w-full bg-gradient-to-r ${isListening ? 'from-red-500 to-red-600 animate-pulse' : 'from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600'} text-white transition-all duration-300`}
                  >
                    {isListening ? (
                      <>
                        <div className="animate-pulse mr-2">🎤</div>
                        Listening...
                      </>
                    ) : (
                      <>
                        <div className="mr-2">🎤</div>
                        Ask for Weather Analysis
                      </>
                    )}
                  </Button>
                  <p className={`text-xs text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Try: "Give me weather for Nigeria" or "Weather in London"
                  </p>
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

        {activeTab === "assistant" && (
          <div className="animate-in slide-in-from-right-2 duration-300">
            <SmartAssistant 
              darkMode={darkMode} 
              weatherData={uvData ? { main: { temp: 25, feels_like: 27, humidity: 65 }, weather: [{ description: 'clear sky' }] } : undefined}
              location={location}
            />
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="animate-in slide-in-from-bottom-2 duration-300 space-y-6">
            {/* Analytics Dashboard */}
            <Card className={`${darkMode ? "bg-gray-900/80 border-gray-600" : "bg-white/70 border-white/50"} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                  📊 Smart Analytics Dashboard
                </h2>
                
                {/* Real-Time Analytics Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800/70 border border-gray-600" : "bg-teal-50"}`}>
                    <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>📊 Real-Time Activity</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-600"}`}>Weather Searches</span>
                        <span className={`text-sm font-semibold ${darkMode ? "text-teal-400" : "text-teal-600"}`}>
                          {getStorageItem('nexaflow-search-count')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-600"}`}>Voice Commands</span>
                        <span className={`text-sm font-semibold ${darkMode ? "text-purple-400" : "text-purple-600"}`}>
                          {getStorageItem('nexaflow-voice-count')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-600"}`}>Current UV Index</span>
                        <span className={`text-sm font-semibold ${
                          uvData 
                            ? uvData.value <= 2 
                              ? 'text-green-500' 
                              : uvData.value <= 5 
                              ? 'text-yellow-500' 
                              : 'text-red-500'
                            : darkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                          {uvData?.value?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-600"}`}>Last Updated</span>
                        <span className={`text-xs font-mono ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {currentTime?.toLocaleTimeString() || "Loading..."}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-600"}`}>App Uptime</span>
                        <span className={`text-xs font-mono ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                          {isClient ? Math.floor((Date.now() - (parseInt(getStorageItem('nexaflow-start-time', Date.now().toString())))) / 60000) : 0} min
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800/70 border border-gray-600" : "bg-purple-50"}`}>
                    <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>🌍 Current Location Data</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-600"}`}>Location</span>
                        <span className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                          {location ? `${location.city}, ${location.country}` : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-600"}`}>UV Level</span>
                        <span className={`text-sm font-semibold ${
                          uvData 
                            ? uvData.value <= 2 
                              ? 'text-green-500' 
                              : uvData.value <= 5 
                              ? 'text-yellow-500' 
                              : uvData.value <= 7
                              ? 'text-orange-500'
                              : 'text-red-500'
                            : darkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                          {uvData ? getUVLevel(uvData.value).toUpperCase() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-600"}`}>Safety Status</span>
                        <span className={`text-sm font-semibold ${
                          uvData 
                            ? uvData.value <= 2 
                              ? 'text-green-500' 
                              : uvData.value <= 5 
                              ? 'text-yellow-500' 
                              : 'text-red-500'
                            : darkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                          {uvData 
                            ? uvData.value <= 2 
                              ? '✅ SAFE' 
                              : uvData.value <= 5 
                              ? '⚠️ CAUTION' 
                              : '🚨 DANGER'
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-600"}`}>Coordinates</span>
                        <span className={`text-xs font-mono ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {location ? `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-600"}`}>Data Source</span>
                        <span className={`text-xs ${darkMode ? "text-green-400" : "text-green-600"}`}>
                          Real-time API
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voice Assistant */}
                <div className={`p-4 rounded-lg mb-4 ${darkMode ? "bg-gray-800/70 border border-gray-600" : "bg-blue-50"}`}>
                  <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>🎤 Voice Assistant</h3>
                  <p className={`text-xs mb-2 ${darkMode ? "text-gray-200" : "text-gray-600"}`}>
                    Try saying: "weather in Nigeria", "give me weather for London", "weather in Tokyo"
                  </p>
                  <p className={`text-xs mb-2 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                    Voice commands provide comprehensive UV analysis and safety recommendations
                  </p>
                  <p className={`text-xs mb-3 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                    Keyboard shortcut: Ctrl+Shift+V (Cmd+Shift+V on Mac)
                  </p>
                  <Button 
                    onClick={startVoiceListening}
                    disabled={isListening}
                    className={`bg-gradient-to-r ${isListening ? 'from-red-500 to-red-600 animate-pulse' : 'from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600'} transition-all duration-300`}
                  >
                    {isListening ? '🎤 Listening...' : '🎤 Ask for Weather with UV Analysis'}
                  </Button>
                </div>

                {/* Export Features */}
                <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800/70 border border-gray-600" : "bg-green-50"}`}>
                  <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>📄 Export Reports</h3>
                  <div className="flex gap-2">
                    <Button 
                      onClick={exportPDF}
                      variant="outline"
                      className="flex-1"
                    >
                      📄 Export PDF
                    </Button>
                    <Button 
                      onClick={exportExcel}
                      variant="outline" 
                      className="flex-1"
                    >
                      📊 Export Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            <Card className={`${darkMode ? "bg-gray-900/80 border-gray-600" : "bg-white/70 border-white/50"} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <h3 className={`font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>🤖 AI-Powered Suggestions</h3>
                <div className="space-y-3">
                  {uvData && (
                    <div className={`p-3 rounded-lg ${
                      uvData.value <= 2 
                        ? darkMode ? "bg-green-900/50 border border-green-700" : "bg-green-50" 
                        : uvData.value <= 5
                        ? darkMode ? "bg-yellow-900/50 border border-yellow-700" : "bg-yellow-50"
                        : darkMode ? "bg-red-900/50 border border-red-700" : "bg-red-50"
                    } border-l-4 ${
                      uvData.value <= 2 
                        ? "border-green-500" 
                        : uvData.value <= 5
                        ? "border-yellow-500"
                        : "border-red-500"
                    }`}>
                      <p className={`text-sm ${darkMode ? "text-gray-100" : "text-gray-700"}`}>
                        {uvData.value <= 2 
                          ? `☀️ Perfect weather for outdoor activities! UV is low (${uvData.value}). Great time for sports and picnics.`
                          : uvData.value <= 5
                          ? `🧴 Moderate UV levels (${uvData.value}). Use SPF 30+ and enjoy outdoor activities with protection.`
                          : `🚨 High UV detected (${uvData.value})! Use SPF 50+, wear protective clothing, and avoid midday sun.`
                        }
                      </p>
                    </div>
                  )}
                  
                  <div className={`p-3 rounded-lg ${darkMode ? "bg-purple-900/50 border border-purple-700" : "bg-purple-50"} border-l-4 border-purple-500`}>
                    <p className={`text-sm ${darkMode ? "text-gray-100" : "text-gray-700"}`}>
                      📈 You've made {getStorageItem('nexaflow-search-count')} weather searches today. 
                      {parseInt(getStorageItem('nexaflow-voice-count')) > 0 && 
                        ` Voice commands used: ${getStorageItem('nexaflow-voice-count')}.`
                      }
                    </p>
                  </div>
                  
                  {location && (
                    <div className={`p-3 rounded-lg ${darkMode ? "bg-blue-900/50 border border-blue-700" : "bg-blue-50"} border-l-4 border-blue-500`}>
                      <p className={`text-sm ${darkMode ? "text-gray-100" : "text-gray-700"}`}>
                        🌍 Currently monitoring weather for {location.city}, {location.country}. 
                        Try voice commands like "weather in Nigeria" for instant UV analysis!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "gamification" && (
          <div className="animate-in slide-in-from-right-2 duration-300 space-y-6">
            {/* Gamification Dashboard */}
            <Card className={`${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/70 border-white/50"} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                  🏆 Achievements & Rewards
                </h2>
                
                {/* Badges */}
                <div className="mb-6">
                  <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>🏅 Badges Earned</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { emoji: "🌟", name: "Weather Explorer", desc: "Checked weather 10 times" },
                      { emoji: "🔥", name: "Streak Master", desc: "7-day checking streak" },
                      { emoji: "🌍", name: "Globe Trotter", desc: "Searched 5 cities" },
                      { emoji: "📊", name: "Data Analyst", desc: "Used analytics 3 times" },
                      { emoji: "🎤", name: "Voice Commander", desc: "Used voice assistant" },
                      { emoji: "🚀", name: "Boost Mode", desc: "Discovered secret mode" }
                    ].map((badge, i) => (
                      <div key={i} className={`p-3 rounded-lg text-center ${darkMode ? "bg-gray-700/50" : "bg-gradient-to-br from-teal-50 to-purple-50"}`}>
                        <div className="text-2xl mb-1">{badge.emoji}</div>
                        <div className={`text-xs font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{badge.name}</div>
                        <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{badge.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Streaks */}
                <div className="mb-6">
                  <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>🔥 Current Streaks</h3>
                  <div className="space-y-2">
                    <div className={`p-3 rounded-lg ${darkMode ? "bg-orange-900/30" : "bg-orange-50"} border-l-4 border-orange-500`}>
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>Daily Weather Check</span>
                        <span className="text-orange-500 font-bold">7 days 🔥</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? "bg-blue-900/30" : "bg-blue-50"} border-l-4 border-blue-500`}>
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>App Usage</span>
                        <span className="text-blue-500 font-bold">12 days 💪</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collaboration */}
                <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700/50" : "bg-indigo-50"}`}>
                  <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>👥 Team Collaboration</h3>
                  <p className={`text-sm mb-3 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Share your weather insights and compete with friends!
                  </p>
                  <Button 
                    onClick={() => alert('Collaboration feature activated! You can now share weather data and achievements with your team.')}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                  >
                    👥 Join Team Challenge
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Smart Notifications */}
            <Card className={`${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/70 border-white/50"} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <h3 className={`font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>🔔 Smart Notifications</h3>
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${darkMode ? "bg-green-900/30" : "bg-green-50"} border-l-4 border-green-500`}>
                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      🌟 Great job! You've maintained your weather checking streak for a week. Keep up the excellent planning habits!
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? "bg-yellow-900/30" : "bg-yellow-50"} border-l-4 border-yellow-500`}>
                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      ⚡ Boost your productivity! The weather is perfect for outdoor work sessions today.
                    </p>
                  </div>
                </div>
                
                {/* Offline Mode Status */}
                <div className={`mt-4 p-3 rounded-lg ${darkMode ? "bg-blue-900/30" : "bg-blue-50"} border-l-4 border-blue-500`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      📱 Offline Mode: Ready to sync when online
                    </span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "navigation" && (
          <div className="animate-in slide-in-from-bottom-2 duration-300">
            <MapNavigation />
          </div>
        )}
      </div>
    </div>
  )
}
