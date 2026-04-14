import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Flag,
  LayoutDashboard,
  Mail,
  Settings,
  StickyNote,
} from 'lucide-react';

export const primaryNavigationItems = [
  { label: 'לוח בקרה', path: '/', icon: LayoutDashboard },
  { label: 'פתקים', path: '/notes', icon: StickyNote },
  { label: 'לוח שנה', path: '/calendar', icon: CalendarDays },
  { label: 'תזכורות', path: '/reminders', icon: Bell },
  { label: 'התראות', path: '/alerts', icon: AlertTriangle },
  { label: 'פעולות אימייל', path: '/email-actions', icon: Mail },
  { label: 'תצוגת עדיפות', path: '/priorities', icon: Flag },
  { label: 'הגדרות', path: '/settings', icon: Settings },
] as const;
