import { Priority, NoteStatus, AlertStatus, EmailActionStatus } from '@/types';
import { cn } from '@/lib/utils';

export const priorityConfig: Record<Priority, { label: string; className: string; dotClass: string }> = {
  urgent: { label: 'דחוף', className: 'bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20', dotClass: 'bg-priority-urgent' },
  high: { label: 'גבוה', className: 'bg-priority-high/10 text-priority-high border-priority-high/20', dotClass: 'bg-priority-high' },
  medium: { label: 'בינוני', className: 'bg-priority-medium/10 text-priority-medium border-priority-medium/20', dotClass: 'bg-priority-medium' },
  low: { label: 'נמוך', className: 'bg-primary/10 text-primary border-primary/20', dotClass: 'bg-primary' },
};

export const statusConfig: Record<NoteStatus, { label: string; className: string }> = {
  active: { label: 'פעיל', className: 'bg-status-active/10 text-status-active' },
  completed: { label: 'הושלם', className: 'bg-status-completed/10 text-status-completed' },
  archived: { label: 'בארכיון', className: 'bg-status-archived/10 text-status-archived' },
};

export const alertStatusConfig: Record<AlertStatus, { label: string; className: string }> = {
  active: { label: 'פעיל', className: 'bg-status-active/10 text-status-active' },
  scheduled: { label: 'מתוזמן', className: 'bg-status-pending/10 text-status-pending' },
  sent: { label: 'נשלח', className: 'bg-status-sent/10 text-status-sent' },
  failed: { label: 'נכשל', className: 'bg-status-failed/10 text-status-failed' },
};

export const emailStatusConfig: Record<EmailActionStatus, { label: string; className: string }> = {
  draft: { label: 'טיוטה', className: 'bg-muted text-muted-foreground' },
  pending: { label: 'ממתין', className: 'bg-status-pending/10 text-status-pending' },
  sent: { label: 'נשלח', className: 'bg-status-sent/10 text-status-sent' },
  failed: { label: 'נכשל', className: 'bg-status-failed/10 text-status-failed' },
};

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.round(diff / 86400000);

  if (days === 0) return 'היום';
  if (days === 1) return 'מחר';
  if (days === -1) return 'אתמול';
  if (days > 0 && days < 7) return `בעוד ${days} ימים`;
  if (days < 0 && days > -7) return `לפני ${Math.abs(days)} ימים`;
  return d.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('he-IL', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
