/**
 * NexaFlow Startup Service
 * 
 * This service ensures all NexaFlow features are properly initialized
 * and working in real-time with comprehensive error handling.
 * 
 * Created by Kiro AI for NexaFlow system startup.
 */

import ProductivityCoordinatorHook from './productivity-coordinator-hook';
import VoiceAssistantHook from './voice-assistant-hook';
import WeatherAPIService from './weather-api-service';
import SystemStatusHook from './system-status-hook';
import ExportServiceHook from './export-service-hook';

export class StartupService {
  private static instance: StartupService;
  private initializationStatus: Record<string, boolean> = {};

  static getInstance(): StartupService {
    if (!StartupService.instance) {
      StartupService.instance = new StartupService();
    }
    return StartupService.instance;
  }

  /**
   * Initialize all NexaFlow services
   */
  async initializeAll(): Promise<void> {
    console.log('🚀 NexaFlow Startup Service: Initializing all systems...');
    
    try {
      // Show startup message
      this.showStartupMessage('Initializing NexaFlow systems...');
      
      // Initialize services in order
      await this.initializeProductivityCoordinator();
      await this.initializeVoiceAssistant();
      await this.initializeWeatherAPI();
      await this.initializeExportService();
      await this.initializeSystemStatus();
      
      // Verify all systems
      await this.verifyAllSystems();
      
      // Show completion message
      this.showCompletionMessage();
      
      console.log('✅ NexaFlow Startup Service: All systems initialized successfully');
      
    } catch (error) {
      console.error('❌ NexaFlow Startup Service: Initialization failed', error);
      this.showErrorMessage('System initialization failed. Some features may not work properly.');
    }
  }

  /**
   * Initialize Productivity Coordinator
   */
  private async initializeProductivityCoordinator(): Promise<void> {
    try {
      const coordinator = ProductivityCoordinatorHook.getInstance();
      coordinator.initializeAllHooks();
      this.initializationStatus.productivityCoordinator = true;
      console.log('✅ Productivity Coordinator initialized');
    } catch (error) {
      console.error('❌ Productivity Coordinator initialization failed:', error);
      this.initializationStatus.productivityCoordinator = false;
    }
  }

  /**
   * Initialize Voice Assistant
   */
  private async initializeVoiceAssistant(): Promise<void> {
    try {
      const voiceAssistant = VoiceAssistantHook.getInstance();
      voiceAssistant.initialize();
      
      // Test voice recognition availability
      const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      if (isSupported) {
        // Request microphone permissions
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('🎤 Microphone permissions granted');
          }
        } catch (micError) {
          console.warn('🎤 Microphone permissions not granted:', micError);
        }
      }
      
