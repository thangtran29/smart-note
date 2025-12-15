'use client';

import { X, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateRangeForDisplay } from '@/lib/search/utils';
import type { DateFilterState } from '@/lib/search/types';
import type { TagWithCount } from '@/lib/tags/types';

interface ActiveFilter {
  type: 'query' | 'date' | 'tag';
  label: string;
  value: string;
  onRemove: () => void;
}

interface FilterBarProps {
  searchQuery: string;
  dateFilter: DateFilterState;
  selectedTagIds: string[];
  tags: TagWithCount[];
  onClearSearch: () => void;
  onClearDateFilter: () => void;
  onClearTagFilter: (tagId: string) => void;
  onClearAllFilters: () => void;
  disabled?: boolean;
}

export function FilterBar({
  searchQuery,
  dateFilter,
  selectedTagIds,
  tags,
  onClearSearch,
  onClearDateFilter,
  onClearTagFilter,
  onClearAllFilters,
  disabled = false,
}: FilterBarProps) {
  // Create a map of tag ID to tag name for quick lookup
  const tagMap = new Map(tags.map(tag => [tag.id, tag.name]));
  // Build active filters list
  const activeFilters: ActiveFilter[] = [];

  // Add search filter if present
  if (searchQuery.trim()) {
    activeFilters.push({
      type: 'query',
      label: 'Search',
      value: `"${searchQuery}"`,
      onRemove: onClearSearch,
    });
  }

  // Add date filter if present
  if (dateFilter.preset !== 'custom' || dateFilter.customFrom || dateFilter.customTo) {
    let dateLabel = '';
    let dateValue = '';

    if (dateFilter.preset === 'custom') {
      if (dateFilter.customFrom && dateFilter.customTo) {
        dateLabel = 'Date Range';
        dateValue = formatDateRangeForDisplay(dateFilter.customFrom, dateFilter.customTo);
      } else if (dateFilter.customFrom) {
        dateLabel = 'Date From';
        dateValue = dateFilter.customFrom.toLocaleDateString();
      } else if (dateFilter.customTo) {
        dateLabel = 'Date To';
        dateValue = dateFilter.customTo.toLocaleDateString();
      }
    } else {
      // Preset filters
      const presetLabels: Record<string, string> = {
        'today': 'Today',
        'last-7-days': 'Last 7 days',
        'last-30-days': 'Last 30 days',
        'this-month': 'This month',
      };
      dateLabel = 'Date';
      dateValue = presetLabels[dateFilter.preset] || dateFilter.preset;
    }

    if (dateLabel && dateValue) {
      activeFilters.push({
        type: 'date',
        label: dateLabel,
        value: dateValue,
        onRemove: onClearDateFilter,
      });
    }
  }

  // Add tag filters with tag names
  selectedTagIds.forEach(tagId => {
    const tagName = tagMap.get(tagId) || tagId; // Fallback to ID if tag not found
    activeFilters.push({
      type: 'tag',
      label: 'Tag',
      value: tagName,
      onRemove: () => onClearTagFilter(tagId),
    });
  });

  // Don't render if no active filters
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Active Filters
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAllFilters}
            disabled={disabled}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <Badge
              key={`${filter.type}-${index}`}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span className="text-xs font-medium">{filter.label}:</span>
              <span className="text-xs">{filter.value}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={filter.onRemove}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
