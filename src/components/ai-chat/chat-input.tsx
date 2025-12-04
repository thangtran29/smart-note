'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message..."
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 min-h-[44px] max-h-[120px] resize-none"
        rows={1}
        aria-label="Type your message to the AI"
        aria-describedby="send-button-description"
      />
      <Button
        type="submit"
        disabled={disabled || !message.trim()}
        size="sm"
        className="self-end"
        aria-label="Send message"
        aria-describedby="send-button-description"
      >
        <Send className="w-4 h-4" aria-hidden="true" />
      </Button>
      <div id="send-button-description" className="sr-only">
        Send your message to the AI assistant. Press Enter to send, Shift+Enter for new line.
      </div>
    </form>
  );
}