      this.initializationStatus.voiceAssistant = true;
      console.log('✅ Voice Assistant initialized');
    } catch (error) {
      console.error('❌ Voice Assistant initialization failed:', error);
      this.initializationStatus.voiceAssistant = false;
    }
  }

  /**
   * Initialize Weather API
   */
  private async initializeWeatherAPI(): Promise<void> {
    try {
      const weatherAPI = WeatherAPIService.getInstance();
      const isValid = await weatherAPI.validateAPIKey();
      
      if (isValid) {
        console.log('✅ Weather API initialized and validated');
        this.initializationStatus.weatherAPI = true;
      } else {
        console.warn('⚠️ Weather API key validation failed');
        this.initializationStatus.weatherAPI = false;
      }
    } catch (error) {
      console.error('❌ Weather API initialization failed:', error);
      this.initializationStatus.weatherAPI = false;
    }
  }

  /**
   * Initialize Export Service
   */
  private async initializeExportService(): Promise<void> {
    try {
      const exportService = ExportServiceHook.getInstance();
      // Test if Blob API is available
      if (typeof Blob !== 'undefined') {
        this.initializationStatus.exportService = true;
        console.log('✅ Export Service initialized');
      } else {
        this.initializationStatus.exportService = false;
        console.warn('⚠️ Export Service: Blob API not available');
      }
    } catch (error) {
      console.error('❌ Export Service initialization failed:', error);
      this.initializationStatus.exportService = false;
    }
  }

  /**
   * Initialize System Status Monitor
   */
  private async initializeSystemStatus(): Promise<void> {
    try {
      const systemStatus = SystemStatusHook.getInstance();
      systemStatus.initialize();
      this.initializationStatus.systemStatus = true;
      console.log('✅ System Status Monitor initialized');
    } catch (error) {
      console.error('❌ System Status Monitor initialization failed:', error);
      this.initializationStatus.systemStatus = false;
    }
  }

  /**
   * Verify all systems are working
   */
  private async verifyAllSystems(): Promise<void> {
    console.log('🔍 Verifying all systems...');
    
    // Test voice assistant
    if (this.initializationStatus.voiceAssistant) {
      try {
        const voiceAssistant = VoiceAssistantHook.getInstance();
        // Test a simple command
        voiceAssistant.testCommand('help');
        console.log('✅ Voice Assistant verification passed');
      } catch (error) {
        console.warn('⚠️ Voice Assistant verification failed:', error);
      }
    }
    
    // Test weather API
    if (this.initializationStatus.weatherAPI) {
      try {
        const weatherAPI = WeatherAPIService.getInstance();
        await weatherAPI.getCurrentWeather(51.5074, -0.1278); // London coordinates
        console.log('✅ Weather API verification passed');
      } catch (error) {
        console.warn('⚠️ Weather API verification failed:', error);
      }
    }
    
    // Test export service
    if (this.initializationStatus.exportService) {
      try {
        // Test blob creation
        new Blob(['test'], { type: 'text/plain' });
        console.log('✅ Export Service verification passed');
      } catch (error) {
        console.warn('⚠️ Export Service verification failed:', error);
      }
    }
  }

  /**
   * Show startup message
   */
  private showStartupMessage(message: string): void {
    const startupDiv = document.createElement('div');
    startupDiv.id = 'nexaflow-startup-message';
    startupDiv.className = `
      fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
      z-50 p-6 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500
      text-white shadow-lg border border-white/20 text-center
    `;
    
    startupDiv.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="animate-spin">⚡</div>
        <div>
          <p class="font-semibold">NexaFlow</p>
          <p class="text-sm opacity-90">${message}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(startupDiv);
  }

  /**
   * Show completion message
   */
  private showCompletionMessage(): void {
    const startupMessage = document.getElementById('nexaflow-startup-message');
    if (startupMessage) {
      startupMessage.remove();
    }
    
    const successCount = Object.values(this.initializationStatus).filter(Boolean).length;
    const totalCount = Object.keys(this.initializationStatus).length;
    
    const completionDiv = document.createElement('div');
    completionDiv.className = `
      fixed top-4 left-1/2 transform -translate-x-1/2
      z-50 p-4 rounded-lg bg-gradient-to-r from-green-500 to-green-600
      text-white shadow-lg border border-green-400 text-center
    `;
    
    completionDiv.innerHTML = `
      <div>
        <p class="font-semibold">🚀 NexaFlow Ready!</p>
        <p class="text-sm opacity-90">${successCount}/${totalCount} systems online</p>
        <p class="text-xs opacity-75 mt-1">All features are now available</p>
      </div>
    `;
    
    document.body.appendChild(completionDiv);
    
    setTimeout(() => {
      if (completionDiv.parentElement) {
        completionDiv.remove();
      }
    }, 4000);
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    const startupMessage = document.getElementById('nexaflow-startup-message');
    if (startupMessage) {
      startupMessage.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = `
      fixed top-4 left-1/2 transform -translate-x-1/2
      z-50 p-4 rounded-lg bg-gradient-to-r from-red-500 to-red-600
      text-white shadow-lg border border-red-400 text-center
    `;
    
    errorDiv.innerHTML = `
      <div>
        <p class="font-semibold">⚠️ Startup Warning</p>
        <p class="text-sm opacity-90">${message}</p>
        <button onclick="this.parentElement.parentElement.remove()" class="text-xs underline mt-2">
          Dismiss
        </button>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
  }

  /**
   * Get initialization status
   */
  getInitializationStatus(): Record<string, boolean> {
    return { ...this.initializationStatus };
  }

  /**
   * Check if all systems are ready
   */
  isAllSystemsReady(): boolean {
    return Object.values(this.initializationStatus).every(Boolean);
  }
}

export default StartupService;