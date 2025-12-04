import type { SendMessageRequest, SendMessageResponse } from './types';

export async function sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI Chat API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network request failed',
    };
  }
}

export async function getConversationHistory(noteId: string) {
  try {
    const response = await fetch(`/api/ai/chat/history?noteId=${encodeURIComponent(noteId)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.conversations || [];
  } catch (error) {
    console.error('Failed to load conversation history:', error);
    throw error;
  }
}

export async function clearConversationHistory(noteId: string) {
  try {
    const response = await fetch(`/api/ai/chat/history?noteId=${encodeURIComponent(noteId)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to clear conversation history:', error);
    throw error;
  }
}
