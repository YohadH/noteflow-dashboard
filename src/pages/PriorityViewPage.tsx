import { useOutletContext } from 'react-router-dom';
import { useNoteStore } from '@/stores/noteStore';
import { Note, Priority } from '@/types';
import { PriorityBadge } from '@/components/PriorityBadge';
import { formatDate } from '@/lib/noteUtils';
import { cn } from '@/lib/utils';

interface LayoutContext {
  onEditNote: (note: Note) => void;
  onNewNote: () => void;
}

const columns: Priority[] = ['urgent', 'high', 'medium', 'low'];

const columnStyles: Record<Priority, string> = {
  urgent: 'border-t-priority-urgent',
  high: 'border-t-priority-high',
  medium: 'border-t-priority-medium',
  low: 'border-t-primary',
};

export default function PriorityViewPage() {
  const { notes, updateNote } = useNoteStore();
  const { onEditNote } = useOutletContext<LayoutContext>();
  const activeNotes = notes.filter((n) => n.status === 'active');

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData('noteId', noteId);
  };

  const handleDrop = (e: React.DragEvent, priority: Priority) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('noteId');
    updateNote(noteId, { priority });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">תצוגת עדיפות</h1>
        <p className="text-sm text-muted-foreground mt-1">גרור פתקים בין עמודות לשינוי עדיפות</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((priority) => {
          const items = activeNotes.filter((n) => n.priority === priority);
          return (
            <div
              key={priority}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, priority)}
              className={cn('bg-card rounded-lg border border-t-4 p-4 min-h-[300px]', columnStyles[priority])}
            >
              <div className="flex items-center justify-between mb-4">
                <PriorityBadge priority={priority} size="md" />
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((note) => (
                  <div
                    key={note.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, note.id)}
                    onClick={() => onEditNote(note)}
                    className="bg-background rounded-md border p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow"
                  >
                    <p className="text-sm font-medium truncate">{note.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{note.content}</p>
                    {note.dueDate && (
                      <p className="text-xs text-muted-foreground mt-2">{formatDate(note.dueDate)}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.map((t) => (
                        <span key={t} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">שחרר פתקים כאן</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
