/**
 * NexaFlow Voice Assistant Hook
 * 
 * This hook enables voice control for weather queries and app navigation,
 * allowing users to trigger actions through speech commands.
 * 
 * Created by Kiro AI for NexaFlow productivity enhancements.
 */

interface VoiceCommand {
  pattern: RegExp;
  action: string;
  handler: (matches: RegExpMatchArray) => void;
}

export class VoiceAssistantHook {
  private static instance: VoiceAssistantHook;
  private recognition: any = null;
  private isListening: boolean = false;
  private commands: VoiceCommand[] = [];

  static getInstance(): VoiceAssistantHook {
    if (!VoiceAssistantHook.instance) {
      VoiceAssistantHook.instance = new VoiceAssistantHook();
    }
    return VoiceAssistantHook.instance;
  }

  /**
   * Initialize voice assistant
   */
  initialize(): void {
    if (!this.isWebSpeechSupported()) {
      console.log('🎤 Web Speech API not supported');
      this.showUnsupportedMessage();
      return;
    }

    this.setupSpeechRecognition();
    this.registerCommands();
    this.requestMicrophonePermission();
    console.log('🎤 NexaFlow Voice Assistant initialized');
  }

  /**
   * Start listening for voice commands
   */
  startListening(): void {
    if (!this.recognition) {
      this.showErrorMessage('Voice recognition not available. Please check your browser compatibility.');
      return;
    }
    
    if (this.isListening) {
      this.showErrorMessage('Already listening for voice commands.');
      return;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      this.showListeningIndicator();
      console.log('🎤 Voice Assistant: Listening...');
      
      // Auto-stop after 10 seconds to prevent hanging
      setTimeout(() => {
        if (this.isListening) {
          this.stopListening();
          this.showErrorMessage('Voice command timeout. Please try again.');
        }
      }, 10000);
    } catch (error) {
      console.error('Voice recognition error:', error);
      this.showErrorMessage('Failed to start voice recognition. Please try again.');
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.hideListeningIndicator();
      console.log('🎤 Voice Assistant: Stopped listening');
    }
  }

  /**
   * Process voice command
   */
  private processCommand(transcript: string): void {
    const command = transcript.toLowerCase().trim();
    console.log('🎤 Voice command received:', command);

    // Find matching command
    for (const cmd of this.commands) {
      const matches = command.match(cmd.pattern);
      if (matches) {
        console.log('🎤 Executing command:', cmd.action);
        this.showSuccessMessage(`Command recognized: "${transcript}"`);
        cmd.handler(matches);
        this.speak(`Executing ${cmd.action}`);
        return;
      }
    }

    // No command found
    this.showErrorMessage(`Command not recognized: "${transcript}". Try: "weather in London", "show analytics", "dark mode"`);
    this.speak("Sorry, I didn't understand that command. Try saying 'weather in London' or 'show analytics'.");
  }

  /**
   * Text-to-speech
   */
  private speak(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  }

  /**
   * Register voice commands
   */
  private registerCommands(): void {
    this.commands = [
      {
        pattern: /weather\s+in\s+(.+)/,
        action: 'search weather',
        handler: (matches) => this.searchWeather(matches[1])
      },
      {
        pattern: /show\s+(analytics|dashboard)/,
        action: 'show analytics',
        handler: () => this.switchTab('analytics')
      },
      {
        pattern: /show\s+(rewards|achievements|gamification)/,
        action: 'show rewards',
        handler: () => this.switchTab('gamification')
      },
      {
        pattern: /show\s+(travel|eco\s+travel)/,
        action: 'show travel planner',
        handler: () => this.switchTab('travel')
      },
      {
        pattern: /show\s+(weather|uv\s+index)/,
        action: 'show weather',
        handler: () => this.switchTab('uv')
      },
      {
        pattern: /(dark|light)\s+mode/,
        action: 'toggle theme',
        handler: (matches) => this.toggleTheme(matches[1])
      },
      {
        pattern: /boost\s+mode/,
        action: 'activate boost mode',
        handler: () => this.activateBoostMode()
      },
      {
        pattern: /export\s+(pdf|excel)/,
        action: 'export report',
        handler: (matches) => this.exportReport(matches[1] as 'pdf' | 'excel')
      },
      {
        pattern: /refresh\s+weather/,
        action: 'refresh weather',
        handler: () => this.refreshWeather()
      },
      {
        pattern: /help|what\s+can\s+you\s+do/,
        action: 'show help',
        handler: () => this.showHelp()
      },
      {
        pattern: /stop\s+listening/,
        action: 'stop listening',
        handler: () => this.stopListening()
      },
      {
        pattern: /current\s+location/,
        action: 'get current location',
        handler: () => this.getCurrentLocationWeather()
      }
    ];
  }

