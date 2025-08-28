/**
 * NexaFlow Demo Trigger
 * 
 * This script helps demonstrate the new productivity features
 * by triggering sample notifications for testing purposes.
 * 
 * Created by Kiro AI for NexaFlow productivity enhancements.
 */

import ProductivityCoordinatorHook from './productivity-coordinator-hook'

export class DemoTrigger {
  private coordinator: ProductivityCoordinatorHook;

  constructor() {
    this.coordinator = ProductivityCoordinatorHook.getInstance();
  }

  /**
   * Trigger UV Health Advisor demo
   */
  triggerUVHealthDemo(): void {
    this.coordinator.queueNotification(
      'UV Health Advisor',
      '🧴 High UV detected! Use SPF 50+, avoid outdoor sports 12–3PM',
      'high'
    );
  }

  /**
   * Trigger Air Quality demo
   */
  triggerAirQualityDemo(): void {
    this.coordinator.queueNotification(
      'Air Quality Tracker',
      '😷 Poor air quality detected - wear a mask outdoors and limit activities',
      'high'
    );
  }

  /**
   * Trigger Mood & Productivity demo
   */
  triggerMoodProductivityDemo(): void {
    const tips = [
      '🌧️ Rainy weather? Perfect for indoor focus tasks today!',
      '☀️ Sunny weather? Great time for exercise and outdoor activities!',
      '☁️ Cloudy weather? Ideal for creative and collaborative work!'
    ];
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    this.coordinator.queueNotification(
      'Mood & Productivity',
      randomTip,
      'medium'
    );
  }

  /**
   * Trigger all demos in sequence
   */
  triggerAllDemos(): void {
    setTimeout(() => this.triggerUVHealthDemo(), 1000);
    setTimeout(() => this.triggerAirQualityDemo(), 4000);
    setTimeout(() => this.triggerMoodProductivityDemo(), 7000);
  }

  /**
   * Add demo button to the app
   */
  addDemoButton(): void {
    const demoButton = document.createElement('button');
    demoButton.innerHTML = '🧪 Demo Features';
    demoButton.className = `
      fixed bottom-4 left-4 z-50 px-4 py-2 rounded-lg
      bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm
      hover:from-pink-600 hover:to-purple-600 transition-all duration-300
      shadow-lg border border-white/20
    `;
    
    demoButton.onclick = () => {
      this.triggerAllDemos();
      demoButton.innerHTML = '✨ Demo Running...';
      setTimeout(() => {
        demoButton.innerHTML = '🧪 Demo Features';
      }, 10000);
    };

    document.body.appendChild(demoButton);
  }
}

// Add demo button when page loads (only in development)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  document.addEventListener('DOMContentLoaded', () => {
    const demo = new DemoTrigger();
    demo.addDemoButton();
  });
}

export default DemoTrigger;