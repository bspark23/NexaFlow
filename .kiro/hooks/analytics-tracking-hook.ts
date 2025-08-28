/**
 * NexaFlow Analytics Tracking Hook
 * 
 * This hook tracks user activity across all app features and provides
 * interactive analytics dashboard with charts and insights.
 * 
 * Created by Kiro AI for NexaFlow productivity enhancements.
 */

interface UserActivity {
  type: 'weather_search' | 'travel_plan' | 'voice_command' | 'tab_switch' | 'boost_mode';
  timestamp: Date;
  metadata: Record<string, any>;
  location?: string;
}

interface AnalyticsData {
  dailyActivity: number[];
  totalSessions: number;
  favoriteFeatures: Record<string, number>;
  streakDays: number;
  achievements: string[];
}

export class AnalyticsTrackingHook {
  private static instance: AnalyticsTrackingHook;
  private activities: UserActivity[] = [];
  private sessionStart: Date = new Date();

  static getInstance(): AnalyticsTrackingHook {
    if (!AnalyticsTrackingHook.instance) {
      AnalyticsTrackingHook.instance = new AnalyticsTrackingHook();
    }
    return AnalyticsTrackingHook.instance;
  }

  /**
   * Track user activity
   */
  trackActivity(type: UserActivity['type'], metadata: Record<string, any> = {}): void {
    const activity: UserActivity = {
      type,
      timestamp: new Date(),
      metadata,
      location: this.getCurrentLocation()
    };

    this.activities.push(activity);
    this.saveToStorage();
    this.checkForAchievements(activity);

    console.log(`📊 NexaFlow Analytics: Tracked ${type}`, metadata);
  }

