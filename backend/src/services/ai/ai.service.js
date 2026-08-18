import { GeminiAIProvider } from './gemini.provider.js';
import { FallbackAIProvider } from './fallback.provider.js';

export class AIService {
  static getProvider() {
    const providerName = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (providerName === 'gemini' && apiKey) {
      return new GeminiAIProvider(apiKey);
    }

    return new FallbackAIProvider();
  }

  static async generateInsights(projectContext) {
    const provider = AIService.getProvider();
    return provider.generateInsights(projectContext);
  }

  static async askQuestion(question, retrievalContext) {
    const provider = AIService.getProvider();
    return provider.askQuestion(question, retrievalContext);
  }
}
