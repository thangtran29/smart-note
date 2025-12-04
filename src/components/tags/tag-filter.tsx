'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTags } from '@/lib/tags/client-queries';
import { TagBadge } from '@/components/tags/tag-badge';
import type { TagWithCount } from '@/lib/tags/types';

interface TagFilterProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  className?: string;
}

export function TagFilter({ selectedTagIds, onChange, className }: TagFilterProps) {
  const [open, setOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<TagWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await getTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error('Failed to load tags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTags();
  }, []);

  const selectedTags = availableTags.filter(tag => selectedTagIds.includes(tag.id));

  const handleSelect = (tagId: string) => {
    const isSelected = selectedTagIds.includes(tagId);
    const newSelectedIds = isSelected
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];

    onChange(newSelectedIds);
  };

  const handleRemove = (tagId: string) => {
    onChange(selectedTagIds.filter(id => id !== tagId));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const hasFilters = selectedTagIds.length > 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={hasFilters ? "default" : "outline"}
            role="combobox"
            aria-expanded={open}
            className={cn(
              "justify-start",
              hasFilters && "bg-primary text-primary-foreground"
            )}
            disabled={isLoading}
          >
            <Filter className="mr-2 h-4 w-4" />
            {selectedTags.length === 0
              ? "Filter by tags"
              : `${selectedTags.length} tag${selectedTags.length === 1 ? '' : 's'} selected`
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  <div className="py-6 text-center text-sm">Loading tags...</div>
                ) : availableTags.length === 0 ? (
                  <div className="py-6 text-center text-sm">
                    No tags available. <a href="/tags" className="text-primary underline">Create your first tag</a>
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm">No tags found.</div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {availableTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleSelect(tag.id)}
                      className="flex items-center gap-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <TagBadge tag={tag} />
                      <span className="text-sm text-muted-foreground ml-auto">
                        {tag.note_count} note{tag.note_count === 1 ? '' : 's'}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {selectedTags.slice(0, 3).map((tag) => (
              <div key={tag.id} className="flex items-center gap-1">
                <TagBadge tag={tag} size="sm" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive/20"
                  onClick={() => handleRemove(tag.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {selectedTags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{selectedTags.length - 3} more
              </Badge>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs hover:bg-destructive/20"
            onClick={handleClearAll}
          >
            Clear all
          </Button>
        </div>
      )}

      {hasFilters && (
        <div className="text-xs text-muted-foreground">
          Showing notes with all selected tags (AND logic)
        </div>
      )}
    </div>
  );
}
