import { Priority, NoteStatus, AlertStatus, EmailActionStatus } from '@/types';
import { cn } from '@/lib/utils';

export const priorityConfig: Record<Priority, { label: string; className: string; dotClass: string }> = {
  urgent: { label: 'Urgent', className: 'bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20', dotClass: 'bg-priority-urgent' },
  high: { label: 'High', className: 'bg-priority-high/10 text-priority-high border-priority-high/20', dotClass: 'bg-priority-high' },
  medium: { label: 'Medium', className: 'bg-priority-medium/10 text-priority-medium border-priority-medium/20', dotClass: 'bg-priority-medium' },
  low: { label: 'Low', className: 'bg-primary/10 text-primary border-primary/20', dotClass: 'bg-primary' },
};

export const statusConfig: Record<NoteStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-status-active/10 text-status-active' },
  completed: { label: 'Completed', className: 'bg-status-completed/10 text-status-completed' },
  archived: { label: 'Archived', className: 'bg-status-archived/10 text-status-archived' },
};

export const alertStatusConfig: Record<AlertStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-status-active/10 text-status-active' },
  scheduled: { label: 'Scheduled', className: 'bg-status-pending/10 text-status-pending' },
  sent: { label: 'Sent', className: 'bg-status-sent/10 text-status-sent' },
  failed: { label: 'Failed', className: 'bg-status-failed/10 text-status-failed' },
};

export const emailStatusConfig: Record<EmailActionStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  pending: { label: 'Pending', className: 'bg-status-pending/10 text-status-pending' },
  sent: { label: 'Sent', className: 'bg-status-sent/10 text-status-sent' },
  failed: { label: 'Failed', className: 'bg-status-failed/10 text-status-failed' },
};

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.round(diff / 86400000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0 && days < 7) return `In ${days} days`;
  if (days < 0 && days > -7) return `${Math.abs(days)} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
