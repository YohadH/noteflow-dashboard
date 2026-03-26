import { useState, useMemo } from 'react';
import { useNoteStore } from '@/stores/noteStore';
import { useOutletContext } from 'react-router-dom';
import { Note } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { cn } from '@/lib/utils';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { he } from 'date-fns/locale';
import { CalendarDays, Clock, StickyNote } from 'lucide-react';

export default function CalendarPage() {
  const { notes, reminders } = useNoteStore();
  const { onEditNote } = useOutletContext<{ onEditNote: (note: Note) => void }>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());

  // Map notes to their due dates
  const notesByDate = useMemo(() => {
    const map = new Map<string, Note[]>();
    notes.forEach((note) => {
      if (note.dueDate) {
        const key = format(parseISO(note.dueDate), 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(note);
      }
    });
    return map;
  }, [notes]);

  // Map reminders to their dates
  const remindersByDate = useMemo(() => {
    const map = new Map<string, typeof reminders>();
    reminders.forEach((r) => {
      const key = format(parseISO(r.reminderAt), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [reminders]);

  // Get dates that have notes for dot indicators
  const datesWithNotes = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(month),
      end: endOfMonth(month),
    });
    return days.filter((day) => {
      const key = format(day, 'yyyy-MM-dd');
      return notesByDate.has(key) || remindersByDate.has(key);
    });
  }, [month, notesByDate, remindersByDate]);

  const selectedKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const selectedNotes = selectedKey ? (notesByDate.get(selectedKey) || []) : [];
  const selectedReminders = selectedKey ? (remindersByDate.get(selectedKey) || []) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">לוח שנה</h1>
        <p className="text-sm text-muted-foreground mt-1">צפה בפתקים ותזכורות לפי תאריך</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        {/* Calendar */}
        <div className="bg-card rounded-lg border p-4 shadow-card self-start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={month}
            onMonthChange={setMonth}
            locale={he}
            dir="rtl"
            className={cn("p-3 pointer-events-auto")}
            modifiers={{
              hasNotes: datesWithNotes,
            }}
            modifiersClassNames={{
              hasNotes: 'bg-primary/15 font-bold text-primary',
            }}
          />
          <div className="flex items-center gap-2 mt-3 px-3 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-primary/15 border border-primary/30" />
            <span>תאריכים עם פתקים/תזכורות</span>
          </div>
        </div>

        {/* Selected date details */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {selectedDate
              ? format(selectedDate, 'EEEE, d בMMMM yyyy', { locale: he })
              : 'בחר תאריך'}
          </h2>

          {selectedNotes.length === 0 && selectedReminders.length === 0 && (
            <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground shadow-card">
              <StickyNote className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>אין פתקים או תזכורות לתאריך זה</p>
            </div>
          )}

          {selectedNotes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5" /> פתקים ({selectedNotes.length})
              </h3>
              {selectedNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => onEditNote(note)}
                  className="w-full text-right bg-card rounded-lg border p-4 shadow-card hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{note.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={note.priority} />
                      <Badge variant="secondary" className="text-xs">{note.status === 'active' ? 'פעיל' : note.status === 'completed' ? 'הושלם' : 'בארכיון'}</Badge>
                    </div>
                  </div>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedReminders.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> תזכורות ({selectedReminders.length})
              </h3>
              {selectedReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={cn(
                    "bg-card rounded-lg border p-4 shadow-card",
                    reminder.completed && "opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium truncate", reminder.completed && "line-through")}>
                        {reminder.noteTitle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(parseISO(reminder.reminderAt), 'HH:mm')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={reminder.priority} />
                      {reminder.completed && (
                        <Badge variant="secondary" className="text-xs">הושלם</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
