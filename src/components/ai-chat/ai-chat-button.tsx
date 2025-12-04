'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface AIChatButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function AIChatButton({ onClick, disabled }: AIChatButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2"
    >
      <MessageCircle className="h-4 w-4" />
      AI Chat
    </Button>
  );
}