  /**
   * Generate analytics report
   */
  generateReport(): AnalyticsData {
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      return date.toDateString();
    }).reverse();

    const dailyActivity = last7Days.map(date => 
      this.activities.filter(activity => 
        activity.timestamp.toDateString() === date
      ).length
    );

    const favoriteFeatures = this.activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      dailyActivity,
      totalSessions: this.getTotalSessions(),
      favoriteFeatures,
      streakDays: this.calculateStreak(),
      achievements: this.getAchievements()
    };
  }

  /**
   * Get chart data for different chart types
   */
  getChartData(chartType: 'line' | 'bar' | 'pie'): any {
    const report = this.generateReport();

    switch (chartType) {
      case 'line':
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Daily Activity',
            data: report.dailyActivity,
            borderColor: 'rgb(20, 184, 166)',
            backgroundColor: 'rgba(20, 184, 166, 0.1)',
            tension: 0.4
          }]
        };

      case 'bar':
        return {
          labels: Object.keys(report.favoriteFeatures),
          datasets: [{
            label: 'Feature Usage',
            data: Object.values(report.favoriteFeatures),
            backgroundColor: [
              'rgba(20, 184, 166, 0.8)',
              'rgba(147, 51, 234, 0.8)',
              'rgba(236, 72, 153, 0.8)',
              'rgba(59, 130, 246, 0.8)'
            ]
          }]
        };

      case 'pie':
        const total = Object.values(report.favoriteFeatures).reduce((a, b) => a + b, 0);
        return {
          labels: Object.keys(report.favoriteFeatures),
          datasets: [{
            data: Object.values(report.favoriteFeatures),
            backgroundColor: [
              '#14b8a6',
              '#9333ea',
              '#ec4899',
              '#3b82f6'
            ]
          }]
        };

      default:
        return null;
    }
  }

  /**
   * Export analytics data
   */
  exportData(format: 'pdf' | 'excel'): void {
    const report = this.generateReport();
    const exportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalActivities: this.activities.length,
        streakDays: report.streakDays,
        totalSessions: report.totalSessions
      },
      activities: this.activities,
      charts: {
        dailyActivity: report.dailyActivity,
        featureUsage: report.favoriteFeatures
      }
    };

    if (format === 'pdf') {
      this.generatePDFReport(exportData);
    } else {
      this.generateExcelReport(exportData);
    }
  }

  /**
   * Initialize activity tracking
   */
  initialize(): void {
    this.loadFromStorage();
    this.trackActivity('session_start');
    this.setupEventListeners();
    console.log('📊 NexaFlow Analytics initialized');
  }

  /**
   * Private methods
   */
  private getCurrentLocation(): string | undefined {
    const locationElement = document.querySelector('[class*="text-gray-700"], [class*="text-gray-300"]');
    if (locationElement && locationElement.textContent) {
      const locationMatch = locationElement.textContent.match(/^([^,]+)/);
      return locationMatch ? locationMatch[1] : undefined;
    }
    return undefined;
  }

  private getTotalSessions(): number {
    const sessions = this.activities.filter(activity => activity.type === 'session_start');
    return sessions.length;
  }

  private calculateStreak(): number {
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      const hasActivity = this.activities.some(activity => 
        activity.timestamp.toDateString() === checkDate.toDateString()
      );
      
      if (hasActivity) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  }

  private getAchievements(): string[] {
    const achievements = [];
    const report = this.generateReport();
    
    if (this.activities.length >= 10) achievements.push('Weather Explorer');
    if (report.streakDays >= 7) achievements.push('Streak Master');
    if (Object.keys(report.favoriteFeatures).length >= 3) achievements.push('Feature Explorer');
    if (this.activities.some(a => a.type === 'voice_command')) achievements.push('Voice Commander');
    if (this.activities.some(a => a.type === 'boost_mode')) achievements.push('Boost Mode Discoverer');
    
    return achievements;
  }

  private checkForAchievements(activity: UserActivity): void {
    const achievements = this.getAchievements();
    const stored = JSON.parse(localStorage.getItem('nexaflow-achievements') || '[]');
    
    achievements.forEach(achievement => {
      if (!stored.includes(achievement)) {
        stored.push(achievement);
        this.showAchievementNotification(achievement);
      }
    });
    
    localStorage.setItem('nexaflow-achievements', JSON.stringify(stored));
  }

  private showAchievementNotification(achievement: string): void {
    const notification = document.createElement('div');
    notification.className = `
      fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg
      bg-gradient-to-r from-yellow-400 to-orange-500 text-white
      animate-bounce
    `;
    notification.innerHTML = `
      <div class="text-center">
        <div class="text-2xl mb-1">🏆</div>
        <div class="font-bold">Achievement Unlocked!</div>
        <div class="text-sm">${achievement}</div>
      </div>
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
  }

  private setupEventListeners(): void {
    // Track tab switches
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.textContent?.includes('Weather') || 
          target.textContent?.includes('Travel') ||
          target.textContent?.includes('Analytics') ||
          target.textContent?.includes('Rewards')) {
        this.trackActivity('tab_switch', { tab: target.textContent });
      }
    });

    // Track search activities
    const searchButtons = document.querySelectorAll('button');
    searchButtons.forEach(button => {
      if (button.querySelector('svg')) {
        button.addEventListener('click', () => {
          this.trackActivity('weather_search');
        });
      }
    });
  }

  private saveToStorage(): void {
    const data = {
      activities: this.activities.slice(-100), // Keep last 100 activities
      sessionStart: this.sessionStart
    };
    localStorage.setItem('nexaflow-analytics', JSON.stringify(data));
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('nexaflow-analytics');
    if (stored) {
      const data = JSON.parse(stored);
      this.activities = data.activities || [];
      this.sessionStart = new Date(data.sessionStart || new Date());
    }
  }

  private generatePDFReport(data: any): void {
    // Mock PDF generation
    console.log('📄 Generating PDF report...', data);
    alert('PDF report generated! This would normally download a comprehensive analytics report.');
  }

  private generateExcelReport(data: any): void {
    // Mock Excel generation
    console.log('📊 Generating Excel report...', data);
    alert('Excel report generated! This would normally download a detailed spreadsheet with charts.');
  }
}

// Initialize analytics when page loads
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const analytics = AnalyticsTrackingHook.getInstance();
    analytics.initialize();
  });
}

export default AnalyticsTrackingHook;