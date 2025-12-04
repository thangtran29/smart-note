import type { Tag } from '@/lib/tags/types';

/**
 * Validate tag name format and constraints
 */
export function validateTagName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Tag name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length > 50) {
    return { valid: false, error: 'Tag name must be 50 characters or less' };
  }

  // Allow alphanumeric, spaces, hyphens, underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
    return { valid: false, error: 'Tag name can only contain letters, numbers, spaces, hyphens, and underscores' };
  }

  return { valid: true };
}

/**
 * Validate hex color format
 */
export function validateHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Generate a random color for tags
 */
export function generateRandomColor(): string {
  const colors = [
    '#EF4444', // red
    '#F97316', // orange
    '#EAB308', // yellow
    '#22C55E', // green
    '#06B6D4', // cyan
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#6B7280', // gray
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Normalize tag name for comparison (case-insensitive)
 */
export function normalizeTagName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Check if two tag names are equivalent (case-insensitive)
 */
export function areTagNamesEqual(name1: string, name2: string): boolean {
  return normalizeTagName(name1) === normalizeTagName(name2);
}

/**
 * Find duplicate tags by name (case-insensitive)
 */
export function findDuplicateTags(tags: Tag[]): Tag[] {
  const seen = new Set<string>();
  const duplicates: Tag[] = [];

  for (const tag of tags) {
    const normalized = normalizeTagName(tag.name);
    if (seen.has(normalized)) {
      duplicates.push(tag);
    } else {
      seen.add(normalized);
    }
  }

  return duplicates;
}

/**
 * Sort tags alphabetically by name
 */
export function sortTagsByName(tags: Tag[]): Tag[] {
  return [...tags].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Group tags by first letter
 */
export function groupTagsByFirstLetter(tags: Tag[]): Record<string, Tag[]> {
  const groups: Record<string, Tag[]> = {};

  for (const tag of tags) {
    const firstLetter = tag.name.charAt(0).toUpperCase();
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(tag);
  }

  // Sort groups alphabetically
  const sortedGroups: Record<string, Tag[]> = {};
  Object.keys(groups).sort().forEach(key => {
    sortedGroups[key] = sortTagsByName(groups[key]);
  });

  return sortedGroups;
}
