# NexaFlow - Smart Weather & Productivity App

NexaFlow is an intelligent weather application with integrated productivity features, including a smart assistant with voice capabilities and real-time navigation.

## 🌟 Features

### 🤖 Smart Assistant
- **Chat Interface**: Ask about weather conditions in any city
- **Voice Input/Output**: Speak your questions and get spoken responses
- **Weather Intelligence**: Get detailed weather information with safety recommendations

### 🗺️ Map & Navigation
- **Real-time GPS**: Automatic location detection using device GPS
- **Manual Destination Setting**: Set any destination manually
- **Live Navigation**: Visual map with route guidance
- **Voice Updates**: Spoken navigation updates every 30 minutes
- **Arrival Detection**: Automatic detection when you reach your destination

### 🌤️ Weather Features
- **UV Index Monitoring**: Real-time UV levels with safety advice
- **Weather Forecasting**: Current conditions and forecasts
- **Location-based Weather**: Automatic weather for your current location
- **City Search**: Search weather for any city worldwide

### 🎯 Productivity Enhancements
- **Travel Planning**: Smart travel suggestions based on weather
- **Health Advisors**: UV safety and air quality monitoring
- **Analytics Dashboard**: Track your app usage and weather patterns
- **Gamification**: Rewards and achievements system

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nexaflow-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎮 How to Use

### Smart Assistant
1. Click on the **"Smart Assistant"** tab
2. Switch to the **"Chat Assistant"** section
3. Type your weather question or click the microphone button to speak
4. Examples:
   - "What's the weather in Lagos?"
   - "Is it going to rain in Abuja today?"
   - "Tell me about the weather in London"

### Navigation
1. Go to the **"Map & Navigation"** section in the Smart Assistant
2. Allow location access when prompted
3. Enter your destination in the input field
4. Click **"Navigate"** to start real-time navigation
5. The app will provide voice updates every 30 minutes

### Weather Monitoring
1. Use the main **"Weather"** tab for detailed UV and weather information
2. Search for any city using the search bar
3. Get your current location weather automatically

## 🛠️ Technical Features

### Voice Recognition
- Uses Web Speech API for voice input
- Supports natural language weather queries
- Cross-browser compatibility

### Real-time Location
- GPS tracking using Geolocation API
- Automatic position updates
- Distance and time calculations

### Weather API Integration
- OpenWeatherMap API for accurate weather data
- UV index monitoring
- Geocoding for city searches

### Responsive Design
- Mobile-friendly interface
- Dark/light mode support
- Smooth animations and transitions

## 🔧 Configuration

The app uses OpenWeatherMap API for weather data. The API key is included for development purposes.

For production deployment, consider:
- Setting up your own OpenWeatherMap API key
- Configuring environment variables
- Setting up proper error handling

## 🌐 Browser Support

- Chrome/Chromium (recommended for full voice features)
- Firefox
- Safari
- Edge

**Note**: Voice recognition works best in Chrome-based browsers.

## 📱 Mobile Support

- Responsive design works on all screen sizes
- Touch-friendly interface
- GPS location access on mobile devices
- Voice input/output on supported mobile browsers

## 🔒 Privacy

- Location data is only used locally for navigation
- No personal data is stored on external servers
- Weather queries are sent to OpenWeatherMap API only

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Voice Recognition Not Working
- Ensure you're using a supported browser (Chrome recommended)
- Check microphone permissions
- Make sure you have an internet connection

### Location Not Detected
- Allow location access when prompted
- Check if location services are enabled on your device
- Try refreshing the page

### Weather Data Not Loading
- Check your internet connection
- Verify the city name spelling
- Try searching for a different location

## 🔮 Future Enhancements

- Offline map support
- Multi-language support
- Weather alerts and notifications
- Route optimization
- Integration with calendar apps
- Weather-based activity suggestions

---

Built with ❤️ using Next.js, React, and modern web technologies.