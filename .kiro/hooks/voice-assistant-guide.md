# NexaFlow Voice Assistant Guide

## 🎤 Voice Commands Overview

The NexaFlow Voice Assistant allows you to control the weather app using natural speech commands. Here's everything you need to know:

## 🚀 Getting Started

### 1. **Activation Methods**
- **Button**: Click the "🎤 Start Voice Command" button in the Analytics tab
- **Keyboard Shortcut**: Press `Ctrl+Shift+V` (Windows/Linux) or `Cmd+Shift+V` (Mac)
- **Demo Buttons**: Use the test buttons in development mode (localhost only)

### 2. **Browser Requirements**
- Chrome, Edge, Safari (latest versions)
- Microphone access permission required
- Internet connection for speech processing

## 📝 Available Voice Commands

### Weather Commands
- `"weather in London"` - Search weather for any city
- `"weather in New York"` - Search weather for specific locations
- `"refresh weather"` - Refresh current weather data
- `"current location"` - Get weather for your current location

### Navigation Commands
- `"show analytics"` - Switch to Analytics dashboard
- `"show travel"` - Open Travel planner
- `"show rewards"` - View Gamification/Rewards
- `"show weather"` - Return to main Weather view

### Theme Commands
- `"dark mode"` - Switch to dark theme
- `"light mode"` - Switch to light theme

### Special Commands
- `"boost mode"` - Activate the secret boost mode
- `"export pdf"` - Export report as PDF
- `"export excel"` - Export report as Excel
- `"help"` - Show available commands
- `"stop listening"` - Stop voice recognition

## 🔧 Troubleshooting

### Common Issues

#### "Microphone access denied"
**Solution**: 
1. Click the microphone icon in your browser's address bar
2. Select "Allow" for microphone access
3. Refresh the page and try again

#### "No speech detected"
**Solution**:
- Speak clearly and loudly
- Ensure your microphone is working
- Try moving closer to your microphone
- Check if other apps are using your microphone

#### "Voice recognition not supported"
**Solution**:
- Update your browser to the latest version
- Try using Chrome, Edge, or Safari
- Check if you're using HTTPS (required for microphone access)

#### "Network error occurred"
**Solution**:
- Check your internet connection
- Try refreshing the page
- Ensure you're not behind a restrictive firewall

## 💡 Tips for Best Results

### Speaking Tips
1. **Speak clearly** and at normal pace
2. **Use natural language** - the system understands conversational commands
3. **Wait for the listening indicator** before speaking
4. **Speak within 10 seconds** - the system auto-stops after timeout

### Command Examples
- ✅ Good: "weather in Tokyo"
- ✅ Good: "show me analytics"
- ✅ Good: "switch to dark mode"
- ❌ Avoid: "weather Tokyo" (missing connecting words)
- ❌ Avoid: Speaking too fast or mumbling

## 🧪 Testing & Development

### Demo Mode (localhost only)
When running on localhost, you'll see additional demo buttons:
- **🎤 Test Voice Commands** - Tests all commands automatically
- **⚡ Quick Test** - Tests a single command quickly

### Manual Testing
You can test commands without speaking by using the browser console:
```javascript
// Get the voice assistant instance
const voice = window.nexaflowVoice;

// Test a command
voice.testCommand("weather in Paris");
```

## 🔒 Privacy & Security

- **No data storage**: Voice commands are processed in real-time and not stored
- **Browser-based**: All processing happens in your browser
- **Microphone access**: Only used when actively listening for commands
- **HTTPS required**: Secure connection required for microphone access

## 🎯 Advanced Features

### Voice Feedback
The assistant provides audio feedback for:
- Command confirmation
- Error messages
- Action completion

### Smart Recognition
The system can understand variations like:
- "weather in London" or "show weather for London"
- "analytics" or "show analytics dashboard"
- "dark theme" or "switch to dark mode"

### Auto-timeout
- Commands automatically timeout after 10 seconds
- Prevents hanging or battery drain
- Clear error messages for timeout situations

## 🚀 Future Enhancements

Planned voice features:
- Multi-language support
- Custom voice commands
- Voice-controlled data entry
- Offline voice recognition
- Voice shortcuts for complex actions

---

**Need Help?** Try saying "help" to the voice assistant or check the browser console for detailed command information.