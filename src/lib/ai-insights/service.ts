// AI Insights OpenAI Service

import OpenAI from 'openai';
import { validateEnvironment } from './env';

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    validateEnvironment();
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }
  return openaiClient;
}

/**
 * Query AI with note context and user question
 */
export async function queryAI(
  context: string,
  query: string,
  model: 'gpt-4' | 'gpt-3.5-turbo' = 'gpt-4'
): Promise<{
  response: string;
  tokenCount: number;
  processingTime: number;
  model: string;
}> {
  const startTime = Date.now();
  const client = getOpenAIClient();

  try {
    const prompt = `You are analyzing multiple notes to help answer user questions. Here are the notes:

${context}

User query: ${query}

Please analyze these notes and provide a comprehensive, helpful response to the user's query. Focus on the most relevant information from the notes.`;

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that analyzes collections of notes to answer user questions. Be thorough, accurate, and helpful.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: model === 'gpt-4' ? 2000 : 1000,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
    const processingTime = Date.now() - startTime;

    // Estimate token usage (rough calculation)
    const estimatedTokens = Math.ceil((prompt.length + response.length) / 4);

    return {
      response,
      tokenCount: estimatedTokens,
      processingTime,
      model
    };

  } catch (error) {
    console.error('OpenAI API error:', error);

    if (error instanceof OpenAI.APIError) {
      switch (error.status) {
        case 401:
          throw new Error('Invalid OpenAI API key. Please check your configuration.');
        case 429:
          throw new Error('OpenAI rate limit exceeded. Please try again later.');
        case 500:
        case 502:
        case 503:
          throw new Error('OpenAI service temporarily unavailable. Please try again later.');
        default:
          throw new Error(`OpenAI API error: ${error.message}`);
      }
    }

    throw new Error('Failed to process AI query. Please try again.');
  }
}

/**
 * Validate AI service configuration
 */
export async function validateAIService(): Promise<{
  isValid: boolean;
  error?: string;
}> {
  try {
    const client = getOpenAIClient();

    // Simple validation call - check if API key works
    await client.models.list();
    return { isValid: true };

  } catch (error) {
    console.error('AI service validation failed:', error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

/**
 * Get available AI models
 */
export function getAvailableModels(): Array<{
  id: 'gpt-4' | 'gpt-3.5-turbo';
  name: string;
  maxTokens: number;
}> {
  return [
    { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096 }
  ];
}
