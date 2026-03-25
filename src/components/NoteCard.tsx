import { Note } from '@/types';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { statusConfig, formatDate } from '@/lib/noteUtils';
import { Pin, Clock, Bell, Mail, Trash2, Archive, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NoteCardProps {
  note: Note;
  view?: 'grid' | 'list';
  onEdit?: (note: Note) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function NoteCard({ note, view = 'grid', onEdit, onDelete, onArchive }: NoteCardProps) {
  const isGrid = view === 'grid';

  return (
    <div
      onClick={() => onEdit?.(note)}
      className={cn(
        'group relative bg-card rounded-lg border p-4 cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-primary/20',
        'animate-slide-in',
        isGrid ? 'flex flex-col gap-3' : 'flex items-center gap-4',
        note.pinned && 'ring-1 ring-primary/20'
      )}
    >
      {note.pinned && (
        <Pin className="absolute top-3 right-3 h-3.5 w-3.5 text-primary opacity-60" />
      )}

      <div className={cn('flex-1 min-w-0', isGrid ? '' : 'flex items-center gap-4')}>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate pr-6">{note.title}</h3>
          {isGrid && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
          )}
        </div>

        <div className={cn('flex items-center gap-2 flex-wrap', isGrid ? 'mt-auto pt-2' : '')}>
          <PriorityBadge priority={note.priority} />
          <StatusBadge {...statusConfig[note.status]} />
          {note.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className={cn('flex items-center gap-3 text-muted-foreground', isGrid ? 'border-t pt-3 -mx-4 px-4' : '')}>
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
            onClick={(e) => e.stopPropagation()}
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(note); }}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive?.(note.id); }}>
              <Archive className="h-4 w-4 mr-2" />Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete?.(note.id); }}
            >
              <Trash2 className="h-4 w-4 mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
