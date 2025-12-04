'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Palette } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateRandomColor, validateTagName, validateHexColor } from '@/lib/tags/utils';
import type { Tag } from '@/lib/tags/types';

interface TagFormProps {
  tag?: Tag;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TagForm({ tag, onSuccess, onCancel }: TagFormProps) {
  const [name, setName] = useState(tag?.name || '');
  const [color, setColor] = useState(tag?.color || generateRandomColor());
  const [error, setError] = useState<string>('');
  const [isPending, setIsPending] = useState(false);

  const isEditing = !!tag;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPending(true);

    // Validate name
    const nameValidation = validateTagName(name);
    if (!nameValidation.valid) {
      setError(nameValidation.error!);
      setIsPending(false);
      return;
    }

    // Validate color
    if (!validateHexColor(color)) {
      setError('Invalid color format');
      setIsPending(false);
      return;
    }

    try {
      const url = isEditing ? `/api/tags/${tag!.id}` : '/api/tags';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          color,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess?.();
      } else {
        setError(result.error || 'An error occurred');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsPending(false);
    }
  };

  const handleRandomColor = () => {
    setColor(generateRandomColor());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Tag' : 'Create Tag'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Update the tag name and color'
            : 'Create a new tag to organize your notes'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tag Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tag name"
              disabled={isPending}
              maxLength={50}
            />
            <p className="text-sm text-muted-foreground">
              Tag names are unique and case-insensitive
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-10"
                  disabled={isPending}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRandomColor}
                disabled={isPending}
                title="Generate random color"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose a color to visually distinguish this tag
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? 'Saving...' : isEditing ? 'Update Tag' : 'Create Tag'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
