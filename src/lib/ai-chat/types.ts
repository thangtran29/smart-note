export interface AIConversation {
  id: string;
  noteId: string;
  userId: string;
  userMessage: string;
  aiResponse: string;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface SendMessageRequest {
  noteId: string;
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface SendMessageResponse {
  success: boolean;
  conversation?: AIConversation;
  error?: string;
}
