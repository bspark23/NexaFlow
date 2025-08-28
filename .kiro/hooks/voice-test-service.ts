/**
 * NexaFlow Voice Test Service
 * 
 * This service provides comprehensive testing for the voice assistant
 * to ensure it works in real-time with proper error handling.
 * 
 * Created by Kiro AI for NexaFlow voice testing.
 */

import VoiceAssistantHook from './voice-assistant-hook';

export class VoiceTestService {
  private static instance: VoiceTestService;
  private voiceAssistant: VoiceAssistantHook;
  private testResults: { command: string; success: boolean; error?: string }[] = [];

  static getInstance(): VoiceTestService {
    if (!VoiceTestService.instance) {
      VoiceTestService.instance = new VoiceTestService();
    }
    return VoiceTestService.instance;
  }

  constructor() {
    this.voiceAssistant = VoiceAssistantHook.getInstance();
  }

  /**
   * Test if voice recognition is available
   */
  testVoiceRecognitionAvailability(): boolean {
    const isAvailable = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    console.log('🎤 Voice Recognition Available:', isAvailable);
    
    if (!isAvailable) {
      this.showTestResult('Voice Recognition Availability', false, 'SpeechRecognition API not supported in this browser');
    } else {
      this.showTestResult('Voice Recognition Availability', true);
    }
    
    return isAvailable;
  }

  /**
   * Test microphone permissions
   */
  async testMicrophonePermissions(): Promise<boolean> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the stream
        
