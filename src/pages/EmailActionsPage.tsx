import { useState } from 'react';
import { useNoteStore } from '@/stores/noteStore';
import { StatusBadge } from '@/components/StatusBadge';
import { emailStatusConfig, formatDateTime } from '@/lib/noteUtils';
import { Mail, ArrowRight, ExternalLink } from 'lucide-react';
import { EmailAction } from '@/types';
import { cn } from '@/lib/utils';

export default function EmailActionsPage() {
  const { emailActions } = useNoteStore();
  const [selected, setSelected] = useState<EmailAction | null>(null);

  const statusGroups = [
    { title: 'טיוטה', items: emailActions.filter((e) => e.status === 'draft') },
    { title: 'ממתין', items: emailActions.filter((e) => e.status === 'pending') },
    { title: 'נשלח', items: emailActions.filter((e) => e.status === 'sent') },
    { title: 'נכשל', items: emailActions.filter((e) => e.status === 'failed') },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">פעולות אימייל</h1>
        <p className="text-sm text-muted-foreground mt-1">ניהול פעולות אימייל המקושרות לפתקים. השליחה מטופלת על ידי הבקאנד.</p>
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1 space-y-4">
          {statusGroups.map((group) => group.items.length > 0 && (
            <div key={group.title}>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {group.title} ({group.items.length})
              </h2>
              <div className="space-y-2">
                {group.items.map((ea) => (
                  <div
                    key={ea.id}
                    onClick={() => setSelected(ea)}
                    className={cn(
                      'bg-card rounded-lg border p-4 shadow-card cursor-pointer transition-all hover:shadow-md',
                      selected?.id === ea.id && 'ring-1 ring-primary'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ea.subject}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">אל: {ea.recipient}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{ea.bodyPreview}</p>
                      </div>
                      <StatusBadge {...emailStatusConfig[ea.status]} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div className="hidden lg:block w-80 shrink-0">
          {selected ? (
            <div className="bg-card rounded-lg border p-5 shadow-card sticky top-20 space-y-4">
              <h3 className="font-medium text-sm">פרטי פעולת אימייל</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">פתק</span>
                  <p className="flex items-center gap-1">{selected.noteTitle} <ExternalLink className="h-3 w-3 text-muted-foreground" /></p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">נמען</span>
                  <p>{selected.recipient}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">נושא</span>
                  <p>{selected.subject}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">תצוגה מקדימה</span>
                  <p className="text-muted-foreground">{selected.bodyPreview}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">סטטוס</span>
                  <div className="mt-1"><StatusBadge {...emailStatusConfig[selected.status]} /></div>
                </div>
                {selected.scheduledAt && (
                  <div>
                    <span className="text-xs text-muted-foreground">מתוזמן</span>
                    <p>{formatDateTime(selected.scheduledAt)}</p>
                  </div>
                )}
                {selected.sentAt && (
                  <div>
                    <span className="text-xs text-muted-foreground">נשלח</span>
                    <p>{formatDateTime(selected.sentAt)}</p>
                  </div>
                )}

                {/* Status timeline */}
                <div className="pt-2 border-t">
                  <span className="text-xs text-muted-foreground">ציר זמן</span>
                  <div className="mt-2 space-y-2">
                    {['draft', 'pending', 'sent'].map((step, i) => {
                      const steps = ['draft', 'pending', 'sent'];
                      const stepLabels: Record<string, string> = { draft: 'טיוטה', pending: 'ממתין', sent: 'נשלח' };
                      const currentIdx = steps.indexOf(selected.status === 'failed' ? 'pending' : selected.status);
                      const done = i <= currentIdx;
                      return (
                        <div key={step} className="flex items-center gap-2 text-xs">
                          <div className={cn('w-2 h-2 rounded-full', done ? 'bg-primary' : 'bg-muted')} />
                          <span className={cn(done ? 'text-foreground' : 'text-muted-foreground')}>{stepLabels[step]}</span>
                          {selected.status === 'failed' && step === 'pending' && (
                            <span className="text-priority-urgent text-xs">← נכשל</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg border p-8 text-center shadow-card">
              <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">בחר פעולת אימייל כדי לצפות בפרטים</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
