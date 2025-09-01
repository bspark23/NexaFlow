"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageCircle, Mic, MicOff, Volume2, VolumeX, Send, Bot, User,
  Loader2, Square
} from "lucide-react"

interface SmartAssistantProps {
  darkMode: boolean
  weatherData?: any
  location?: { city: string; country: string; lat: number; lon: number } | null
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  message: string
  timestamp: Date
  isSpoken?: boolean
}

export function SmartAssistant({ darkMode, weatherData, location }: SmartAssistantProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  
  const chatEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  const WEATHER_API_KEY = "f68e14d9f5d8fffea3bd365b3a9f8e4d"

  // Initialize assistant
  useEffect(() => {
    initializeAssistant()
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const initializeAssistant = () => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      
      recognition.onstart = () => setIsListening(true)
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
        setTimeout(() => handleSendMessage(transcript), 500)
      }
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => {
        setIsListening(false)
        showNotification('Voice recognition failed. Please try again.', 'error')
      }
      
      recognitionRef.current = recognition
    }

    // Welcome message
    const welcomeMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'assistant',
      message: "Hello! I'm your weather assistant. I can help you with weather information for any location. Try asking me about the weather!",
      timestamp: new Date()
    }
    setChatMessages([welcomeMessage])
    
    if (voiceEnabled) {
      speak(welcomeMessage.message)
    }
  }

  const handleSendMessage = async (message?: string) => {
    const messageText = message || inputMessage.trim()
    if (!messageText || isProcessing) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      message: messageText,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsProcessing(true)

    try {
      const response = await processWeatherQuery(messageText)
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'assistant',
        message: response,
        timestamp: new Date(),
        isSpoken: voiceEnabled
      }
      
      setChatMessages(prev => [...prev, assistantMessage])
      
      if (voiceEnabled) {
        speak(response)
      }
    } catch (error) {
      console.error('Error processing message:', error)
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'assistant',
        message: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const processWeatherQuery = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase()
    
    // Weather queries
    if (lowerQuery.includes('weather') || lowerQuery.includes('temperature') || lowerQuery.includes('rain') || lowerQuery.includes('sunny')) {
      const cityMatch = query.match(/(?:in|for|at)\s+([a-zA-Z\s]+)/i) || 
                      query.match(/([a-zA-Z\s]+)\s+weather/i)
      
      if (cityMatch) {
        const city = cityMatch[1].trim()
        try {
          const coords = await getCoordinates(city)
          const weather = await getWeatherData(coords.lat, coords.lon)
          
          const temp = Math.round(weather.main.temp)
          const feelsLike = Math.round(weather.main.feels_like)
          const description = weather.weather[0].description
          const humidity = weather.main.humidity
          const windSpeed = Math.round(weather.wind.speed)
          
          let response = `The weather in ${city} is currently ${temp}°C with ${description}. `
          response += `It feels like ${feelsLike}°C. `
          response += `Humidity is ${humidity}% and wind speed is ${windSpeed} meters per second. `
          
          // Add weather-specific advice
          if (lowerQuery.includes('rain')) {
            if (description.includes('rain')) {
              response += "Yes, it's raining there. Don't forget an umbrella!"
            } else {
              response += "No rain is currently reported in the area."
            }
          }
          
          return response
        } catch (error) {
          return `I couldn't find weather information for "${city}". Please check the spelling and try again.`
        }
      } else if (location) {
        // Use current location
        const temp = Math.round(weatherData?.main?.temp || 0)
        const description = weatherData?.weather?.[0]?.description || 'unknown'
        return `The current weather in ${location.city} is ${temp}°C with ${description}.`
      } else {
        return "Please specify a city for weather information, like 'What's the weather in Lagos?'"
      }
    }
    
    // General responses
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
      return "Hello! I'm your weather assistant. I can help you with weather information for any location. Try asking me about the weather!"
    }
    
    if (lowerQuery.includes('help')) {
      return "I can help you with weather information for any location. Just ask me about the weather in a specific city!"
    }
    
    // Default response
    return "I'm your weather assistant! I can help you with weather information for any location. What city would you like to know about?"
  }

  const startVoiceListening = () => {
    if (!recognitionRef.current) {
      showNotification('Voice recognition not supported in this browser', 'error')
      return
    }
    
    if (isListening) return
    
    try {
      recognitionRef.current.start()
    } catch (error) {
      console.error('Failed to start voice recognition:', error)
      showNotification('Failed to start voice recognition', 'error')
    }
  }

  const speak = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return
    
    setIsSpeaking(true)
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.8
    utterance.pitch = 1
    utterance.volume = 0.8
    
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  // Navigation functions removed - using dedicated navigation page

  // Helper functions
  const getCoordinates = async (location: string) => {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${WEATHER_API_KEY}`
    )
    const data = await response.json()
    if (data.length === 0) throw new Error(`Location "${location}" not found`)
    return { lat: data[0].lat, lon: data[0].lon }
  }

  const getWeatherData = async (lat: number, lon: number) => {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    )
    return await response.json()
  }

  const calculateDistance = (from: { lat: number; lon: number }, to: { lat: number; lon: number }): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (to.lat - from.lat) * Math.PI / 180
    const dLon = (to.lon - from.lon) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const showNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    const colors = {
      info: 'from-blue-500 to-blue-600',
      success: 'from-green-500 to-green-600',
      warning: 'from-yellow-500 to-orange-500',
      error: 'from-red-500 to-red-600'
    }

    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg max-w-sm bg-gradient-to-r ${colors[type]} text-white shadow-lg border border-white/20 backdrop-blur-sm`
    notification.innerHTML = `
      <div class="flex items-start gap-2">
        <span class="text-sm font-medium">${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white/80 hover:text-white text-lg leading-none">×</button>
      </div>
    `

    document.body.appendChild(notification)
    setTimeout(() => {
      if (notification.parentElement) notification.remove()
    }, 5000)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className={`grid w-full grid-cols-1 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Smart Weather Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <Card className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/70 border-white/50'} backdrop-blur-sm`}>
            <CardHeader>
              <CardTitle className={`flex items-center justify-between ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-teal-500" />
                  Weather Chat Assistant
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={voiceEnabled ? 'bg-teal-50 border-teal-200' : ''}
                  >
                    {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                  {isSpeaking && (
                    <Button variant="outline" size="sm" onClick={stopSpeaking}>
                      <Square className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chat Messages */}
                <div className={`h-96 overflow-y-auto p-4 rounded-lg border ${darkMode ? 'bg-gray-900/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-teal-500 to-purple-500 text-white'
                            : darkMode
                            ? 'bg-gray-700 text-white'
                            : 'bg-white text-gray-800 border'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.type === 'assistant' && <Bot className="h-4 w-4 mt-1 text-teal-500" />}
                          {message.type === 'user' && <User className="h-4 w-4 mt-1" />}
                          <div>
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-white/70' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start mb-4">
                      <div className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white border'}`}>
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-teal-500" />
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about weather... (e.g., 'What's the weather in Lagos?')"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    disabled={isProcessing}
                  />
                  <Button
                    onClick={startVoiceListening}
                    variant="outline"
                    disabled={isListening || isProcessing}
                    className={isListening ? 'bg-red-50 border-red-200' : ''}
                  >
                    {isListening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isProcessing}
                    className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  )
}