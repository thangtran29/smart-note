'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { X, Loader2, Trash2 } from 'lucide-react';
import { ChatMessageComponent } from './chat-message';
import { ChatInput } from './chat-input';
import { sendMessage, getConversationHistory, clearConversationHistory } from '@/lib/ai-chat/client';
import type { ChatMessage, AIConversation } from '@/lib/ai-chat/types';

interface AIChatPanelProps {
  noteId: string;
  onClose: () => void;
}

export function AIChatPanel({ noteId, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversationHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      setError(null);
      const conversations = await getConversationHistory(noteId);

      // Convert conversations to chat messages
      const chatMessages: ChatMessage[] = conversations.flatMap((conv: AIConversation) => [
        {
          role: 'user',
          content: conv.userMessage || '',
          timestamp: conv.createdAt,
        },
        {
          role: 'assistant',
          content: conv.aiResponse || '',
          timestamp: conv.createdAt,
        },
      ]).filter((msg: ChatMessage) => msg.content && msg.content.trim() !== ''); // Filter out empty messages

      setMessages(chatMessages);
    } catch (err) {
      console.error('Failed to load conversation history:', err);
      setError('Failed to load conversation history');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [noteId]);

  // Load conversation history on mount
  useEffect(() => {
    loadConversationHistory();
  }, [noteId, loadConversationHistory]);

  // Auto-scroll to latest messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (isSending) return;

    try {
      setIsSending(true);
      setError(null);

      // Add user message immediately
      const userMessage: ChatMessage = {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to API
      const response = await sendMessage({
        noteId,
        message: content,
      });

      if (response.success && response.conversation) {
        // Add AI response
        const aiMessage: ChatMessage = {
          role: 'assistant',
          content: response.conversation.aiResponse || 'I apologize, but I was unable to generate a response.',
          timestamp: response.conversation.createdAt,
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Handle error
        setError(response.error || 'Failed to send message');
        // Remove the user message on error
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (isClearing) return;

    try {
      setIsClearing(true);
      setError(null);
      await clearConversationHistory(noteId);
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear conversation history:', err);
      setError('Failed to clear conversation history');
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoadingHistory) {
    return (
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">AI Chat</CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl h-[600px] flex flex-col" role="dialog" aria-labelledby="ai-chat-title" aria-describedby="ai-chat-description">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle id="ai-chat-title" className="text-lg">AI Chat</CardTitle>
        <div className="flex gap-2">
          {messages.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isClearing} aria-label="Clear conversation history">
                  {isClearing ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Conversation History</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all conversation history for this note. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Clear History
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="outline" size="sm" onClick={onClose} aria-label="Close AI chat panel">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <div id="ai-chat-description" className="sr-only">
          AI chat interface for discussing your note content. Send messages to get AI-powered responses about your notes.
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4" role="alert" aria-live="assertive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-2" role="log" aria-label="Conversation messages" aria-live="polite" aria-atomic="false">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              Start a conversation about this note. The AI will have access to your note content.
            </div>
          ) : (
            messages.map((message, index) => (
              <ChatMessageComponent key={index} message={message} />
            ))
          )}

          {isSending && (
            <div className="flex justify-start" aria-label="AI is responding">
              <div className="flex gap-3 max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <p className="text-sm text-muted-foreground">AI is thinking...</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isSending}
          placeholder="Ask about your note..."
        />
      </CardContent>
    </Card>
  );
}
