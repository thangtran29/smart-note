'use client';

// Simplified tag interface for display
interface DisplayTag {
  id: string;
  name: string;
  color?: string;
}

interface TagsDisplayProps {
  tags?: DisplayTag[];
  maxDisplay?: number;
}

export function TagsDisplay({ tags, maxDisplay = 3 }: TagsDisplayProps) {
  if (!tags || tags.length === 0) return null;

  const displayTags = tags.slice(0, maxDisplay);
  const remainingCount = tags.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {displayTags.map((tag: DisplayTag) => (
        <span
          key={tag.id}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          style={tag.color ? { backgroundColor: tag.color + '20', color: tag.color } : undefined}
        >
          {tag.name}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
