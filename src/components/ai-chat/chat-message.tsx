'use client';

import { User, Bot, MoreVertical, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ChatMessage } from '@/lib/ai-chat/types';

interface ChatMessageComponentProps {
  message: ChatMessage;
  onInsertMessage?: (message: string) => void;
  onDeleteMessage?: () => void;
}

export function ChatMessageComponent({ message, onInsertMessage, onDeleteMessage }: ChatMessageComponentProps) {
  const isUser = message.role === 'user';

  const handleInsert = () => {
    if (onInsertMessage && message.content) {
      onInsertMessage(message.content);
    }
  };

  const handleDelete = () => {
    if (onDeleteMessage) {
      onDeleteMessage();
    }
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        <div className={`rounded-lg px-3 py-2 relative ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}>
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content || 'No content available'}
          </p>

          <div className="flex items-center justify-between mt-1">
            {message.timestamp && (
              <p className={`text-xs ${
                isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}

            {!isUser && (onInsertMessage || onDeleteMessage) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-auto rounded-full bg-background/50 hover:bg-background/80"
                    aria-label="Message options"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onInsertMessage && (
                    <DropdownMenuItem onClick={handleInsert}>
                      <FileText className="mr-2 h-4 w-4" />
                      Add to note
                    </DropdownMenuItem>
                  )}
                  {onDeleteMessage && (
                    <DropdownMenuItem onClick={handleDelete} variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete this message
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
