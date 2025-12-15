'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, Filter } from 'lucide-react';
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

  const handleSelect = (tagId: string) => {
    const isSelected = selectedTagIds.includes(tagId);
    const newSelectedIds = isSelected
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];

    onChange(newSelectedIds);
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
            Filter by tags
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
                    No tags available. <a href="/settings/tags" className="text-primary underline">Create your first tag</a>
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
    </div>
  );
}
