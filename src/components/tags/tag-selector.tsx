'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTags } from '@/lib/tags/client-queries';
import { TagBadge } from '@/components/tags/tag-badge';
import type { TagWithCount } from '@/lib/tags/types';

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TagSelector({ selectedTagIds, onChange, placeholder = "Select tags...", disabled = false }: TagSelectorProps) {
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

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Tags</label>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-1">
              <TagBadge tag={tag} size="sm" />
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive/20"
                  onClick={() => handleRemove(tag.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          {!disabled && selectedTags.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs hover:bg-destructive/20"
              onClick={handleClearAll}
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Tag Selector Dropdown */}
      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={isLoading}
            >
              {selectedTags.length === 0
                ? placeholder
                : `${selectedTags.length} tag${selectedTags.length === 1 ? '' : 's'} selected`
              }
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
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
                <CommandGroup>
                  <CommandItem asChild>
                    <a href="/tags" className="flex items-center gap-2 text-primary">
                      <Plus className="h-4 w-4" />
                      Create new tag
                    </a>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      <p className="text-xs text-muted-foreground">
        Tags help organize your notes. You can select multiple tags.
      </p>
    </div>
  );
}
