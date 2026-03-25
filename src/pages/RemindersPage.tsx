import { useNoteStore } from '@/stores/noteStore';
import { PriorityBadge } from '@/components/PriorityBadge';
import { formatDateTime, formatDate } from '@/lib/noteUtils';
import { Button } from '@/components/ui/button';
import { Check, Clock, AlarmClock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function RemindersPage() {
  const { reminders, toggleReminderComplete, snoozeReminder } = useNoteStore();
  const { toast } = useToast();

  const today = reminders.filter((r) => !r.completed && formatDate(r.reminderAt) === 'Today');
  const overdue = reminders.filter((r) => !r.completed && new Date(r.reminderAt) < new Date() && formatDate(r.reminderAt) !== 'Today');
  const upcoming = reminders.filter((r) => !r.completed && new Date(r.reminderAt) > new Date() && formatDate(r.reminderAt) !== 'Today');
  const completed = reminders.filter((r) => r.completed);

  const handleSnooze = (id: string) => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    snoozeReminder(id, tomorrow);
    toast({ title: 'Reminder snoozed until tomorrow' });
  };

  const handleComplete = (id: string) => {
    toggleReminderComplete(id);
    toast({ title: 'Reminder marked as done' });
  };

  const Section = ({ title, icon, items, emptyText }: { title: string; icon: React.ReactNode; items: typeof reminders; emptyText: string }) => (
    <div className="bg-card rounded-lg border p-5 shadow-card">
      <h2 className="font-medium text-sm mb-4 flex items-center gap-2">{icon}{title}<span className="text-muted-foreground">({items.length})</span></h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className={cn('flex items-center gap-3 p-3 rounded-md border transition-colors', r.completed ? 'opacity-60' : 'hover:bg-muted/50')}>
              <PriorityBadge priority={r.priority} />
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', r.completed && 'line-through')}>{r.noteTitle}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(r.reminderAt)}</p>
              </div>
              {!r.completed && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleSnooze(r.id)} className="h-8 px-2">
                    <AlarmClock className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleComplete(r.id)} className="h-8 px-2">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reminders</h1>
        <p className="text-sm text-muted-foreground mt-1">Stay on top of your schedule</p>
      </div>

      <div className="space-y-4">
        {overdue.length > 0 && <Section title="Overdue" icon={<Clock className="h-4 w-4 text-priority-urgent" />} items={overdue} emptyText="" />}
        <Section title="Today" icon={<Clock className="h-4 w-4 text-priority-high" />} items={today} emptyText="No reminders for today" />
        <Section title="Upcoming" icon={<Clock className="h-4 w-4 text-primary" />} items={upcoming} emptyText="No upcoming reminders" />
        <Section title="Completed" icon={<Check className="h-4 w-4 text-status-completed" />} items={completed} emptyText="No completed reminders" />
      </div>
    </div>
  );
}
