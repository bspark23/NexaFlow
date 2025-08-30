import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question, context, apiKey } = await request.json();

    // Validate input
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // If no API key provided, use fallback
    if (!apiKey) {
      return NextResponse.json({
        response: getFallbackResponse(question, context)
      });
    }

    // For now, we'll use a simple mock response since we don't have OpenAI setup
    // In production, you would call the OpenAI API here
    
    const mockResponse = getMockAIResponse(question, context);
    
    return NextResponse.json({
      response: mockResponse,
      source: 'mock-ai'
    });

  } catch (error) {
    console.error('AI chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getMockAIResponse(question: string, context: any): string {
  const lowerQuestion = question.toLowerCase();
  
  // Enhanced mock responses with more intelligence
  if (lowerQuestion.includes('weather')) {
    if (context?.weatherData) {
      const temp = Math.round(context.weatherData.main?.temp || 0);
      const description = context.weatherData.weather?.[0]?.description || 'unknown';
      const city = context.location?.city || 'your location';
      return `The current weather in ${city} is ${temp}°C with ${description}. It's a great day to be outside!`;
    }
    return "I'd be happy to help with weather information! Please enable location services or tell me which city you're interested in.";
  }

  if (lowerQuestion.includes('navigate') || lowerQuestion.includes('directions') || lowerQuestion.includes('route')) {
    return "I can help you with navigation! Please use the navigation tab to set your destination, and I'll provide the best route based on current conditions.";
  }

  if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi') || lowerQuestion.includes('hey')) {
    return "Hello! I'm your AI assistant. I can help you with weather information, navigation, travel planning, and answering general questions. What can I do for you today?";
  }

  if (lowerQuestion.includes('help')) {
    return "I'm here to help! I can assist with:\n• Weather information and UV index\n• Navigation and route planning\n• Travel recommendations\n• General knowledge questions\n• Voice commands for hands-free operation\n\nJust ask me anything!";
  }

  if (lowerQuestion.includes('time')) {
    return `The current time is ${new Date().toLocaleTimeString()}.`;
  }

  if (lowerQuestion.includes('date')) {
    return `Today is ${new Date().toLocaleDateString()}.`;
  }

  if (lowerQuestion.includes('how are you')) {
    return "I'm doing great, thank you for asking! I'm here and ready to help you with whatever you need. How can I assist you today?";
  }

  if (lowerQuestion.includes('thank')) {
    return "You're welcome! I'm glad I could help. Is there anything else you'd like to know?";
  }

  // General knowledge responses
  if (lowerQuestion.includes('what is') || lowerQuestion.includes('tell me about')) {
    const topic = question.replace(/what is|tell me about/gi, '').trim();
    if (topic) {
      return `I'd be happy to tell you about ${topic}. For detailed information, I recommend checking reliable sources or enabling AI features with an API key for more comprehensive answers.`;
    }
  }

  // Default intelligent response
  return "That's an interesting question! I'm designed to help with weather, navigation, and travel information. For more advanced AI capabilities, please configure an API key in the settings. How else can I assist you today?";
}

function getFallbackResponse(question: string, context: any): string {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('weather')) {
    return "I can help with weather information. Please configure an AI API key for more detailed weather analysis and forecasts.";
  }

  if (lowerQuestion.includes('navigate')) {
    return "Navigation assistance is available. Please set up AI features for intelligent route recommendations.";
  }

  return "I'm your assistant! For full AI capabilities including answering general questions, please configure an API key in the settings.";
}
