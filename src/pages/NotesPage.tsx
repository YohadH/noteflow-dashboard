import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useNoteStore } from '@/stores/noteStore';
import { Note, Priority, NoteStatus } from '@/types';
import { NoteCard } from '@/components/NoteCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutGrid, List, Search, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface LayoutContext {
  onEditNote: (note: Note) => void;
  onNewNote: () => void;
}

type SortBy = 'newest' | 'oldest' | 'priority' | 'dueDate';

const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function NotesPage() {
  const { notes, deleteNote, updateNote } = useNoteStore();
  const { onEditNote, onNewNote } = useOutletContext<LayoutContext>();
  const { toast } = useToast();

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = notes.filter((n) => {
      if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.content.toLowerCase().includes(search.toLowerCase())) return false;
      if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && n.status !== statusFilter) return false;
      return true;
    });
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'priority': return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'dueDate': return (a.dueDate || '9').localeCompare(b.dueDate || '9');
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return result;
  }, [notes, search, priorityFilter, statusFilter, sortBy]);

  const pinnedNotes = filtered.filter((n) => n.pinned);
  const unpinnedNotes = filtered.filter((n) => !n.pinned);

  const handleDelete = () => {
    if (deleteId) {
      deleteNote(deleteId);
      toast({ title: 'Note deleted', variant: 'destructive' });
      setDeleteId(null);
    }
  };

  const handleArchive = (id: string) => {
    updateNote(id, { status: 'archived' });
    toast({ title: 'Note archived' });
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} notes</p>
        </div>
        <Button onClick={onNewNote} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Filter notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="dueDate">Due Date</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border rounded-md">
          <button onClick={() => setView('grid')} className={cn('p-2 rounded-l-md', view === 'grid' ? 'bg-muted' : 'hover:bg-muted/50')}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setView('list')} className={cn('p-2 rounded-r-md', view === 'list' ? 'bg-muted' : 'hover:bg-muted/50')}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Pinned */}
      {pinnedNotes.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Pinned</h2>
          <div className={cn(view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-2')}>
            {pinnedNotes.map((n) => (
              <NoteCard key={n.id} note={n} view={view} onEdit={onEditNote} onDelete={setDeleteId} onArchive={handleArchive} />
            ))}
          </div>
        </div>
      )}

      {/* All notes */}
      {unpinnedNotes.length > 0 ? (
        <div className={cn(view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-2')}>
          {unpinnedNotes.map((n) => (
            <NoteCard key={n.id} note={n} view={view} onEdit={onEditNote} onDelete={setDeleteId} onArchive={handleArchive} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No notes match your filters</p>
          <Button variant="outline" className="mt-4" onClick={onNewNote}>Create a note</Button>
        </div>
      ) : null}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
