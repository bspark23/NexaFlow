/**
 * NexaFlow Mood & Productivity Tips Hook
 * 
 * This hook analyzes weather conditions and provides mood-based productivity
 * suggestions like "Rainy weather? Do indoor tasks today. Sunny? Great time for exercise."
 * 
 * Created by Kiro AI for NexaFlow productivity enhancements.
 */

interface WeatherMoodData {
  condition: string;
  temperature: number;
  humidity: number;
  uvIndex: number;
  isRainy: boolean;
  isSunny: boolean;
  isCloudy: boolean;
}

interface ProductivityTip {
  message: string;
  mood: 'energetic' | 'calm' | 'cozy' | 'focused' | 'creative';
  activities: string[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  weatherContext: string;
}

export class MoodProductivityTipsHook {
  private static instance: MoodProductivityTipsHook;
  private lastWeatherCondition: string = '';
  private lastTipTime: number = 0;
  private readonly TIP_INTERVAL = 15 * 60 * 1000; // 15 minutes
  private tipHistory: string[] = [];

  static getInstance(): MoodProductivityTipsHook {
    if (!MoodProductivityTipsHook.instance) {
      MoodProductivityTipsHook.instance = new MoodProductivityTipsHook();
    }
    return MoodProductivityTipsHook.instance;
  }

  /**
   * Start monitoring weather for productivity tips
   */
  startMonitoring(): void {
    // Check immediately
    this.checkWeatherMood();
    
    // Then check every 15 minutes
    setInterval(() => {
      this.checkWeatherMood();
    }, this.TIP_INTERVAL);

    console.log('🧠 NexaFlow Mood & Productivity Tips monitoring started');
  }

  /**
   * Analyze current weather and provide productivity tips
   */
  private checkWeatherMood(): void {
    const weatherData = this.getCurrentWeatherMood();
    if (!weatherData) return;

    const now = Date.now();
    const conditionChanged = weatherData.condition !== this.lastWeatherCondition;
    const enoughTimePassed = now - this.lastTipTime > this.TIP_INTERVAL;

    if (conditionChanged || enoughTimePassed) {
      const tip = this.generateProductivityTip(weatherData);
      if (tip && !this.tipHistory.includes(tip.message)) {
        this.showProductivityTip(tip);
        this.lastWeatherCondition = weatherData.condition;
        this.lastTipTime = now;
        
        // Keep only last 5 tips in history to allow repetition after some time
        this.tipHistory.push(tip.message);
        if (this.tipHistory.length > 5) {
          this.tipHistory.shift();
        }
      }
    }
  }

  /**
   * Extract current weather mood data from the app
   */
  private getCurrentWeatherMood(): WeatherMoodData | null {
    try {
      // Get UV index
      const uvElement = document.querySelector('.text-6xl.font-bold');
      const uvIndex = uvElement ? parseFloat(uvElement.textContent || '0') : 0;

      // Determine weather condition based on UV and time
      const hour = new Date().getHours();
      const isDay = hour >= 6 && hour <= 18;
      
      // Mock weather conditions for demo (in real app, would use actual weather API data)
      const conditions = ['sunny', 'cloudy', 'rainy', 'partly-cloudy'];
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      
      return {
        condition: randomCondition,
        temperature: 20 + Math.random() * 15, // Mock temperature
        humidity: 40 + Math.random() * 40, // Mock humidity
        uvIndex: uvIndex,
        isRainy: randomCondition === 'rainy',
        isSunny: randomCondition === 'sunny' && isDay,
        isCloudy: randomCondition === 'cloudy' || randomCondition === 'partly-cloudy'
      };
    } catch (error) {
      console.error('Failed to get weather mood data:', error);
      return null;
    }
  }

  /**
   * Generate productivity tip based on weather and mood
   */
  private generateProductivityTip(weather: WeatherMoodData): ProductivityTip | null {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    if (weather.isRainy) {
      return {
        message: "🌧️ Rainy weather? Perfect for indoor focus tasks today!",
        mood: 'focused',
        activities: [
          "Organize your digital files and emails",
          "Work on detailed projects requiring concentration",
          "Read that book you've been putting off",
          "Plan your week ahead",
          "Learn a new skill online"
        ],
        timeOfDay: 'anytime',
        weatherContext: "Rainy weather naturally creates a cozy, focused atmosphere"
      };
    }

    if (weather.isSunny && weather.uvIndex >= 6) {
      return {
        message: "☀️ Sunny weather? Great time for exercise and outdoor activities!",
        mood: 'energetic',
        activities: [
          "Take a walk or jog outside (with sunscreen!)",
          "Have a walking meeting or phone call",
          "Do outdoor photography or sketching",
          "Plan outdoor social activities",
          "Tackle high-energy tasks while you feel motivated"
        ],
        timeOfDay: timeOfDay as any,
        weatherContext: "Sunny weather boosts mood and energy levels naturally"
      };
    }

    if (weather.isCloudy) {
      return {
        message: "☁️ Cloudy weather? Ideal for creative and collaborative work!",
        mood: 'creative',
        activities: [
          "Brainstorm new ideas or solutions",
          "Work on creative projects",
          "Collaborate with team members",
          "Write or journal",
          "Organize creative spaces"
        ],
        timeOfDay: timeOfDay as any,
        weatherContext: "Overcast skies can enhance creativity and reduce distractions"
      };
    }

    // Default tip for mixed conditions
    return {
      message: "🌤️ Mixed weather? Balance indoor focus with outdoor breaks!",
      mood: 'calm',
      activities: [
        "Alternate between focused work and short outdoor breaks",
        "Do light stretching or yoga",
        "Organize your workspace",
        "Practice mindfulness or meditation",
        "Connect with friends or colleagues"
      ],
      timeOfDay: timeOfDay as any,
      weatherContext: "Variable weather is perfect for a balanced approach to productivity"
    };
  }

