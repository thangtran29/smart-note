'use client';

import { useState, useEffect } from 'react';
import { CalendarIcon, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

interface InsightsFilterProps {
  onFiltersChange: (filters: {
    tagIds: string[];
    dateFrom?: string;
    dateTo?: string;
  }) => void;
}

interface TagOption {
  id: string;
  name: string;
  color?: string;
}

export function InsightsFilter({ onFiltersChange }: InsightsFilterProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);

  // Load available tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data.tags || []);
        }
      } catch (error) {
        console.error('Failed to load tags:', error);
      } finally {
        setIsLoadingTags(false);
      }
    };

    loadTags();
  }, []);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange({
      tagIds: selectedTagIds,
      dateFrom: dateRange?.from?.toISOString(),
      dateTo: dateRange?.to?.toISOString()
    });
  }, [selectedTagIds, dateRange, onFiltersChange]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleClearFilters = () => {
    setSelectedTagIds([]);
    setDateRange(undefined);
  };

  const selectedTags = availableTags.filter(tag => selectedTagIds.includes(tag.id));
  const hasActiveFilters = selectedTagIds.length > 0 || dateRange?.from || dateRange?.to;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Filter Notes for Analysis
        </CardTitle>
        <CardDescription>
          Select which notes to include in your AI analysis by tags and date range.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Pick a date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Tag Filter */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Tags</label>
          {isLoadingTags ? (
            <div className="flex items-center gap-2">
              <div className="animate-pulse h-6 w-16 bg-gray-200 rounded"></div>
              <div className="animate-pulse h-6 w-20 bg-gray-200 rounded"></div>
            </div>
          ) : availableTags.length === 0 ? (
            <p className="text-sm text-gray-500">No tags available. Create tags to organize your notes.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    selectedTagIds.includes(tag.id)
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  )}
                  style={tag.color ? {
                    backgroundColor: selectedTagIds.includes(tag.id) ? tag.color + '20' : undefined,
                    borderColor: selectedTagIds.includes(tag.id) ? tag.color : undefined,
                    color: selectedTagIds.includes(tag.id) ? tag.color : undefined
                  } : undefined}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Filters</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {dateRange?.from && (
                <Badge variant="secondary" className="text-xs">
                  From: {format(dateRange.from, "MMM dd, yyyy")}
                </Badge>
              )}
              {dateRange?.to && (
                <Badge variant="secondary" className="text-xs">
                  To: {format(dateRange.to, "MMM dd, yyyy")}
                </Badge>
              )}
              {selectedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs"
                  style={tag.color ? { backgroundColor: tag.color + '20', color: tag.color } : undefined}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Filter Tips */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Use tags to focus analysis on specific topics</p>
          <p>• Date ranges help analyze notes from particular time periods</p>
          <p>• Combine filters for more precise note selection</p>
        </div>
      </CardContent>
    </Card>
  );
}
