'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Clock, X, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExpirationPreset = 'never' | '1min' | '1day' | '1week' | '1month' | 'custom';

interface NoteExpirationSelectorProps {
  expiresAt: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
}

export function NoteExpirationSelector({
  expiresAt,
  onChange,
  className,
}: NoteExpirationSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<ExpirationPreset>(
    expiresAt ? 'custom' : 'never'
  );
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);

  const handlePresetSelect = (preset: ExpirationPreset) => {
    setSelectedPreset(preset);
    
    if (preset === 'never') {
      onChange(null);
      setShowCustomCalendar(false);
      return;
    }

    if (preset === 'custom') {
      setShowCustomCalendar(true);
      // If no date is set, default to tomorrow
      if (!expiresAt) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        onChange(tomorrow);
      }
      return;
    }

    // Calculate expiration date based on preset
    const now = new Date();
    let expirationDate: Date;

    switch (preset) {
      case '1min':
        expirationDate = new Date(now.getTime() + 60 * 1000);
        break;
      case '1day':
        expirationDate = new Date(now);
        expirationDate.setDate(expirationDate.getDate() + 1);
        break;
      case '1week':
        expirationDate = new Date(now);
        expirationDate.setDate(expirationDate.getDate() + 7);
        break;
      case '1month':
        expirationDate = new Date(now);
        expirationDate.setMonth(expirationDate.getMonth() + 1);
        break;
      default:
        return;
    }

    onChange(expirationDate);
    setShowCustomCalendar(false);
  };

  const handleCustomDateSelect = (date: Date | undefined) => {
    if (date) {
      // Set time to end of day (23:59:59) for better UX
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      onChange(endOfDay);
      setShowCustomCalendar(false);
    }
  };

  const clearExpiration = () => {
    onChange(null);
    setSelectedPreset('never');
    setShowCustomCalendar(false);
  };

  const getPresetLabel = (preset: ExpirationPreset): string => {
    switch (preset) {
      case 'never':
        return 'Never';
      case '1min':
        return '1 Minute';
      case '1day':
        return '1 Day';
      case '1week':
        return '1 Week';
      case '1month':
        return '1 Month';
      case 'custom':
        return 'Custom';
      default:
        return 'Never';
    }
  };

  const isExpired = expiresAt ? new Date() > expiresAt : false;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Expiration
        </label>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {(['never', '1min', '1day', '1week', '1month', 'custom'] as ExpirationPreset[]).map(
          (preset) => (
            <Button
              key={preset}
              type="button"
              variant={selectedPreset === preset ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetSelect(preset)}
              className="text-xs"
            >
              {getPresetLabel(preset)}
            </Button>
          )
        )}
      </div>

      {/* Custom Date Picker */}
      {selectedPreset === 'custom' && (
        <Popover open={showCustomCalendar} onOpenChange={setShowCustomCalendar}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'w-full justify-start text-left font-normal',
                !expiresAt && 'text-muted-foreground',
                isExpired && 'border-red-500 text-red-600 dark:text-red-400'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {expiresAt ? (
                format(expiresAt, 'PPP p')
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={expiresAt || undefined}
              onSelect={handleCustomDateSelect}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}

      {/* Display Current Expiration */}
      {expiresAt && (
        <div
          className={cn(
            'flex items-center justify-between rounded-md border p-2 text-sm',
            isExpired
              ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
              : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                isExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
              )}
            >
              {isExpired ? 'Expired' : 'Expires'}: {format(expiresAt, 'PPP p')}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearExpiration}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

