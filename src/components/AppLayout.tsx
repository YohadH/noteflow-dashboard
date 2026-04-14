import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { NoteEditor } from './NoteEditor';
import { useNoteStore } from '@/stores/noteStore';
import { useUserStore } from '@/stores/userStore';
import type { Note } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function AppLayout() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editorDefaults, setEditorDefaults] = useState<Partial<Note>>({});
  const { addNote, updateNote, loadUserData, isLoading, isHydrated } = useNoteStore();
  const currentUser = useUserStore((state) => state.currentUser);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    loadUserData(currentUser.id).catch(() => {
      toast({
        title: 'שגיאה',
        description: 'טעינת הנתונים מהבקאנד נכשלה.',
        variant: 'destructive',
      });
    });
  }, [currentUser, loadUserData, toast]);

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading && !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Loading your notes...
      </div>
    );
  }

  const handleNewNote = (defaults?: Partial<Note>) => {
    setEditingNote(null);
    setEditorDefaults(defaults || {});
    setEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setEditorDefaults({});
    setEditorOpen(true);
  };

  const handleSaveNote = async (note: Note) => {
    try {
      if (editingNote) {
        await updateNote(note.id, note);
        toast({ title: 'הפתק עודכן', description: `"${note.title}" נשמר בהצלחה.` });
        return;
      }

      await addNote(note);
      toast({ title: 'פתק נוצר', description: `"${note.title}" נוסף בהצלחה.` });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שמירת הפתק נכשלה.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onNewNote={() => handleNewNote()} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet context={{ onEditNote: handleEditNote, onNewNote: handleNewNote, navigate }} />
        </main>
      </div>
      <NoteEditor
        note={editingNote}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveNote}
        defaults={editorDefaults}
      />
    </div>
  );
}
