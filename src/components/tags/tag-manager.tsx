'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TagForm } from '@/components/tags/tag-form';
import { TagBadge } from '@/components/tags/tag-badge';
import { getTags } from '@/lib/tags/client-queries';
import type { TagWithCount } from '@/lib/tags/types';

export function TagManager() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTag, setEditingTag] = useState<TagWithCount | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadTags = async () => {
    try {
      const tags = await getTags();
      setTags(tags);
      setError('');
    } catch {
      setError('Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N to create new tag
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !showCreateForm && !editingTag) {
        e.preventDefault();
        setShowCreateForm(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showCreateForm, editingTag]);

  useEffect(() => {
    loadTags();
  }, []);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadTags();
  };

  const handleEditSuccess = () => {
    setEditingTag(null);
    loadTags();
  };

  const handleDelete = async (tag: TagWithCount) => {
    if (!confirm(`Delete "${tag.name}"? This action cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/tags/${tag.id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok) {
          loadTags();
        } else {
          alert(result.error || 'Failed to delete tag');
        }
      } catch {
        alert('Failed to delete tag');
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading tags...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Form */}
      {showCreateForm && (
        <TagForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Form */}
      {editingTag && (
        <TagForm
          tag={editingTag}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingTag(null)}
        />
      )}

      {/* Tags List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Tags</CardTitle>
            <CardDescription>
              {tags.length === 0
                ? 'No tags yet. Create your first tag to start organizing notes.'
                : `${tags.length} tag${tags.length === 1 ? '' : 's'}`
              }
            </CardDescription>
          </div>
          {!showCreateForm && !editingTag && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {tags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tags yet. Create your first tag to get started.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TagBadge tag={tag} />
                    <div className="text-sm text-muted-foreground">
                      {tag.note_count} note{tag.note_count === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTag(tag)}
                      disabled={isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tag)}
                      disabled={isPending || tag.note_count > 0}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {tags.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tags with assigned notes cannot be deleted. Remove the tag from all notes first.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
