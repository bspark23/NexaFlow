"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

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
}

interface WeatherChartProps {
  weatherData: WeatherData
  darkMode: boolean
}

export function WeatherChart({ weatherData, darkMode }: WeatherChartProps) {
  const next7Days = weatherData.daily.slice(0, 7)

  return (
    <Card
      className={`transition-all duration-300 ${
        darkMode ? "bg-gray-800/50 border-gray-700 backdrop-blur-sm" : "bg-white/70 backdrop-blur-sm border-white/50"
      }`}
    >
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
          <BarChart3 className="h-5 w-5 text-blue-500" />
          7-Day Weather Forecast
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Temperature Chart */}
          <div>
            <h4 className={`text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Temperature Trend (°C)
            </h4>
            <div className="grid grid-cols-7 gap-2">
              {next7Days.map((day, index) => {
                const date = new Date(day.dt * 1000)
                const dayName = date.toLocaleDateString("en", { weekday: "short" })
                const maxTemp = Math.max(...next7Days.map((d) => d.temp.max))
                const minTemp = Math.min(...next7Days.map((d) => d.temp.min))
                const tempRange = maxTemp - minTemp
                const dayHeight = tempRange > 0 ? ((day.temp.day - minTemp) / tempRange) * 100 : 50

                return (
                  <div key={index} className="text-center">
                    <p className={`text-xs mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{dayName}</p>
                    <div className="relative h-20 bg-gray-200 rounded-full mx-auto w-4 overflow-hidden">
                      <div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-blue-400 to-red-400 rounded-full transition-all duration-1000"
                        style={{ height: `${dayHeight}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs mt-2 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {Math.round(day.temp.day)}°
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* UV Index Chart */}
          <div>
            <h4 className={`text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              UV Index Forecast
            </h4>
            <div className="grid grid-cols-7 gap-2">
              {next7Days.map((day, index) => {
                const date = new Date(day.dt * 1000)
                const dayName = date.toLocaleDateString("en", { weekday: "short" })
                const uvHeight = (day.uvi / 11) * 100 // Max UV is typically 11+

                return (
                  <div key={index} className="text-center">
                    <p className={`text-xs mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{dayName}</p>
                    <div className="relative h-16 bg-gray-200 rounded-full mx-auto w-4 overflow-hidden">
                      <div
                        className={`absolute bottom-0 w-full rounded-full transition-all duration-1000 ${
                          day.uvi <= 2
                            ? "bg-gradient-to-t from-green-400 to-green-500"
                            : day.uvi <= 5
                              ? "bg-gradient-to-t from-yellow-400 to-yellow-500"
                              : day.uvi <= 7
                                ? "bg-gradient-to-t from-orange-400 to-orange-500"
                                : day.uvi <= 10
                                  ? "bg-gradient-to-t from-red-400 to-red-500"
                                  : "bg-gradient-to-t from-purple-400 to-purple-500"
                        }`}
                        style={{ height: `${Math.max(uvHeight, 5)}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs mt-2 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {day.uvi.toFixed(1)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
