'use client';

import { Calendar, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { presetToDateRange, formatDateRangeForDisplay } from '@/lib/search/utils';
import type { DateFilterPreset, DateFilterState } from '@/lib/search/types';

interface DateFilterProps {
  filterState: DateFilterState;
  onFilterChange: (state: DateFilterState) => void;
  disabled?: boolean;
}

const DATE_PRESETS: { value: DateFilterPreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'last-7-days', label: 'Last 7 days' },
  { value: 'last-30-days', label: 'Last 30 days' },
  { value: 'this-month', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
];

export function DateFilter({ filterState, onFilterChange, disabled = false }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFromCalendarOpen, setIsFromCalendarOpen] = useState(false);
  const [isToCalendarOpen, setIsToCalendarOpen] = useState(false);

  const selectedPresetData = DATE_PRESETS.find(p => p.value === filterState.preset);
  const dateRange = filterState.preset === 'custom' && filterState.customFrom && filterState.customTo
    ? { from: filterState.customFrom, to: filterState.customTo }
    : presetToDateRange(filterState.preset);

  const displayText = selectedPresetData?.label || 'Date filter';

  const handlePresetChange = (preset: DateFilterPreset) => {
    if (preset === 'custom') {
      onFilterChange({
        preset: 'custom',
        customFrom: filterState.customFrom || new Date(),
        customTo: filterState.customTo || new Date(),
      });
    } else {
      onFilterChange({ preset });
    }
  };

  const handleFromDateChange = (date: Date | undefined) => {
    if (date) {
      onFilterChange({
        ...filterState,
        customFrom: date,
      });
      setIsFromCalendarOpen(false);
    }
  };

  const handleToDateChange = (date: Date | undefined) => {
    if (date) {
      onFilterChange({
        ...filterState,
        customTo: date,
      });
      setIsToCalendarOpen(false);
    }
  };

  const hasActiveFilter = filterState.preset !== 'custom' || (filterState.customFrom || filterState.customTo);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={hasActiveFilter ? "default" : "outline"}
          className="justify-start"
          disabled={disabled}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Filter by date</h4>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Quick presets</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  size="sm"
                >
                  <span className="truncate">
                    {selectedPresetData?.label || 'Select preset'}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-full">
                {DATE_PRESETS.map((preset) => (
                  <DropdownMenuItem
                    key={preset.value}
                    onClick={() => handlePresetChange(preset.value)}
                    className={filterState.preset === preset.value ? 'bg-accent' : ''}
                  >
                    {preset.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {filterState.preset === 'custom' && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">Custom date range</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    From
                  </label>
                  <Popover open={isFromCalendarOpen} onOpenChange={setIsFromCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {filterState.customFrom ? (
                          format(filterState.customFrom, 'MMM dd, yyyy')
                        ) : (
                          'Select date'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filterState.customFrom}
                        onSelect={handleFromDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    To
                  </label>
                  <Popover open={isToCalendarOpen} onOpenChange={setIsToCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {filterState.customTo ? (
                          format(filterState.customTo, 'MMM dd, yyyy')
                        ) : (
                          'Select date'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filterState.customTo}
                        onSelect={handleToDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {dateRange && (
            <div className="text-xs text-muted-foreground border-t pt-2">
              {formatDateRangeForDisplay(dateRange.from, dateRange.to)}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
