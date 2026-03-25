import { Note, Reminder, Alert, EmailAction, Tag, Category } from '@/types';

export const tags: Tag[] = [
  { id: '1', name: 'עבודה', color: 'hsl(215, 60%, 50%)' },
  { id: '2', name: 'אישי', color: 'hsl(280, 60%, 55%)' },
  { id: '3', name: 'דחוף', color: 'hsl(0, 72%, 51%)' },
  { id: '4', name: 'רעיונות', color: 'hsl(45, 93%, 47%)' },
  { id: '5', name: 'מעקב', color: 'hsl(172, 66%, 40%)' },
  { id: '6', name: 'פגישה', color: 'hsl(200, 60%, 50%)' },
];

export const categories: Category[] = [
  { id: '1', name: 'פרויקטים' },
  { id: '2', name: 'פגישות' },
  { id: '3', name: 'מחקר' },
  { id: '4', name: 'אישי' },
  { id: '5', name: 'תפעול' },
];

const now = new Date();
const d = (offset: number) => new Date(now.getTime() + offset * 86400000).toISOString();

export const notes: Note[] = [
  {
    id: '1', title: 'ניתוח הכנסות רבעון 1', content: 'סקירת נתוני הכנסות רבעוניים והכנת סיכום לבעלי עניין. כולל מדדי צמיחה שנתיים ופילוח אזורי.',
    priority: 'high', status: 'active', tags: ['עבודה'], category: 'פרויקטים',
    createdAt: d(-5), updatedAt: d(-1), dueDate: d(2), reminderAt: d(1),
    pinned: true, hasAlert: true, hasEmailAction: true,
  },
  {
    id: '2', title: 'סיכום סטנדאפ יומי', content: 'עדכוני סטנדאפ יומיים: חסימות באינטגרציית API, סקירת עיצוב מתוזמנת ליום חמישי.',
    priority: 'medium', status: 'active', tags: ['עבודה', 'פגישה'], category: 'פגישות',
    createdAt: d(-1), updatedAt: d(0), pinned: false, hasAlert: false, hasEmailAction: false,
  },
  {
    id: '3', title: 'רשימת בדיקות להשקת מוצר', content: '- [ ] סבב QA אחרון\n- [ ] חומרי שיווק מוכנים\n- [ ] תיעוד תמיכה מעודכן\n- [ ] לוחות ניטור מוגדרים',
    priority: 'urgent', status: 'active', tags: ['עבודה', 'דחוף'], category: 'פרויקטים',
    createdAt: d(-10), updatedAt: d(-1), dueDate: d(1), reminderAt: d(0),
    pinned: true, hasAlert: true, hasEmailAction: true,
  },
  {
    id: '4', title: 'מחקר: תמחור מתחרים', content: 'ניתוח אסטרטגיות תמחור של מתחרים לרמת Enterprise. השוואת סלי תכונות והצעות ערך.',
    priority: 'medium', status: 'active', tags: ['עבודה', 'רעיונות'], category: 'מחקר',
    createdAt: d(-3), updatedAt: d(-2), dueDate: d(5),
    pinned: false, hasAlert: false, hasEmailAction: false,
  },
  {
    id: '5', title: 'תכנון חופשה', content: 'לבדוק טיסות לליסבון באוגוסט. לבדוק אפשרויות Airbnb ליד רובע אלפמה.',
    priority: 'low', status: 'active', tags: ['אישי'], category: 'אישי',
    createdAt: d(-7), updatedAt: d(-7),
    pinned: false, hasAlert: false, hasEmailAction: false,
  },
  {
    id: '6', title: 'סקירת אינטגרציית API', content: 'סקירת דפוסי אינטגרציית webhook של n8n. תיעוד תהליך אימות וטיפול בשגיאות.',
    priority: 'high', status: 'active', tags: ['עבודה', 'מעקב'], category: 'פרויקטים',
    createdAt: d(-2), updatedAt: d(-1), dueDate: d(3), reminderAt: d(2),
    pinned: false, hasAlert: true, hasEmailAction: false,
  },
  {
    id: '7', title: 'עיצוב מחדש של תהליך קליטה', content: 'הושלם עיצוב מחדש של תהליך קליטת המשתמשים. התהליך החדש מצמצם את הזמן ל-40%.',
    priority: 'medium', status: 'completed', tags: ['עבודה'], category: 'פרויקטים',
    createdAt: d(-15), updatedAt: d(-3),
    pinned: false, hasAlert: false, hasEmailAction: false,
  },
  {
    id: '8', title: 'סיכומי פגישות ישנים - ינואר', content: 'סיכומי פגישות מינואר שהועברו לארכיון.',
    priority: 'low', status: 'archived', tags: ['עבודה', 'פגישה'], category: 'פגישות',
    createdAt: d(-60), updatedAt: d(-30),
    pinned: false, hasAlert: false, hasEmailAction: false,
  },
];

