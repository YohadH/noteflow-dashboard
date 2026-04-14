import { useNoteStore } from '@/stores/noteStore';
import { PriorityBadge } from '@/components/PriorityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { alertStatusConfig, formatDateTime } from '@/lib/noteUtils';
import { AlertTriangle, Wifi, Mail, Bell, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertChannel } from '@/types';

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
  const { alerts } = useNoteStore();

  const groups = [
    { title: 'פעילות', items: alerts.filter((a) => a.status === 'active') },
    { title: 'מתוזמנות', items: alerts.filter((a) => a.status === 'scheduled') },
    { title: 'נשלחו', items: alerts.filter((a) => a.status === 'sent') },
    { title: 'נכשלו', items: alerts.filter((a) => a.status === 'failed') },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">התראות</h1>
        <p className="text-sm text-muted-foreground mt-1">ניהול התראות המקושרות לפתקים שלך</p>
      </div>

      <div className="rounded-lg border bg-accent/50 p-4 text-sm text-accent-foreground flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <p>שליחת ההתראות מטופלת על ידי הבקאנד (n8n / webhooks). תצוגה זו מנהלת את הגדרות ההתראות.</p>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {group.title} ({group.items.length})
            </h2>
            {group.items.length === 0 ? (
              <p className="text-sm text-muted-foreground pr-1">אין התראות {group.title.toLowerCase()}</p>
            ) : (
              <div className="space-y-2">
                {group.items.map((alert) => (
                  <div key={alert.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-card rounded-lg border p-4 shadow-card hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <PriorityBadge priority={alert.priority} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{alert.noteTitle}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="capitalize">{alert.type}</span>
                          <span>{formatDateTime(alert.scheduledAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
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
    </div>
  );
}
