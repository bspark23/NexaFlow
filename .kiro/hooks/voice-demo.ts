/**
 * NexaFlow Voice Assistant Demo
 * 
 * This script provides demo functions to test voice commands
 * without requiring actual speech input.
 * 
 * Created by Kiro AI for NexaFlow voice assistant testing.
 */

import VoiceAssistantHook from './voice-assistant-hook'

export class VoiceDemo {
  private voiceAssistant: VoiceAssistantHook;

  constructor() {
    this.voiceAssistant = VoiceAssistantHook.getInstance();
  }

  /**
   * Simulate voice command for testing
   */
  simulateVoiceCommand(command: string): void {
    console.log(`🎤 Simulating voice command: "${command}"`);
    this.voiceAssistant.testCommand(command);
  }

  /**
   * Test all voice commands
   */
  testAllCommands(): void {
    const testCommands = [
      'weather in London',
      'show analytics',
      'show travel',
      'dark mode',
      'boost mode',
      'refresh weather',
      'help'
    ];

    console.log('🧪 Testing all voice commands...');
    
    testCommands.forEach((command, index) => {
      setTimeout(() => {
        this.simulateVoiceCommand(command);
      }, index * 2000); // 2 second delay between commands
    });
  }

  /**
   * Add voice demo buttons to the page
   */
  addDemoButtons(): void {
    const demoContainer = document.createElement('div');
    demoContainer.className = 'fixed bottom-20 left-4 z-50 space-y-2';
    
    const testButton = document.createElement('button');
    testButton.innerHTML = '🎤 Test Voice Commands';
    testButton.className = `
      px-3 py-2 rounded-lg text-xs
      bg-gradient-to-r from-blue-500 to-purple-500 text-white
      hover:from-blue-600 hover:to-purple-600 transition-all duration-300
      shadow-lg border border-white/20
    `;
    testButton.onclick = () => this.testAllCommands();

    const quickTestButton = document.createElement('button');
    quickTestButton.innerHTML = '⚡ Quick Test';
    quickTestButton.className = `
      px-3 py-2 rounded-lg text-xs
      bg-gradient-to-r from-green-500 to-teal-500 text-white
      hover:from-green-600 hover:to-teal-600 transition-all duration-300
      shadow-lg border border-white/20
    `;
    quickTestButton.onclick = () => this.simulateVoiceCommand('weather in Tokyo');

    demoContainer.appendChild(testButton);
    demoContainer.appendChild(quickTestButton);
    document.body.appendChild(demoContainer);
  }
}

// Add demo buttons in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  document.addEventListener('DOMContentLoaded', () => {
    const demo = new VoiceDemo();
    demo.addDemoButtons();
  });
}

export default VoiceDemo;