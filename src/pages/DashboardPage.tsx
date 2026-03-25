import { useOutletContext } from 'react-router-dom';
import { useNoteStore } from '@/stores/noteStore';
import { Note } from '@/types';
import { StickyNote, Clock, AlertTriangle, Bell, Mail, Flag, Plus, Zap } from 'lucide-react';
import { PriorityBadge } from '@/components/PriorityBadge';
import { formatDate } from '@/lib/noteUtils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NavigateFunction } from 'react-router-dom';

interface LayoutContext {
  onEditNote: (note: Note) => void;
  onNewNote: (defaults?: Partial<Note>) => void;
  navigate: NavigateFunction;
}

export default function DashboardPage() {
  const { notes, reminders, alerts, emailActions } = useNoteStore();
  const { onEditNote, onNewNote, navigate } = useOutletContext<LayoutContext>();

  const activeNotes = notes.filter((n) => n.status === 'active');
  const dueToday = activeNotes.filter((n) => n.dueDate && formatDate(n.dueDate) === 'היום');
  const highPriority = activeNotes.filter((n) => n.priority === 'high' || n.priority === 'urgent');
  const upcomingReminders = reminders.filter((r) => !r.completed).slice(0, 5);
  const recentNotes = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
  const pendingAlerts = alerts.filter((a) => a.status === 'active' || a.status === 'scheduled');

  const stats = [
    { label: 'סה״כ פתקים', value: notes.length, icon: StickyNote, color: 'text-primary' },
    { label: 'לביצוע היום', value: dueToday.length, icon: Clock, color: 'text-priority-high' },
    { label: 'עדיפות גבוהה', value: highPriority.length, icon: Flag, color: 'text-priority-urgent' },
    { label: 'תזכורות קרובות', value: upcomingReminders.length, icon: Bell, color: 'text-priority-medium' },
    { label: 'התראות ממתינות', value: pendingAlerts.length, icon: AlertTriangle, color: 'text-status-pending' },
    { label: 'פעולות אימייל', value: emailActions.length, icon: Mail, color: 'text-primary' },
  ];

  const quickActions = [
    { label: 'הוסף פתק', icon: Plus, action: () => onNewNote() },
    { label: 'הגדר תזכורת', icon: Bell, action: () => onNewNote({ reminderAt: new Date().toISOString() }) },
    { label: 'צור התראה', icon: AlertTriangle, action: () => onNewNote({ hasAlert: true }) },
    { label: 'טיוטת אימייל', icon: Mail, action: () => onNewNote({ hasEmailAction: true }) },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">לוח בקרה</h1>
        <p className="text-sm text-muted-foreground mt-1">הפרודוקטיביות שלך במבט אחד</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-lg border p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={cn('h-4 w-4', s.color)} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {quickActions.map((qa) => (
          <Button key={qa.label} variant="outline" size="sm" onClick={qa.action} className="gap-1.5">
            <qa.icon className="h-4 w-4" />
            {qa.label}
          </Button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Today's priorities */}
        <div className="bg-card rounded-lg border p-5 shadow-card flex flex-col max-h-80">
          <h2 className="font-medium text-sm mb-4 flex items-center gap-2 shrink-0">
            <Flag className="h-4 w-4 text-priority-urgent" />
            עדיפויות להיום
          </h2>
          <div className="space-y-3 overflow-y-auto min-h-0 flex-1">
            {highPriority.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין פריטים בעדיפות גבוהה</p>
            ) : (
              highPriority.map((note) => (
                <div key={note.id} onClick={() => onEditNote(note)} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                  <PriorityBadge priority={note.priority} />
                  <span className="text-sm truncate flex-1">{note.title}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming reminders */}
        <div className="bg-card rounded-lg border p-5 shadow-card flex flex-col max-h-80">
          <h2 className="font-medium text-sm mb-4 flex items-center gap-2 shrink-0">
            <Bell className="h-4 w-4 text-primary" />
            תזכורות קרובות
          </h2>
          <div className="space-y-3 overflow-y-auto min-h-0 flex-1">
            {upcomingReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין תזכורות קרובות</p>
            ) : (
              upcomingReminders.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <PriorityBadge priority={r.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{r.noteTitle}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.reminderAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent notes */}
        <div className="bg-card rounded-lg border p-5 shadow-card flex flex-col max-h-80">
          <h2 className="font-medium text-sm mb-4 flex items-center gap-2 shrink-0">
            <StickyNote className="h-4 w-4 text-primary" />
            פתקים אחרונים
          </h2>
          <div className="space-y-3 overflow-y-auto min-h-0 flex-1">
            {recentNotes.map((note) => (
              <div key={note.id} onClick={() => onEditNote(note)} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                <span className="text-sm truncate flex-1">{note.title}</span>
                <span className="text-xs text-muted-foreground">{formatDate(note.updatedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
