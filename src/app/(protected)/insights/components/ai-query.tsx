'use client';

import { useState } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AIQueryResponse, AIQueryError } from '@/lib/ai-insights/types';

interface AIQueryProps {
  noteIds: string[];
  onQuerySubmit: (query: string) => Promise<AIQueryResponse | AIQueryError>;
  disabled?: boolean;
  className?: string;
}

export function AIQuery({ noteIds, onQuerySubmit, disabled, className }: AIQueryProps) {
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim() || noteIds.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onQuerySubmit(query.trim());

      if (!result.success) {
        setError(result.details as string || 'Failed to process query');
      }
      // Success is handled by parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = disabled || isSubmitting || noteIds.length === 0 || !query.trim();

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Ask AI About Your Notes</span>
          <Badge variant="secondary" className="text-xs">
            {noteIds.length} note{noteIds.length !== 1 ? 's' : ''} selected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Query Input */}
          <div className="space-y-2">
            <label htmlFor="ai-query" className="text-sm font-medium">
              Your Question
            </label>
            <Textarea
              id="ai-query"
              placeholder="e.g., What are the common themes across these notes? or Summarize the key decisions mentioned..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
              maxLength={1000}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{query.length}/1000 characters</span>
              {noteIds.length === 0 && (
                <span className="text-amber-600">Select notes first</span>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isDisabled}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Notes...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Analyze with AI
              </>
            )}
          </Button>

          {/* Help Text */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• AI will analyze all selected notes to answer your question</p>
            <p>• Large note collections may be automatically truncated for optimal performance</p>
            <p>• Responses are generated using GPT-4 for high-quality analysis</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
