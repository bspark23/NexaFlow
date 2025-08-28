/**
 * NexaFlow UV Health Advisor Hook
 * 
 * This hook monitors UV index levels and provides skin safety tips
 * when UV is high, suggesting SPF levels and outdoor activity timing.
 * 
 * Created by Kiro AI for NexaFlow productivity enhancements.
 */

interface UVHealthTip {
  message: string;
  type: 'low' | 'moderate' | 'high' | 'veryHigh' | 'extreme';
  spfRecommendation: string;
  timeAdvice: string;
}

export class UVHealthAdvisorHook {
  private static instance: UVHealthAdvisorHook;
  private lastUVLevel: number = 0;
  private lastTipTime: number = 0;
  private readonly TIP_COOLDOWN = 5 * 60 * 1000; // 5 minutes

  static getInstance(): UVHealthAdvisorHook {
    if (!UVHealthAdvisorHook.instance) {
      UVHealthAdvisorHook.instance = new UVHealthAdvisorHook();
    }
    return UVHealthAdvisorHook.instance;
  }

  /**
   * Start monitoring UV levels
   */
  startMonitoring(): void {
    // Check every 30 seconds for UV changes
    setInterval(() => {
      this.checkUVLevel();
    }, 30000);

    console.log('☀️ NexaFlow UV Health Advisor monitoring started');
  }

  /**
   * Check current UV level and provide health advice
   */
  private checkUVLevel(): void {
    const uvElement = document.querySelector('.text-6xl.font-bold');
    if (uvElement && uvElement.textContent) {
      const currentUV = parseFloat(uvElement.textContent);
      
      // Only show tip if UV level changed significantly or enough time passed
      const now = Date.now();
      if (Math.abs(currentUV - this.lastUVLevel) >= 1 || 
          (now - this.lastTipTime > this.TIP_COOLDOWN && currentUV >= 6)) {
        
        const tip = this.generateUVHealthTip(currentUV);
        if (tip && currentUV >= 6) { // Only show tips for high UV
          this.showUVHealthTip(tip);
          this.lastTipTime = now;
        }
        this.lastUVLevel = currentUV;
      }
    }
  }

  /**
   * Generate UV health tip based on UV index
   */
  private generateUVHealthTip(uvIndex: number): UVHealthTip | null {
    if (uvIndex <= 5) return null; // No tips for low/moderate UV

    if (uvIndex <= 7) {
      return {
        message: "🧴 High UV detected! Protect your skin with proper precautions.",
        type: 'high',
        spfRecommendation: "Use SPF 50+ sunscreen",
        timeAdvice: "Avoid outdoor sports 12–3PM"
      };
    }

    if (uvIndex <= 10) {
      return {
        message: "⚠️ Very High UV! Take extra precautions when going outside.",
        type: 'veryHigh',
        spfRecommendation: "Use SPF 50+ sunscreen, reapply every 2 hours",
        timeAdvice: "Avoid outdoor activities 10AM–4PM, seek shade"
      };
    }

    return {
      message: "🚨 Extreme UV! Minimize outdoor exposure.",
      type: 'extreme',
      spfRecommendation: "Use SPF 50+ sunscreen, wear protective clothing",
      timeAdvice: "Stay indoors 10AM–4PM, UV can cause burns in minutes"
    };
  }

  /**
   * Display UV health tip notification
   */
  private showUVHealthTip(tip: UVHealthTip): void {
    const notification = document.createElement('div');
    const typeColors = {
      low: 'from-green-500 to-green-600',
      moderate: 'from-yellow-500 to-orange-500',
      high: 'from-orange-500 to-red-500',
      veryHigh: 'from-red-500 to-red-700',
      extreme: 'from-purple-600 to-red-800'
    };

    notification.className = `
      fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm
      bg-gradient-to-r ${typeColors[tip.type]} text-white
      transform translate-x-full transition-transform duration-300
    `;

    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-1">
          <p class="text-sm font-semibold mb-2">${tip.message}</p>
          <div class="space-y-1">
            <p class="text-xs">• ${tip.spfRecommendation}</p>
            <p class="text-xs">• ${tip.timeAdvice}</p>
          </div>
          <p class="text-xs opacity-90 mt-2">UV Health Advisor by NexaFlow</p>
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

    // Auto remove after 12 seconds for important health info
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }, 12000);
  }

  /**
   * Get detailed UV protection advice
   */
  getDetailedUVAdvice(uvIndex: number): string[] {
    const advice: string[] = [];

    if (uvIndex >= 6) {
      advice.push("Apply broad-spectrum SPF 50+ sunscreen 30 minutes before going outside");
      advice.push("Wear UV-blocking sunglasses and a wide-brimmed hat");
      advice.push("Seek shade during peak hours (10 AM - 4 PM)");
    }

    if (uvIndex >= 8) {
      advice.push("Wear tightly woven, long-sleeved clothing");
      advice.push("Reapply sunscreen every 2 hours or after swimming/sweating");
      advice.push("Consider postponing outdoor activities during peak UV");
    }

    if (uvIndex >= 11) {
      advice.push("Stay indoors during midday hours if possible");
      advice.push("UV can cause sunburn in less than 15 minutes");
      advice.push("Reflective surfaces (water, sand, snow) increase UV exposure");
    }

    return advice;
  }
}

// Initialize the hook when the page loads
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const hook = UVHealthAdvisorHook.getInstance();
    hook.startMonitoring();
  });
}

export default UVHealthAdvisorHook;