        console.log('🎤 Microphone Permission: Granted');
        this.showTestResult('Microphone Permissions', true);
        return true;
      } else {
        throw new Error('getUserMedia not supported');
      }
    } catch (error) {
      console.error('🎤 Microphone Permission: Denied or Error', error);
      this.showTestResult('Microphone Permissions', false, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Test voice assistant initialization
   */
  testVoiceAssistantInitialization(): boolean {
    try {
      this.voiceAssistant.initialize();
      console.log('🎤 Voice Assistant: Initialized successfully');
      this.showTestResult('Voice Assistant Initialization', true);
      return true;
    } catch (error) {
      console.error('🎤 Voice Assistant: Initialization failed', error);
      this.showTestResult('Voice Assistant Initialization', false, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Test specific voice commands
   */
  async testVoiceCommands(): Promise<void> {
    const testCommands = [
      'weather in London',
      'show analytics',
      'show travel',
      'dark mode',
      'export pdf',
      'help'
    ];

    console.log('🧪 Testing voice commands...');
    
    for (const command of testCommands) {
      try {
        console.log(`Testing command: "${command}"`);
        this.voiceAssistant.testCommand(command);
        this.testResults.push({ command, success: true });
        await this.delay(1000); // Wait 1 second between commands
      } catch (error) {
        console.error(`Command "${command}" failed:`, error);
        this.testResults.push({ 
          command, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    this.displayTestResults();
  }

  /**
   * Run comprehensive voice assistant tests
   */
  async runComprehensiveTest(): Promise<void> {
    console.log('🚀 Starting comprehensive voice assistant tests...');
    
    const testResults = {
      voiceRecognition: this.testVoiceRecognitionAvailability(),
      microphone: await this.testMicrophonePermissions(),
      initialization: this.testVoiceAssistantInitialization(),
    };

    // Only test commands if basic functionality works
    if (testResults.voiceRecognition && testResults.microphone && testResults.initialization) {
      await this.testVoiceCommands();
    }

    this.showComprehensiveResults(testResults);
  }

  /**
   * Test real voice recognition (requires user interaction)
   */
  async testRealVoiceRecognition(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('🎤 Real voice test started - please say "test voice recognition"');
        this.showTestMessage('🎤 Voice test started - please say "test voice recognition"');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        console.log('🎤 Voice test result:', transcript);
        
        if (transcript.includes('test voice recognition')) {
          this.showTestResult('Real Voice Recognition', true, `Successfully recognized: "${transcript}"`);
          resolve();
        } else {
          this.showTestResult('Real Voice Recognition', false, `Unexpected result: "${transcript}"`);
          resolve();
        }
      };

      recognition.onerror = (event: any) => {
        console.error('🎤 Voice test error:', event.error);
        this.showTestResult('Real Voice Recognition', false, `Error: ${event.error}`);
        reject(new Error(event.error));
      };

      recognition.onend = () => {
        console.log('🎤 Voice test ended');
      };

      try {
        recognition.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Show test result
   */
  private showTestResult(testName: string, success: boolean, details?: string): void {
    const resultDiv = document.createElement('div');
    resultDiv.className = `
      fixed top-4 right-4 z-50 p-3 rounded-lg max-w-sm mb-2
      ${success ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}
      text-white shadow-lg border ${success ? 'border-green-400' : 'border-red-400'}
    `;
    
    resultDiv.innerHTML = `
      <div class="flex items-start gap-2">
        <span>${success ? '✅' : '❌'}</span>
        <div>
          <p class="text-sm font-semibold">${testName}</p>
          <p class="text-xs mt-1">${success ? 'PASSED' : 'FAILED'}</p>
          ${details ? `<p class="text-xs mt-1 opacity-90">${details}</p>` : ''}
        </div>
      </div>
    `;
    
    document.body.appendChild(resultDiv);
    
    setTimeout(() => {
      if (resultDiv.parentElement) {
        resultDiv.remove();
      }
    }, 5000);
  }

  /**
   * Show test message
   */
  private showTestMessage(message: string): void {
    const messageDiv = document.createElement('div');
    messageDiv.className = `
      fixed top-4 left-4 z-50 p-3 rounded-lg max-w-sm
      bg-gradient-to-r from-blue-500 to-blue-600 text-white
      shadow-lg border border-blue-400
    `;
    
    messageDiv.innerHTML = `
      <div class="flex items-start gap-2">
        <span>🧪</span>
        <div>
          <p class="text-sm font-semibold">Voice Test</p>
          <p class="text-xs mt-1">${message}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      if (messageDiv.parentElement) {
        messageDiv.remove();
      }
    }, 10000);
  }

  /**
   * Display comprehensive test results
   */
  private showComprehensiveResults(results: any): void {
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    console.log('🎤 Voice Assistant Test Results:');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log('📊 Detailed Results:', results);
    
    const summaryDiv = document.createElement('div');
    summaryDiv.className = `
      fixed bottom-4 right-4 z-50 p-4 rounded-lg max-w-sm
      bg-gradient-to-r from-purple-500 to-purple-600 text-white
      shadow-lg border border-purple-400
    `;
    
    summaryDiv.innerHTML = `
      <div>
        <p class="text-sm font-semibold">🎤 Voice Assistant Test Summary</p>
        <p class="text-xs mt-1">Passed: ${passedTests}/${totalTests} tests</p>
        <p class="text-xs mt-1">${passedTests === totalTests ? '✅ All systems operational!' : '⚠️ Some issues detected'}</p>
        <button onclick="this.parentElement.parentElement.remove()" class="text-xs mt-2 underline">Close</button>
      </div>
    `;
    
    document.body.appendChild(summaryDiv);
  }

  /**
   * Display test results for commands
   */
  private displayTestResults(): void {
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    console.log('🎤 Command Test Results:');
    console.log(`✅ Passed: ${passed}/${total}`);
    this.testResults.forEach(result => {
      console.log(`${result.success ? '✅' : '❌'} "${result.command}"${result.error ? ` - ${result.error}` : ''}`);
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add test buttons to the page
   */
  addTestButtons(): void {
    const testContainer = document.createElement('div');
    testContainer.className = 'fixed bottom-4 left-4 z-50 space-y-2';
    
    const buttons = [
      {
        text: '🧪 Test Voice System',
        onClick: () => this.runComprehensiveTest(),
        color: 'from-purple-500 to-purple-600'
      },
      {
        text: '🎤 Test Real Voice',
        onClick: () => this.testRealVoiceRecognition(),
        color: 'from-blue-500 to-blue-600'
      },
      {
        text: '⚡ Quick Voice Test',
        onClick: () => this.voiceAssistant.testCommand('weather in Tokyo'),
        color: 'from-green-500 to-green-600'
      }
    ];

    buttons.forEach(button => {
      const btn = document.createElement('button');
      btn.innerHTML = button.text;
      btn.className = `
        px-3 py-2 rounded-lg text-xs text-white
        bg-gradient-to-r ${button.color} hover:opacity-90
        transition-all duration-300 shadow-lg border border-white/20
        block w-full
      `;
      btn.onclick = button.onClick;
      testContainer.appendChild(btn);
    });

    document.body.appendChild(testContainer);
  }
}

export default VoiceTestService;