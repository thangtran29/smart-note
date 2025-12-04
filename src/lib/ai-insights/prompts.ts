// AI Insights Prompt Templates

export const AI_INSIGHTS_PROMPTS = {
  /**
   * Default context template for analyzing multiple notes
   */
  DEFAULT_CONTEXT: `You are analyzing multiple notes to help answer user questions. Here are the notes:

{{NOTES}}

User query: {{QUERY}}

Please analyze these notes and provide a comprehensive, helpful response to the user's query. Focus on the most relevant information from the notes.`,

  /**
   * Template for finding common themes across notes
   */
  COMMON_THEMES: `You are analyzing multiple notes to identify common themes and patterns. Here are the notes:

{{NOTES}}

Please identify and describe the common themes, patterns, and recurring ideas across these notes. Organize your response by theme with specific examples from the notes.`,

  /**
   * Template for summarizing key decisions
   */
  KEY_DECISIONS: `You are analyzing meeting notes and documents to extract key decisions. Here are the notes:

{{NOTES}}

Please identify and summarize the key decisions, conclusions, and action items from these notes. Focus on what was decided and any commitments made.`,

  /**
   * Template for finding top action items
   */
  TOP_ACTION_ITEMS: `You are analyzing notes to identify the most important action items and tasks. Here are the notes:

{{NOTES}}

Please extract and prioritize the top action items, tasks, and follow-up items mentioned across these notes. Rank them by importance and include deadlines if mentioned.`,

  /**
   * Template for identifying contradictions
   */
  CONTRADICTIONS: `You are analyzing notes to identify any contradictions, conflicts, or inconsistencies. Here are the notes:

{{NOTES}}

Please carefully analyze these notes for any contradictions, conflicting information, or areas where the notes disagree with each other. Highlight specific examples and suggest possible resolutions.`,

  /**
   * Template for brainstorming patterns
   */
  BRAINSTORM_PATTERNS: `You are analyzing brainstorming notes to identify patterns and creative ideas. Here are the notes:

{{NOTES}}

Please identify patterns in the brainstorming ideas, categorize similar concepts, and highlight the most promising or frequently mentioned ideas. Suggest connections between different concepts.`
};

/**
 * Get the appropriate prompt template based on query analysis
 */
export function getPromptTemplate(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('theme') || lowerQuery.includes('common') || lowerQuery.includes('pattern')) {
    return AI_INSIGHTS_PROMPTS.COMMON_THEMES;
  }

  if (lowerQuery.includes('decision') || lowerQuery.includes('meeting') || lowerQuery.includes('conclusion')) {
    return AI_INSIGHTS_PROMPTS.KEY_DECISIONS;
  }

  if (lowerQuery.includes('action') || lowerQuery.includes('task') || lowerQuery.includes('todo')) {
    return AI_INSIGHTS_PROMPTS.TOP_ACTION_ITEMS;
  }

  if (lowerQuery.includes('contradict') || lowerQuery.includes('conflict') || lowerQuery.includes('inconsisten')) {
    return AI_INSIGHTS_PROMPTS.CONTRADICTIONS;
  }

  if (lowerQuery.includes('brainstorm') || lowerQuery.includes('idea') || lowerQuery.includes('creative')) {
    return AI_INSIGHTS_PROMPTS.BRAINSTORM_PATTERNS;
  }

  return AI_INSIGHTS_PROMPTS.DEFAULT_CONTEXT;
}

/**
 * Format notes into the prompt template
 */
export function formatPromptWithNotes(template: string, notes: Array<{title: string, content: string}>, query: string): string {
  const formattedNotes = notes.map((note, index) =>
    `Note ${index + 1}: ${note.title}\n${note.content}`
  ).join('\n\n');

  return template
    .replace('{{NOTES}}', formattedNotes)
    .replace('{{QUERY}}', query);
}

/**
 * Create a system prompt for the AI assistant
 */
export function createSystemPrompt(context: string): string {
  return `You are an AI assistant that analyzes collections of notes to answer user questions about their content.

Context: ${context}

Guidelines:
- Be thorough but concise in your analysis
- Reference specific notes when relevant
- Focus on the most important and relevant information
- Organize your response clearly with headings if appropriate
- Be honest about limitations if the notes don't contain enough information
- Maintain a helpful and professional tone`;
}
