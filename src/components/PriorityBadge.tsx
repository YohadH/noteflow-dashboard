import { cn } from '@/lib/utils';
import { Priority } from '@/types';
import { priorityConfig } from '@/lib/noteUtils';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-medium',
      config.className,
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotClass)} />
      {config.label}
    </span>
  );
}
