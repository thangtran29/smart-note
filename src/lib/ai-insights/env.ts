// AI Insights Environment Validation

export function validateEnvironment(): void {
  const requiredEnvVars = [
    'OPENAI_API_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for AI Insights: ${missingVars.join(', ')}\n` +
      'Please set these variables in your .env.local file.'
    );
  }

  // Validate OpenAI API key format (basic check)
  const apiKey = process.env.OPENAI_API_KEY!;
  if (!apiKey.startsWith('sk-')) {
    console.warn('Warning: OPENAI_API_KEY does not start with "sk-". Please verify it is correct.');
  }
}
