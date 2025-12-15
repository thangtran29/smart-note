'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, Hash } from 'lucide-react';
import { TagBadge } from '@/components/tags/tag-badge';
import { getTags } from '@/lib/tags/client-queries';
import type { TagWithCount } from '@/lib/tags/types';

interface TagListProps {
  selectedTagIds?: string[];
  onTagSelect?: (tagId: string) => void;
  className?: string;
}

export function TagList({ selectedTagIds = [], onTagSelect, className }: TagListProps) {
  const router = useRouter();
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await getTags();
        setTags(tags);
      } catch (error) {
        console.error('Failed to load tags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTags();
  }, []);

  const handleTagClick = (tag: TagWithCount) => {
    if (onTagSelect) {
      onTagSelect(tag.id);
    } else {
      // Default behavior: navigate to notes with this tag filter
      router.push(`/notes?tags=${tag.id}`);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-2">
                <div className="h-6 w-16 bg-gray-200 rounded" />
                <div className="h-4 w-8 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Tag className="h-4 w-4" />
          Tags
        </CardTitle>
        <CardDescription>
          {tags.length === 0
            ? 'No tags yet'
            : `${tags.length} tag${tags.length === 1 ? '' : 's'}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {tags.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Hash className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No tags yet</p>
            <Button
              variant="link"
              size="sm"
              className="mt-2 h-auto p-0"
              onClick={() => router.push('/settings/tags')}
            >
              Create your first tag
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <div
                  key={tag.id}
                  className={`
                    flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors
                    hover:bg-muted/50
                    ${isSelected ? 'bg-primary/10 border border-primary/20' : ''}
                  `}
                  onClick={() => handleTagClick(tag)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <TagBadge tag={tag} size="sm" />
                    <span className="text-sm text-muted-foreground truncate">
                      {tag.note_count}
                    </span>
                  </div>
                  {isSelected && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => router.push('/settings/tags')}
            >
              Manage Tags
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
