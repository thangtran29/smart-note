'use client';

import { useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InsightsFilter } from './components/insights-filter';
import { NotePreviewList } from './components/note-preview-list';
import { AIQuery } from './components/ai-query';
import { AIResponse } from './components/ai-response';
import { AppHeader } from '@/components/layout/app-header';
import type { NoteFilterCriteria } from '@/lib/ai-insights/types';
import type { AIQueryResponse, AIQueryError } from '@/lib/ai-insights/types';
import type { NoteSearchResult } from '@/lib/search/types';

// Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Loading Component
function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InsightsPage() {
  const [filters, setFilters] = useState<NoteFilterCriteria>({});
  const [notes, setNotes] = useState<NoteSearchResult[]>([]); // Will be populated from NotePreviewList
  const [aiResponse, setAiResponse] = useState<AIQueryResponse['data'] | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  // Memoize filters to prevent infinite re-renders
  const memoizedFilters = useMemo(() => ({
    tagIds: filters.tagIds || [],
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo
  }), [filters.tagIds, filters.dateFrom, filters.dateTo]);

  const handleFiltersChange = (newFilters: NoteFilterCriteria) => {
    setFilters(newFilters);
    // Reset AI response when filters change
    setAiResponse(null);
    console.log('Filters updated:', newFilters);
  };

  const handleAIQuery = async (query: string): Promise<AIQueryResponse | AIQueryError> => {
    if (notes.length === 0) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        details: 'No notes selected. Please adjust your filters to include notes.'
      };
    }

    setIsQuerying(true);
    try {
      const noteIds = notes.map(note => note.id);
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          noteIds,
          model: 'gpt-4'
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAiResponse(result.data);
        return result;
      } else {
        return result;
      }
    } catch {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        details: 'Failed to connect to AI service. Please try again.'
      };
    } finally {
      setIsQuerying(false);
    }
  };

  const handleNewQuery = () => {
    setAiResponse(null);
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingState message="Loading AI Insights..." />}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <AppHeader currentPage="insights" />

          {/* Main Content */}
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Link href="/notes">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Notes
                  </Button>
                </Link>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    AI Insights
                  </h1>
                  <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                    Analyze multiple notes with AI to discover patterns, themes, and insights across your content.
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Filters and Preview */}
              <div className="lg:col-span-2 space-y-6">
                {/* Filter Component */}
                <InsightsFilter
                  onFiltersChange={handleFiltersChange}
                />

                {/* Note Preview Component */}
                <NotePreviewList
                  filters={memoizedFilters}
                  onNotesChange={setNotes}
                />

                {/* AI Query Component - Only show if notes are available */}
                {notes.length > 0 && !aiResponse && (
                  <AIQuery
                    noteIds={notes.map(note => note.id)}
                    onQuerySubmit={handleAIQuery}
                    disabled={isQuerying}
                  />
                )}

                {/* AI Response Component */}
                {aiResponse && (
                  <AIResponse
                    response={aiResponse}
                    onNewQuery={handleNewQuery}
                  />
                )}
              </div>

              {/* Right Column - Info and Help */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>How AI Insights Works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">What You Can Ask</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• &ldquo;What are common themes?&rdquo;</li>
                        <li>• &ldquo;Summarize key decisions&rdquo;</li>
                        <li>• &ldquo;Find action items&rdquo;</li>
                        <li>• &ldquo;Identify contradictions&rdquo;</li>
                        <li>• &ldquo;Analyze patterns&rdquo;</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Smart Processing</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Token-aware processing</li>
                        <li>• Automatic note truncation</li>
                        <li>• Multi-model support</li>
                        <li>• Query history tracking</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
