import { useOutletContext } from 'react-router-dom';
import type { NavigateFunction } from 'react-router-dom';
import { AlertTriangle, Bell, Clock, Flag, Mail, Plus, StickyNote } from 'lucide-react';
import { useNoteStore } from '@/stores/noteStore';
import { PriorityBadge } from '@/components/PriorityBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/noteUtils';
import type { Note } from '@/types';

interface LayoutContext {
  onEditNote: (note: Note) => void;
  onNewNote: (defaults?: Partial<Note>) => void;
  navigate: NavigateFunction;
}

function buildDefaultReminderAt(defaultReminderTime?: string) {
  const now = new Date();
  const fallback = new Date(now.getTime() + 60 * 60 * 1000);
  fallback.setSeconds(0, 0);

  if (!defaultReminderTime) {
    return fallback.toISOString();
  }

  const [hoursText = '09', minutesText = '00'] = defaultReminderTime.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return fallback.toISOString();
  }

  const candidate = new Date(now);
  candidate.setHours(hours, minutes, 0, 0);

  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate.toISOString();
}

function isToday(iso?: string) {
  if (!iso) {
    return false;
  }

  const target = new Date(iso);
  const now = new Date();

  return (
    target.getFullYear() === now.getFullYear()
    && target.getMonth() === now.getMonth()
    && target.getDate() === now.getDate()
  );
}

export default function DashboardPage() {
  const { notes, reminders, alerts, emailActions, settings } = useNoteStore();
  const { onEditNote, onNewNote, navigate } = useOutletContext<LayoutContext>();

  const activeNotes = notes.filter((note) => note.status === 'active');
  const dueToday = activeNotes.filter((note) => isToday(note.dueDate));
  const highPriority = activeNotes.filter((note) => note.priority === 'high' || note.priority === 'urgent');
  const upcomingReminders = reminders.filter((reminder) => !reminder.completed).slice(0, 5);
  const recentNotes = [...notes]
    .sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime())
    .slice(0, 5);
  const pendingAlerts = alerts.filter((alert) => alert.status === 'active' || alert.status === 'scheduled');

  const stats = [
    { label: 'סה"כ פתקים', value: notes.length, icon: StickyNote, color: 'text-primary' },
    { label: 'לביצוע היום', value: dueToday.length, icon: Clock, color: 'text-priority-high' },
    { label: 'עדיפות גבוהה', value: highPriority.length, icon: Flag, color: 'text-priority-urgent' },
    { label: 'תזכורות קרובות', value: upcomingReminders.length, icon: Bell, color: 'text-priority-medium' },
    { label: 'התראות פעילות', value: pendingAlerts.length, icon: AlertTriangle, color: 'text-status-pending' },
    { label: 'פעולות אימייל', value: emailActions.length, icon: Mail, color: 'text-primary' },
  ];

  const quickActions = [
    { label: 'פתק חדש', icon: Plus, action: () => onNewNote() },
    { label: 'הוסף תזכורת', icon: Bell, action: () => onNewNote({ reminderAt: buildDefaultReminderAt(settings.defaultReminderTime) }) },
    { label: 'הוסף התראה', icon: AlertTriangle, action: () => navigate('/alerts?new=1') },
    { label: 'טיוטת אימייל', icon: Mail, action: () => onNewNote({ hasEmailAction: true }) },
  ];

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">לוח בקרה</h1>
        <p className="mt-1 text-sm text-muted-foreground">מבט מהיר על הפתקים, התזכורות, ההתראות ופעולות האימייל שלך.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <stat.icon className={cn('h-4 w-4', stat.color)} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <Button key={action.label} variant="outline" size="sm" onClick={action.action} className="gap-1.5">
            <action.icon className="h-4 w-4" />
            {action.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex max-h-80 flex-col rounded-lg border bg-card p-5 shadow-card">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium">
            <Flag className="h-4 w-4 text-priority-urgent" />
            עדיפות גבוהה
          </h2>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
            {highPriority.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין כרגע פתקים בעדיפות גבוהה.</p>
            ) : (
              highPriority.map((note) => (
                <div
                  key={note.id}
                  onClick={() => onEditNote(note)}
                  className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50"
                >
                  <PriorityBadge priority={note.priority} />
                  <span className="flex-1 truncate text-sm">{note.title}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex max-h-80 flex-col rounded-lg border bg-card p-5 shadow-card">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4 text-primary" />
            תזכורות קרובות
          </h2>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
            {upcomingReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין תזכורות קרובות.</p>
            ) : (
              upcomingReminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50">
                  <PriorityBadge priority={reminder.priority} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{reminder.noteTitle}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(reminder.reminderAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex max-h-80 flex-col rounded-lg border bg-card p-5 shadow-card">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium">
            <StickyNote className="h-4 w-4 text-primary" />
            פתקים אחרונים
          </h2>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
            {recentNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onEditNote(note)}
                className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50"
              >
                <span className="flex-1 truncate text-sm">{note.title}</span>
                <span className="text-xs text-muted-foreground">{formatDate(note.updatedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
