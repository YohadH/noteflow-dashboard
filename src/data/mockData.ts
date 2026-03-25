import { Note, Reminder, Alert, EmailAction, Tag, Category } from '@/types';

export const tags: Tag[] = [
  { id: '1', name: 'work', color: 'hsl(215, 60%, 50%)' },
  { id: '2', name: 'personal', color: 'hsl(280, 60%, 55%)' },
  { id: '3', name: 'urgent', color: 'hsl(0, 72%, 51%)' },
  { id: '4', name: 'ideas', color: 'hsl(45, 93%, 47%)' },
  { id: '5', name: 'follow-up', color: 'hsl(172, 66%, 40%)' },
  { id: '6', name: 'meeting', color: 'hsl(200, 60%, 50%)' },
];

export const categories: Category[] = [
  { id: '1', name: 'Projects' },
  { id: '2', name: 'Meetings' },
  { id: '3', name: 'Research' },
  { id: '4', name: 'Personal' },
  { id: '5', name: 'Operations' },
];

const now = new Date();
const d = (offset: number) => new Date(now.getTime() + offset * 86400000).toISOString();

export const notes: Note[] = [
  {
    id: '1', title: 'Q1 Revenue Analysis', content: 'Review quarterly revenue figures and prepare summary for stakeholders. Include YoY growth metrics and regional breakdown.',
    priority: 'high', status: 'active', tags: ['work'], category: 'Projects',
    createdAt: d(-5), updatedAt: d(-1), dueDate: d(2), reminderAt: d(1),
    pinned: true, hasAlert: true, hasEmailAction: true,
  },
  {
    id: '2', title: 'Team Standup Notes', content: 'Daily standup updates: blockers on API integration, design review scheduled for Thursday.',
    priority: 'medium', status: 'active', tags: ['work', 'meeting'], category: 'Meetings',
    createdAt: d(-1), updatedAt: d(0), pinned: false, hasAlert: false, hasEmailAction: false,
  },
  {
    id: '3', title: 'Product Launch Checklist', content: '- [ ] Final QA pass\n- [ ] Marketing assets ready\n- [ ] Support docs updated\n- [ ] Monitoring dashboards configured',
    priority: 'urgent', status: 'active', tags: ['work', 'urgent'], category: 'Projects',
    createdAt: d(-10), updatedAt: d(-1), dueDate: d(1), reminderAt: d(0),
    pinned: true, hasAlert: true, hasEmailAction: true,
  },
  {
    id: '4', title: 'Research: Competitor Pricing', content: 'Analyze competitor pricing strategies for enterprise tier. Compare feature sets and value propositions.',
    priority: 'medium', status: 'active', tags: ['work', 'ideas'], category: 'Research',
    createdAt: d(-3), updatedAt: d(-2), dueDate: d(5),
    pinned: false, hasAlert: false, hasEmailAction: false,
  },
  {
    id: '5', title: 'Vacation Planning', content: 'Look into flights to Lisbon for August. Check Airbnb options near Alfama district.',
    priority: 'low', status: 'active', tags: ['personal'], category: 'Personal',
    createdAt: d(-7), updatedAt: d(-7),
    pinned: false, hasAlert: false, hasEmailAction: false,
  },
  {
    id: '6', title: 'API Integration Review', content: 'Review n8n webhook integration patterns. Document authentication flow and error handling.',
    priority: 'high', status: 'active', tags: ['work', 'follow-up'], category: 'Projects',
    createdAt: d(-2), updatedAt: d(-1), dueDate: d(3), reminderAt: d(2),
    pinned: false, hasAlert: true, hasEmailAction: false,
  },
  {
    id: '7', title: 'Onboarding Flow Redesign', content: 'Completed the user onboarding redesign. New flow reduces time-to-value by 40%.',
    priority: 'medium', status: 'completed', tags: ['work'], category: 'Projects',
    createdAt: d(-15), updatedAt: d(-3),
    pinned: false, hasAlert: false, hasEmailAction: false,
  },
  {
    id: '8', title: 'Old Meeting Notes - Jan', content: 'Archived meeting notes from January planning sessions.',
    priority: 'low', status: 'archived', tags: ['work', 'meeting'], category: 'Meetings',
    createdAt: d(-60), updatedAt: d(-30),
    pinned: false, hasAlert: false, hasEmailAction: false,
  },
];

export const reminders: Reminder[] = [
  { id: '1', noteId: '3', noteTitle: 'Product Launch Checklist', reminderAt: d(0), priority: 'urgent', completed: false },
  { id: '2', noteId: '1', noteTitle: 'Q1 Revenue Analysis', reminderAt: d(1), priority: 'high', completed: false },
  { id: '3', noteId: '6', noteTitle: 'API Integration Review', reminderAt: d(2), priority: 'high', completed: false },
  { id: '4', noteId: '2', noteTitle: 'Team Standup Notes', reminderAt: d(-1), priority: 'medium', completed: true },
  { id: '5', noteId: '7', noteTitle: 'Onboarding Flow Redesign', reminderAt: d(-5), priority: 'medium', completed: true },
];

export const alerts: Alert[] = [
  { id: '1', noteId: '3', noteTitle: 'Product Launch Checklist', type: 'deadline', channel: 'email', scheduledAt: d(0), status: 'active', priority: 'urgent' },
  { id: '2', noteId: '1', noteTitle: 'Q1 Revenue Analysis', type: 'reminder', channel: 'in-app', scheduledAt: d(1), status: 'scheduled', priority: 'high' },
  { id: '3', noteId: '6', noteTitle: 'API Integration Review', type: 'follow-up', channel: 'webhook', scheduledAt: d(3), status: 'scheduled', priority: 'high' },
  { id: '4', noteId: '7', noteTitle: 'Onboarding Flow Redesign', type: 'completion', channel: 'email', scheduledAt: d(-3), status: 'sent', priority: 'medium' },
  { id: '5', noteId: '8', noteTitle: 'Old Meeting Notes', type: 'archive', channel: 'in-app', scheduledAt: d(-30), status: 'failed', priority: 'low' },
];

export const emailActions: EmailAction[] = [
  { id: '1', noteId: '3', noteTitle: 'Product Launch Checklist', recipient: 'team@company.com', subject: 'Launch Day Checklist - Final Review', bodyPreview: 'Hi team, please review the final checklist before launch...', status: 'pending', scheduledAt: d(0) },
  { id: '2', noteId: '1', noteTitle: 'Q1 Revenue Analysis', recipient: 'stakeholders@company.com', subject: 'Q1 Revenue Report Ready', bodyPreview: 'The Q1 revenue analysis is now complete. Key highlights...', status: 'draft' },
  { id: '3', noteId: '7', noteTitle: 'Onboarding Flow Redesign', recipient: 'product@company.com', subject: 'Onboarding Redesign Complete', bodyPreview: 'The new onboarding flow is live. Metrics show a 40% improvement...', status: 'sent', sentAt: d(-3) },
  { id: '4', noteId: '6', noteTitle: 'API Integration Review', recipient: 'engineering@company.com', subject: 'API Integration Documentation', bodyPreview: 'Please find attached the updated API integration docs...', status: 'failed', scheduledAt: d(-1) },
];
