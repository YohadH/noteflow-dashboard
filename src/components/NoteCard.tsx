import type { Note } from '@/types';
import { Archive, Bell, Clock, Mail, MoreHorizontal, Pin, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { statusConfig, formatDate } from '@/lib/noteUtils';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/userStore';

interface NoteCardProps {
  note: Note;
  view?: 'grid' | 'list';
  onEdit?: (note: Note) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function NoteCard({ note, view = 'grid', onEdit, onDelete, onArchive }: NoteCardProps) {
  const currentUser = useUserStore((state) => state.currentUser);
  const isGrid = view === 'grid';
  const canDelete = !note.ownerUserId || note.ownerUserId === currentUser?.id;

  return (
    <div
      onClick={() => onEdit?.(note)}
      className={cn(
        'group relative animate-slide-in cursor-pointer rounded-lg border bg-card p-4 transition-all duration-200',
        'hover:border-primary/20 hover:shadow-md',
        isGrid ? 'flex flex-col gap-3' : 'flex items-center gap-4',
        note.pinned && 'ring-1 ring-primary/20',
      )}
    >
      {note.pinned && <Pin className="absolute left-3 top-3 h-3.5 w-3.5 text-primary opacity-60" />}

      <div className={cn('min-w-0 flex-1', isGrid ? '' : 'flex items-center gap-4')}>
        <div className="min-w-0 flex-1">
          <h3 className="truncate pl-6 text-sm font-medium">{note.title}</h3>
          {isGrid && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{note.content}</p>}
          {note.isShared !== undefined && (
            <span className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {note.isShared ? 'משותף' : 'פרטי'}
            </span>
          )}
        </div>

        <div className={cn('flex flex-wrap items-center gap-2', isGrid ? 'mt-auto pt-2' : '')}>
          <PriorityBadge priority={note.priority} />
          <StatusBadge {...statusConfig[note.status]} />
          {note.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className={cn('flex items-center gap-3 text-muted-foreground', isGrid ? '-mx-4 border-t px-4 pt-3' : '')}>
        {note.dueDate && (
          <span className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            {formatDate(note.dueDate)}
          </span>
        )}
        {note.hasAlert && <Bell className="h-3 w-3" />}
        {note.hasEmailAction && <Mail className="h-3 w-3" />}

        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(event) => event.stopPropagation()}
            className="ms-auto rounded p-1 opacity-100 transition-opacity hover:bg-muted sm:opacity-0 sm:group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onEdit?.(note); }}>
              עריכה
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onArchive?.(note.id); }}>
              <Archive className="ml-2 h-4 w-4" />
              העבר לארכיון
            </DropdownMenuItem>
            {canDelete && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={(event) => { event.stopPropagation(); onDelete?.(note.id); }}
              >
                <Trash2 className="ml-2 h-4 w-4" />
                הסר כרטיס
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