  /**
   * Display productivity tip notification
   */
  private showProductivityTip(tip: ProductivityTip): void {
    const notification = document.createElement('div');
    const moodColors = {
      energetic: 'from-orange-500 to-yellow-500',
      calm: 'from-blue-500 to-cyan-500',
      cozy: 'from-purple-500 to-pink-500',
      focused: 'from-indigo-500 to-purple-500',
      creative: 'from-pink-500 to-rose-500'
    };

    notification.className = `
      fixed top-52 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm
      bg-gradient-to-r ${moodColors[tip.mood]} text-white
      transform translate-x-full transition-transform duration-300
    `;

    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-1">
          <p class="text-sm font-semibold mb-2">${tip.message}</p>
          <div class="mb-2">
            <p class="text-xs font-medium mb-1">💡 Suggested activities:</p>
            <div class="space-y-1">
              ${tip.activities.slice(0, 3).map(activity => `<p class="text-xs">• ${activity}</p>`).join('')}
            </div>
          </div>
          <p class="text-xs opacity-90 bg-black/20 rounded px-2 py-1 mb-2">${tip.weatherContext}</p>
          <p class="text-xs opacity-90">Mood & Productivity by NexaFlow</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white/80 hover:text-white text-lg">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 20 seconds for productivity tips
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }, 20000);
  }

  /**
   * Get mood-based productivity suggestions for specific weather
   */
  getDetailedProductivityAdvice(weatherCondition: string): ProductivityTip[] {
    const tips: ProductivityTip[] = [];

    switch (weatherCondition.toLowerCase()) {
      case 'rainy':
        tips.push({
          message: "Rainy Day Deep Work Session",
          mood: 'focused',
          activities: [
            "Tackle complex analytical tasks",
            "Write detailed reports or documentation",
            "Learn new technical skills",
            "Organize and clean digital workspace",
            "Plan long-term projects"
          ],
          timeOfDay: 'anytime',
          weatherContext: "Rain creates natural white noise for concentration"
        });
        break;

      case 'sunny':
        tips.push({
          message: "Sunny Day Energy Boost",
          mood: 'energetic',
          activities: [
            "Schedule important meetings or presentations",
            "Network and make new connections",
            "Exercise or do physical activities",
            "Work on high-priority, challenging tasks",
            "Celebrate achievements and milestones"
          ],
          timeOfDay: 'morning',
          weatherContext: "Sunlight increases serotonin and energy levels"
        });
        break;

      case 'cloudy':
        tips.push({
          message: "Cloudy Day Creative Flow",
          mood: 'creative',
          activities: [
            "Brainstorm innovative solutions",
            "Work on artistic or design projects",
            "Write creatively or journal",
            "Experiment with new approaches",
            "Collaborate on creative projects"
          ],
          timeOfDay: 'afternoon',
          weatherContext: "Diffused light reduces eye strain and enhances creativity"
        });
        break;
    }

    return tips;
  }

  /**
   * Get time-specific productivity recommendations
   */
  getTimeBasedTips(hour: number, weather: string): string[] {
    const tips: string[] = [];

    if (hour >= 6 && hour <= 9) { // Morning
      tips.push("Start with your most important task while energy is high");
      if (weather === 'sunny') tips.push("Take advantage of morning sunlight for vitamin D");
    } else if (hour >= 10 && hour <= 14) { // Midday
      tips.push("Peak productivity hours - tackle challenging work");
      if (weather === 'rainy') tips.push("Perfect time for deep focus work");
    } else if (hour >= 15 && hour <= 18) { // Afternoon
      tips.push("Good time for meetings and collaborative work");
      if (weather === 'cloudy') tips.push("Ideal lighting for creative tasks");
    } else { // Evening
      tips.push("Wind down with planning and reflection");
      tips.push("Prepare for tomorrow's priorities");
    }

    return tips;
  }
}

// Initialize the hook when the page loads
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const hook = MoodProductivityTipsHook.getInstance();
    hook.startMonitoring();
  });
}

export default MoodProductivityTipsHook;