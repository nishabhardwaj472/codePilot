/**
 * Base abstract class for AI Providers (Gemini, OpenAI, Fallback)
 */
export class BaseAIProvider {
  /**
   * Generates project insights from repository analysis context
   * @param {Object} projectContext
   * @returns {Promise<Array<Object>>}
   */
  async generateInsights(_projectContext) {
    throw new Error('generateInsights() not implemented');
  }

  /**
   * Answers user questions using lightweight retrieval context
   * @param {string} _question
   * @param {Object} _retrievalContext
   * @returns {Promise<Object>}
   */
  async askQuestion(_question, _retrievalContext) {
    throw new Error('askQuestion() not implemented');
  }
}
