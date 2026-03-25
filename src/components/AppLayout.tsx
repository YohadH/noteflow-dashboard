import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { NoteEditor } from './NoteEditor';
import { useNoteStore } from '@/stores/noteStore';
import { Note } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function AppLayout() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const { addNote, updateNote } = useNoteStore();
  const { toast } = useToast();

  const handleNewNote = () => {
    setEditingNote(null);
    setEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setEditorOpen(true);
  };

  const handleSaveNote = (note: Note) => {
    if (editingNote) {
      updateNote(note.id, note);
      toast({ title: 'הפתק עודכן', description: `"${note.title}" נשמר בהצלחה.` });
    } else {
      addNote(note);
      toast({ title: 'פתק נוצר', description: `"${note.title}" נוסף בהצלחה.` });
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onNewNote={handleNewNote} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet context={{ onEditNote: handleEditNote, onNewNote: handleNewNote }} />
        </main>
      </div>
      <NoteEditor note={editingNote} open={editorOpen} onClose={() => setEditorOpen(false)} onSave={handleSaveNote} />
    </div>
  );
}
