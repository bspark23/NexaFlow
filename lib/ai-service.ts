// AI Service for general question answering
// Uses OpenAI GPT as the primary provider with fallback options

interface AIResponse {
  success: boolean;
  message: string;
  error?: string;
}

interface AIContext {
  weatherData?: any;
  location?: { city: string; country: string; lat: number; lon: number };
  navigationState?: any;
  conversationHistory?: Array<{ role: string; content: string }>;
}

class AIService {
  private apiKey: string | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Try to get API key from environment variables or localStorage
    this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || 
                 typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : null;
    
    this.isConfigured = !!this.apiKey;
    
    if (!this.isConfigured) {
      console.warn('OpenAI API key not configured. AI features will use fallback responses.');
    }
  }

  setApiKey(key: string) {
    this.apiKey = key;
    this.isConfigured = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('openai_api_key', key);
    }
  }

  async answerQuestion(question: string, context: AIContext = {}): Promise<AIResponse> {
    if (!this.isConfigured) {
      return this.getFallbackResponse(question, context);
    }

    try {
      return await this.callOpenAI(question, context);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getFallbackResponse(question, context);
    }
  }

  private async callOpenAI(question: string, context: AIContext): Promise<AIResponse> {
    // For browser environment, we'll use a proxy or direct fetch
    // In a real implementation, you'd call your backend API
    
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        context,
        apiKey: this.apiKey
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, message: data.response };
  }

  private getFallbackResponse(question: string, context: AIContext): AIResponse {
    // Simple fallback responses when AI is not available
    const lowerQuestion = question.toLowerCase();

    // Weather-related fallbacks
    if (lowerQuestion.includes('weather') || lowerQuestion.includes('temperature')) {
      if (context.weatherData) {
        const temp = Math.round(context.weatherData.main?.temp || 0);
        const description = context.weatherData.weather?.[0]?.description || 'unknown';
        return {
          success: true,
          message: `The current weather is ${temp}°C with ${description}.`
        };
      }
      return {
        success: true,
        message: "I can help with weather information. Please provide a location or enable location services."
      };
    }

    // Navigation fallbacks
    if (lowerQuestion.includes('navigate') || lowerQuestion.includes('route') || lowerQuestion.includes('directions')) {
      return {
        success: true,
        message: "I can help with navigation. Please use the navigation tab to set a destination."
      };
    }

    // General knowledge fallbacks
    if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi')) {
      return {
        success: true,
        message: "Hello! I'm your AI assistant. How can I help you today?"
      };
    }

    if (lowerQuestion.includes('help')) {
      return {
        success: true,
        message: "I can help you with weather information, navigation, general knowledge questions, and more. Just ask me anything!"
      };
    }

    // Default fallback
    return {
      success: true,
      message: "I'm here to help! For advanced features, please configure an AI API key in the settings."
    };
  }

  // Check if AI service is properly configured
  isAvailable(): boolean {
    return this.isConfigured;
  }

  // Clear API key (for logout or reset)
  clearApiKey() {
    this.apiKey = null;
    this.isConfigured = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('openai_api_key');
    }
  }
}

// Create singleton instance
export const aiService = new AIService();
