'use client';

import { useState } from 'react';
import { AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { AIQueryResponse } from '@/lib/ai-insights/types';

interface AIResponseProps {
  response: AIQueryResponse['data'];
  onNewQuery?: () => void;
  className?: string;
}

export function AIResponse({ response, onNewQuery, className }: AIResponseProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    response: aiResponse,
    notesAnalyzed,
    totalNotesSelected,
    truncationInfo,
    processingTime,
    tokenCount
  } = response;

  const showTruncationWarning = truncationInfo.wasTruncated || notesAnalyzed < totalNotesSelected;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          AI Analysis Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Truncation Warning */}
        {showTruncationWarning && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Note Collection Truncated</strong>
              <br />
              Your query analyzed {notesAnalyzed} of {totalNotesSelected} selected notes
              {truncationInfo.notesRemoved > 0 && ` (${truncationInfo.notesRemoved} notes were excluded)`}.
              This ensures optimal AI performance while maintaining response quality.
            </AlertDescription>
          </Alert>
        )}

        {/* Analysis Stats */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Info className="h-4 w-4" />
            <span>{notesAnalyzed} notes analyzed</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{(processingTime / 1000).toFixed(1)}s processing time</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {tokenCount} tokens used
          </Badge>
        </div>

        {/* AI Response */}
        <div className="space-y-2">
          <label className="text-sm font-medium">AI Response</label>
          <div className="relative">
            <Textarea
              value={aiResponse}
              readOnly
              className={cn(
                "min-h-[200px] resize-none bg-gray-50 dark:bg-gray-900 border-0",
                !isExpanded && "max-h-[300px] overflow-hidden"
              )}
            />
            {!isExpanded && aiResponse.length > 500 && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-950 to-transparent flex items-end justify-center pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="text-xs"
                >
                  Show Full Response
                </Button>
              </div>
            )}
          </div>
          {isExpanded && aiResponse.length > 500 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="text-xs"
            >
              Show Less
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onNewQuery && (
            <Button variant="outline" size="sm" onClick={onNewQuery}>
              Ask Another Question
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(aiResponse)}
          >
            Copy Response
          </Button>
        </div>

        {/* Token Usage Details */}
        <details className="text-xs text-gray-500 dark:text-gray-400">
          <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            Technical Details
          </summary>
          <div className="mt-2 space-y-1 pl-4">
            <p>Query ID: {response.queryId}</p>
            <p>Model: GPT-4</p>
            <p>Notes processed: {notesAnalyzed}/{totalNotesSelected}</p>
            <p>Tokens used: {tokenCount}</p>
            <p>Processing time: {processingTime}ms</p>
            {truncationInfo.wasTruncated && (
              <p>Content tokens: {truncationInfo.tokenCount} (truncated to fit limits)</p>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