export const reminders: Reminder[] = [
  { id: '1', noteId: '3', noteTitle: 'רשימת בדיקות להשקת מוצר', reminderAt: d(0), priority: 'urgent', completed: false },
  { id: '2', noteId: '1', noteTitle: 'ניתוח הכנסות רבעון 1', reminderAt: d(1), priority: 'high', completed: false },
  { id: '3', noteId: '6', noteTitle: 'סקירת אינטגרציית API', reminderAt: d(2), priority: 'high', completed: false },
  { id: '4', noteId: '2', noteTitle: 'סיכום סטנדאפ יומי', reminderAt: d(-1), priority: 'medium', completed: true },
  { id: '5', noteId: '7', noteTitle: 'עיצוב מחדש של תהליך קליטה', reminderAt: d(-5), priority: 'medium', completed: true },
];

export const alerts: Alert[] = [
  { id: '1', noteId: '3', noteTitle: 'רשימת בדיקות להשקת מוצר', type: 'deadline', channel: 'email', scheduledAt: d(0), status: 'active', priority: 'urgent' },
  { id: '2', noteId: '1', noteTitle: 'ניתוח הכנסות רבעון 1', type: 'reminder', channel: 'in-app', scheduledAt: d(1), status: 'scheduled', priority: 'high' },
  { id: '3', noteId: '6', noteTitle: 'סקירת אינטגרציית API', type: 'follow-up', channel: 'webhook', scheduledAt: d(3), status: 'scheduled', priority: 'high' },
  { id: '4', noteId: '7', noteTitle: 'עיצוב מחדש של תהליך קליטה', type: 'completion', channel: 'email', scheduledAt: d(-3), status: 'sent', priority: 'medium' },
  { id: '5', noteId: '8', noteTitle: 'סיכומי פגישות ישנים', type: 'archive', channel: 'in-app', scheduledAt: d(-30), status: 'failed', priority: 'low' },
];

export const emailActions: EmailAction[] = [
  { id: '1', noteId: '3', noteTitle: 'רשימת בדיקות להשקת מוצר', recipient: 'team@company.com', subject: 'רשימת בדיקות יום ההשקה - סקירה סופית', bodyPreview: 'שלום צוות, אנא סקרו את רשימת הבדיקות הסופית לפני ההשקה...', status: 'pending', scheduledAt: d(0) },
  { id: '2', noteId: '1', noteTitle: 'ניתוח הכנסות רבעון 1', recipient: 'stakeholders@company.com', subject: 'דוח הכנסות רבעון 1 מוכן', bodyPreview: 'ניתוח הכנסות רבעון 1 הושלם. נקודות עיקריות...', status: 'draft' },
  { id: '3', noteId: '7', noteTitle: 'עיצוב מחדש של תהליך קליטה', recipient: 'product@company.com', subject: 'עיצוב מחדש של תהליך קליטה הושלם', bodyPreview: 'תהליך הקליטה החדש פעיל. המדדים מראים שיפור של 40%...', status: 'sent', sentAt: d(-3) },
  { id: '4', noteId: '6', noteTitle: 'סקירת אינטגרציית API', recipient: 'engineering@company.com', subject: 'תיעוד אינטגרציית API', bodyPreview: 'מצורף תיעוד אינטגרציית API מעודכן...', status: 'failed', scheduledAt: d(-1) },
];
