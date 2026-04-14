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

  const today = reminders.filter((reminder) => !reminder.completed && formatDate(reminder.reminderAt) === 'היום');
  const overdue = reminders.filter(
    (reminder) =>
      !reminder.completed &&
      new Date(reminder.reminderAt) < new Date() &&
      formatDate(reminder.reminderAt) !== 'היום',
  );
  const upcoming = reminders.filter(
    (reminder) =>
      !reminder.completed &&
      new Date(reminder.reminderAt) > new Date() &&
      formatDate(reminder.reminderAt) !== 'היום',
  );
  const completed = reminders.filter((reminder) => reminder.completed);

  const handleSnooze = async (id: string) => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    await snoozeReminder(id, tomorrow);
    toast({ title: 'התזכורת נדחתה למחר' });
  };

  const handleComplete = async (id: string) => {
    await toggleReminderComplete(id);
    toast({ title: 'התזכורת סומנה כבוצעה' });
  };

  const Section = ({
    title,
    icon,
    items,
    emptyText,
  }: {
    title: string;
    icon: React.ReactNode;
    items: typeof reminders;
    emptyText: string;
  }) => (
    <div className="bg-card rounded-lg border p-5 shadow-card">
      <h2 className="font-medium text-sm mb-4 flex items-center gap-2">
        {icon}
        {title}
        <span className="text-muted-foreground">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map((reminder) => (
            <div
              key={reminder.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-md border transition-colors',
                reminder.completed ? 'opacity-60' : 'hover:bg-muted/50',
              )}
            >
              <PriorityBadge priority={reminder.priority} />
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', reminder.completed && 'line-through')}>{reminder.noteTitle}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(reminder.reminderAt)}</p>
              </div>
              {!reminder.completed && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleSnooze(reminder.id)}
                    className="h-8 px-2"
                  >
                    <AlarmClock className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleComplete(reminder.id)}
                    className="h-8 px-2"
                  >
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
        <h1 className="text-2xl font-semibold tracking-tight">תזכורות</h1>
        <p className="text-sm text-muted-foreground mt-1">הישאר מעודכן עם לוח הזמנים שלך</p>
      </div>

      <div className="space-y-4">
        {overdue.length > 0 && (
          <Section
            title="באיחור"
            icon={<Clock className="h-4 w-4 text-priority-urgent" />}
            items={overdue}
            emptyText=""
          />
        )}
        <Section
          title="היום"
          icon={<Clock className="h-4 w-4 text-priority-high" />}
          items={today}
          emptyText="אין תזכורות להיום"
        />
        <Section
          title="קרובות"
          icon={<Clock className="h-4 w-4 text-primary" />}
          items={upcoming}
          emptyText="אין תזכורות קרובות"
        />
        <Section
          title="הושלמו"
          icon={<Check className="h-4 w-4 text-status-completed" />}
          items={completed}
          emptyText="אין תזכורות שהושלמו"
        />
      </div>
    </div>
  );
}
