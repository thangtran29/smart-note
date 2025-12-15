'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, ChevronsUpDown, X, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTags } from '@/lib/tags/client-queries';
import { TagBadge } from '@/components/tags/tag-badge';
import { generateRandomColor, validateTagName, validateHexColor } from '@/lib/tags/utils';
import type { TagWithCount, Tag } from '@/lib/tags/types';

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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(generateRandomColor());
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  const handleCreateTag = async () => {
    setCreateError(null);
    
    // Validate name
    const nameValidation = validateTagName(newTagName);
    if (!nameValidation.valid) {
      setCreateError(nameValidation.error || 'Invalid tag name');
      return;
    }

    // Validate color
    if (!validateHexColor(newTagColor)) {
      setCreateError('Invalid color format');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Reload tags
        const tags = await getTags();
        setAvailableTags(tags);
        
        // Automatically select the newly created tag
        if (result.tag) {
          onChange([...selectedTagIds, result.tag.id]);
        }
        
        // Reset form and close dialog
        setNewTagName('');
        setNewTagColor(generateRandomColor());
        setShowCreateDialog(false);
        setOpen(false);
      } else {
        setCreateError(result.error || 'Failed to create tag');
      }
    } catch (error) {
      setCreateError('An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRandomColor = () => {
    setNewTagColor(generateRandomColor());
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
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setShowCreateDialog(true);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 text-primary cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Create new tag
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

      {/* Create Tag Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Create a new tag to organize your notes. The tag will be automatically added to this note.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {createError && (
              <Alert variant="destructive">
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCreating) {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Tag name must be 1-50 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag-color">Color</Label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="tag-color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">{newTagColor}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRandomColor}
                >
                  Random
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewTagName('');
                  setNewTagColor(generateRandomColor());
                  setCreateError(null);
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateTag}
                disabled={isCreating || !newTagName.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Tag
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
