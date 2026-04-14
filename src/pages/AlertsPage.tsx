import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Bell, Mail, Smartphone, Wifi } from 'lucide-react';
import { useNoteStore } from '@/stores/noteStore';
import { AlertEditor } from '@/components/AlertEditor';
import { PriorityBadge } from '@/components/PriorityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { alertStatusConfig, formatDateTime } from '@/lib/noteUtils';
import type { AlertChannel } from '@/types';

const channelIcon: Record<AlertChannel, React.ReactNode> = {
  email: <Mail className="h-3.5 w-3.5" />,
  'in-app': <Bell className="h-3.5 w-3.5" />,
  webhook: <Wifi className="h-3.5 w-3.5" />,
  push: <Smartphone className="h-3.5 w-3.5" />,
};

const channelLabel: Record<AlertChannel, string> = {
  email: 'אימייל',
  'in-app': 'באפליקציה',
  webhook: 'webhook',
  push: 'push',
};

export default function AlertsPage() {
  const { alerts, notes, updateNote } = useNoteStore();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditorOpen(true);
    }
  }, [searchParams]);

  const selectableNotes = useMemo(
    () => notes.filter((note) => note.status !== 'archived'),
    [notes],
  );

  const groups = [
    { title: 'פעילות', items: alerts.filter((alert) => alert.status === 'active') },
    { title: 'מתוזמנות', items: alerts.filter((alert) => alert.status === 'scheduled') },
    { title: 'נשלחו', items: alerts.filter((alert) => alert.status === 'sent') },
    { title: 'נכשלו', items: alerts.filter((alert) => alert.status === 'failed') },
  ];

  const closeEditor = () => {
    setEditorOpen(false);
    if (searchParams.get('new') === '1') {
      setSearchParams({}, { replace: true });
    }
  };

  const handleCreateAlert = async ({ noteId, reminderAt }: { noteId: string; reminderAt: string }) => {
    try {
      await updateNote(noteId, {
        hasAlert: true,
        reminderAt,
      });
      toast({
        title: 'ההתראה נשמרה',
        description: 'ההתראה נקשרה לפתק הקיים. לא נוצר פתק חדש.',
      });
      closeEditor();
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: error instanceof Error ? error.message : 'לא הצלחנו לשמור את ההתראה.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">התראות</h1>
          <p className="mt-1 text-sm text-muted-foreground">התראות הן שכבה נפרדת שמתחברת לפתק קיים. פתק יכול לקבל התראה, אבל התראה לא יוצרת פתק חדש.</p>
        </div>
        <Button onClick={() => setEditorOpen(true)} disabled={selectableNotes.length === 0}>
          הוסף התראה לפתק
        </Button>
      </div>

      <div className="flex items-start gap-3 rounded-lg border bg-accent/50 p-4 text-sm text-accent-foreground">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          התראות נשלחות על ידי ה-backend אחרי זמן התזכורת של הפתק. אם ה-push או ה-webhook עדיין לא מגיבים, אפשר עדיין לראות כאן את הסטטוס של ההתראה.
        </p>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group.title} ({group.items.length})
            </h2>
            {group.items.length === 0 ? (
              <p className="pr-1 text-sm text-muted-foreground">אין התראות {group.title.toLowerCase()}</p>
            ) : (
              <div className="space-y-2">
                {group.items.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-card transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <PriorityBadge priority={alert.priority} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{alert.noteTitle}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="capitalize">{alert.type}</span>
                          <span>{formatDateTime(alert.scheduledAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs text-muted-foreground">
                        {channelIcon[alert.channel]}
                        <span>{channelLabel[alert.channel]}</span>
                      </span>
                      <StatusBadge {...alertStatusConfig[alert.status]} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <AlertEditor notes={selectableNotes} open={editorOpen} onClose={closeEditor} onSave={handleCreateAlert} />
    </div>
  );
}
