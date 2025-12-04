import { Badge } from '@/components/ui/badge';
import type { Tag } from '@/lib/tags/types';

interface TagBadgeProps {
  tag: Tag;
  size?: 'sm' | 'md';
  clickable?: boolean;
  onClick?: () => void;
}

export function TagBadge({ tag, size = 'md', clickable = false, onClick }: TagBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <Badge
      variant="secondary"
      className={`${sizeClasses} ${clickable ? 'cursor-pointer hover:opacity-80' : ''}`}
      style={{
        backgroundColor: tag.color + '20', // Add transparency
        borderColor: tag.color,
        color: tag.color,
      }}
      onClick={clickable ? onClick : undefined}
    >
      {tag.name}
    </Badge>
  );
}