  /**
   * Command handlers
   */
  private searchWeather(city: string): void {
    const searchInput = document.querySelector('input[placeholder*="Search city"]') as HTMLInputElement;
    const searchButton = document.querySelector('button svg')?.parentElement as HTMLButtonElement;
    
    if (searchInput && searchButton) {
      searchInput.value = city;
      searchButton.click();
      
      // Track analytics
      if (window.nexaflowAnalytics) {
        window.nexaflowAnalytics.trackActivity('voice_command', { command: 'weather_search', city });
      }
    }
  }

  private switchTab(tab: string): void {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      const text = button.textContent?.toLowerCase();
      if ((tab === 'analytics' && text?.includes('analytics')) ||
          (tab === 'gamification' && text?.includes('rewards')) ||
          (tab === 'travel' && text?.includes('travel')) ||
          (tab === 'uv' && text?.includes('weather'))) {
        button.click();
      }
    });

    // Track analytics
    if (window.nexaflowAnalytics) {
      window.nexaflowAnalytics.trackActivity('voice_command', { command: 'tab_switch', tab });
    }
  }

  private toggleTheme(mode: string): void {
    const themeButton = document.querySelector('button[class*="ghost"]') as HTMLButtonElement;
    if (themeButton) {
      themeButton.click();
    }

    // Track analytics
    if (window.nexaflowAnalytics) {
      window.nexaflowAnalytics.trackActivity('voice_command', { command: 'theme_toggle', mode });
    }
  }

  private activateBoostMode(): void {
    // Simulate typing "boostmode"
    const event = new KeyboardEvent('keypress', { key: 'b' });
    document.dispatchEvent(event);
    setTimeout(() => {
      'oostmode'.split('').forEach((char, i) => {
        setTimeout(() => {
          const evt = new KeyboardEvent('keypress', { key: char });
          document.dispatchEvent(evt);
        }, i * 100);
      });
    }, 100);

    // Track analytics
    if (window.nexaflowAnalytics) {
      window.nexaflowAnalytics.trackActivity('voice_command', { command: 'boost_mode' });
    }
  }

  private async exportReport(format: 'pdf' | 'excel'): Promise<void> {
    try {
      // Import and use the export service
      const { default: ExportServiceHook } = await import('./export-service-hook');
      const exportService = ExportServiceHook.getInstance();
      
      if (format === 'pdf') {
        await exportService.exportPDF();
      } else if (format === 'excel') {
        await exportService.exportExcel();
      }
      
      this.showSuccessMessage(`${format.toUpperCase()} export completed successfully!`);
    } catch (error) {
      console.error('Export failed:', error);
      this.showErrorMessage(`Failed to export ${format.toUpperCase()}. Please try again.`);
    }

    // Track analytics
    if (window.nexaflowAnalytics) {
      window.nexaflowAnalytics.trackActivity('voice_command', { command: 'export', format });
    }
  }

  private refreshWeather(): void {
    const refreshButton = document.querySelector('button svg[class*="RefreshCw"]')?.parentElement as HTMLButtonElement;
    if (refreshButton) {
      refreshButton.click();
    }

    // Track analytics
    if (window.nexaflowAnalytics) {
      window.nexaflowAnalytics.trackActivity('voice_command', { command: 'refresh_weather' });
    }
  }

  private showHelp(): void {
    const helpMessage = `
      Available voice commands:
      • "weather in [city]" - Search weather for a city
      • "show analytics" - View analytics dashboard
      • "show travel" - Open travel planner
      • "dark mode" or "light mode" - Toggle theme
      • "boost mode" - Activate boost mode
      • "refresh weather" - Refresh current weather
      • "help" - Show this help message
    `;
    
    this.showSuccessMessage('Voice commands available - check console for full list');
    console.log('🎤 NexaFlow Voice Commands:', helpMessage);
    this.speak('Voice commands available. Check the console for a full list of commands.');
  }

  private getCurrentLocationWeather(): void {
    const refreshButton = document.querySelector('button svg[class*="RefreshCw"]')?.parentElement as HTMLButtonElement;
    if (refreshButton) {
      refreshButton.click();
    }
    this.speak('Getting weather for your current location');
  }

  /**
   * Test method to simulate voice commands (for development/testing)
   */
  public testCommand(transcript: string): void {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      this.processCommand(transcript);
    }
  }

  /**
   * Setup speech recognition
   */
  private setupSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      console.log('🎤 Speech recognition result received');
      if (event.results && event.results.length > 0) {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Transcript:', transcript);
        this.processCommand(transcript);
      }
    };

    this.recognition.onend = () => {
      console.log('🎤 Speech recognition ended');
      this.isListening = false;
      this.hideListeningIndicator();
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      this.hideListeningIndicator();
      
      switch (event.error) {
        case 'not-allowed':
          this.showErrorMessage('Microphone access denied. Please allow microphone access and try again.');
          break;
        case 'no-speech':
          this.showErrorMessage('No speech detected. Please speak clearly and try again.');
          break;
        case 'audio-capture':
          this.showErrorMessage('No microphone found. Please check your microphone connection.');
          break;
        case 'network':
          this.showErrorMessage('Network error. Please check your internet connection.');
          break;
        case 'aborted':
          console.log('Speech recognition aborted');
          break;
        default:
          this.showErrorMessage(`Voice recognition error: ${event.error}. Please try again.`);
      }
    };
  }

  /**
   * Check if Web Speech API is supported
   */
  private isWebSpeechSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  /**
   * Show listening indicator
   */
  private showListeningIndicator(): void {
    const indicator = document.createElement('div');
    indicator.id = 'voice-listening-indicator';
    indicator.className = `
      fixed top-4 left-4 z-50 p-3 rounded-full
      bg-gradient-to-r from-red-500 to-pink-500 text-white
      animate-pulse shadow-lg
    `;
    indicator.innerHTML = '🎤 Listening...';
    document.body.appendChild(indicator);
  }

  /**
   * Hide listening indicator
   */
  private hideListeningIndicator(): void {
    const indicator = document.getElementById('voice-listening-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = `
      fixed top-4 left-4 z-50 p-3 rounded-lg max-w-sm
      bg-gradient-to-r from-red-500 to-red-600 text-white
      shadow-lg border border-red-400
    `;
    errorDiv.innerHTML = `
      <div class="flex items-start gap-2">
        <span>🚫</span>
        <div>
          <p class="text-sm font-semibold">Voice Assistant Error</p>
          <p class="text-xs mt-1">${message}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 5000);
  }

  /**
   * Show unsupported message
   */
  private showUnsupportedMessage(): void {
    console.log('Voice recognition not supported in this browser');
  }

  /**
   * Request microphone permission
   */
  private async requestMicrophonePermission(): Promise<void> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('🎤 Microphone permission granted');
      }
    } catch (error) {
      console.warn('🎤 Microphone permission not granted:', error);
    }
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    const successDiv = document.createElement('div');
    successDiv.className = `
      fixed top-4 left-4 z-50 p-3 rounded-lg max-w-sm
      bg-gradient-to-r from-green-500 to-green-600 text-white
      shadow-lg border border-green-400
    `;
    successDiv.innerHTML = `
      <div class="flex items-start gap-2">
        <span>✅</span>
        <div>
          <p class="text-sm font-semibold">Voice Command</p>
          <p class="text-xs mt-1">${message}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (successDiv.parentElement) {
        successDiv.remove();
      }
    }, 3000);
  }
}

// Extend window object for global access
declare global {
  interface Window {
    nexaflowVoice: VoiceAssistantHook;
    nexaflowAnalytics: any;
  }
}

// Initialize voice assistant when page loads
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const voiceAssistant = VoiceAssistantHook.getInstance();
    voiceAssistant.initialize();
    window.nexaflowVoice = voiceAssistant;
    
    // Add keyboard shortcut (Ctrl/Cmd + Shift + V) to start voice commands
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'V') {
        event.preventDefault();
        voiceAssistant.startListening();
      }
    });
  });
}

export default VoiceAssistantHook;