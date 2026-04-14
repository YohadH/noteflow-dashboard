import { useEffect, useState } from 'react';
import type { Note, Priority } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Pin, Mail, AlertTriangle } from 'lucide-react';
import { useNoteStore } from '@/stores/noteStore';

interface NoteEditorProps {
  note?: Note | null;
  open: boolean;
  onClose: () => void;
  onSave: (note: Note) => Promise<void> | void;
  defaults?: Partial<Note>;
}

const defaultNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  content: '',
  priority: 'medium',
  status: 'active',
  tags: [],
  category: '',
  pinned: false,
  hasAlert: false,
  hasEmailAction: false,
};

function buildDraft(note?: Note | null, defaults?: Partial<Note>) {
  return (note
    ? { ...note }
    : {
        ...defaultNote,
        ...defaults,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }) as Note;
}

function toDateInputValue(iso?: string) {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 10);
}

function toDateTimeLocalValue(iso?: string) {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function getFutureDateTimeFloor() {
  const nextMinute = new Date(Date.now() + 60000);
  nextMinute.setSeconds(0, 0);
  return toDateTimeLocalValue(nextMinute.toISOString());
}

function toLocalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function splitReminderDateTime(iso?: string) {
  if (!iso) {
    return { date: '', time: '' };
  }

  const date = new Date(iso);
  return {
    date: toLocalDateValue(date),
    time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
  };
}

function normalizeTimeInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isValid24HourTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function combineReminderDateTime(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue || !isValid24HourTime(timeValue)) {
    return undefined;
  }

  const [year, month, day] = dateValue.split('-').map(Number);
  const [hours, minutes] = timeValue.split(':').map(Number);
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (Number.isNaN(localDate.getTime())) {
    return undefined;
  }

  return localDate.toISOString();
}

export function NoteEditor({ note, open, onClose, onSave, defaults }: NoteEditorProps) {
  const categories = useNoteStore((state) => state.categories);
  const allTags = useNoteStore((state) => state.tags);
  const isNew = !note;
  const [form, setForm] = useState<Note>(() => buildDraft(note, defaults));
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [minReminderAt, setMinReminderAt] = useState(() => getFutureDateTimeFloor());
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialDraft = buildDraft(note, defaults);
    const initialReminder = splitReminderDateTime(initialDraft.reminderAt);

    setMinReminderAt(getFutureDateTimeFloor());
    setReminderDate(initialReminder.date);
    setReminderTime(initialReminder.time);
    setForm(initialDraft);
    setDirty(false);
    setIsSaving(false);
    setValidationError(null);
  }, [open, note, defaults]);

  useEffect(() => {
    if (!open || form.category || !categories.length) {
      return;
    }

    setForm((current) => ({ ...current, category: categories[0].name }));
  }, [categories, form.category, open]);

  const update = <K extends keyof Note>(key: K, value: Note[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setValidationError(null);
  };

  const updateReminder = (nextDate: string, nextTime: string) => {
    setReminderDate(nextDate);
    setReminderTime(nextTime);
    update('reminderAt', combineReminderDateTime(nextDate, nextTime));
  };

  const toggleTag = (tagName: string) => {
    const nextTags = form.tags.includes(tagName)
      ? form.tags.filter((tag) => tag !== tagName)
      : [...form.tags, tagName];

    update('tags', nextTags);
  };

  const handleSave = async () => {
    if (reminderDate || reminderTime) {
      if (!reminderDate || !reminderTime) {
        setValidationError('יש לבחור גם תאריך וגם שעה לתזכורת.');
        return;
      }

      if (!isValid24HourTime(reminderTime)) {
        setValidationError('יש להזין שעה בפורמט 24 שעות, למשל 14:30.');
        return;
      }
    }

    const normalizedReminderAt = combineReminderDateTime(reminderDate, reminderTime);

    if (normalizedReminderAt && new Date(normalizedReminderAt).getTime() <= Date.now()) {
      setValidationError('שעת התזכורת חייבת להיות בעתיד.');
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        ...form,
        reminderAt: normalizedReminderAt,
        updatedAt: new Date().toISOString(),
      });
      onClose();
    } catch {
      // The parent already handles user-facing error feedback.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isNew ? 'פתק חדש' : 'עריכת פתק'}
            {dirty && (
              <span className="text-xs bg-status-pending/10 text-status-pending px-2 py-0.5 rounded-full">
                לא נשמר
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div>
            <Label>כותרת</Label>
            <Input
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder="כותרת הפתק..."
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>תוכן</Label>
            <Textarea
              value={form.content}
              onChange={(event) => update('content', event.target.value)}
              placeholder="כתוב את הפתק שלך..."
              rows={6}
              className="mt-1.5 font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>עדיפות</Label>
              <Select value={form.priority} onValueChange={(value) => update('priority', value as Priority)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">נמוך</SelectItem>
                  <SelectItem value="medium">בינוני</SelectItem>
                  <SelectItem value="high">גבוה</SelectItem>
                  <SelectItem value="urgent">דחוף</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>קטגוריה</Label>
              <Select value={form.category || undefined} onValueChange={(value) => update('category', value)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>תאריך יעד</Label>
              <Input
                type="date"
                value={toDateInputValue(form.dueDate)}
                onChange={(event) =>
                  update('dueDate', event.target.value ? new Date(event.target.value).toISOString() : undefined)
                }
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>תזכורת</Label>
              <div className="mt-1.5 grid grid-cols-[1fr_120px] gap-2">
                <Input
                  type="date"
                  value={reminderDate}
                  min={minReminderAt.slice(0, 10)}
                  onChange={(event) => updateReminder(event.target.value, reminderTime)}
                />
                <Input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="14:30"
                  maxLength={5}
                  value={reminderTime}
                  onChange={(event) => updateReminder(reminderDate, normalizeTimeInput(event.target.value))}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">השעה נשמרת בפורמט 24 שעות HH:MM ומאפשרת שעה עתידית בלבד.</p>
            </div>
          </div>

          {validationError && <p className="text-sm text-destructive">{validationError}</p>}

          <div>
            <Label>תגיות</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {allTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={form.tags.includes(tag.name) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag.name)}
                >
                  {tag.name}
                  {form.tags.includes(tag.name) && <X className="h-3 w-3 mr-1" />}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.pinned} onCheckedChange={(value) => update('pinned', value)} />
              <Pin className="h-4 w-4" /> נעוץ
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.hasAlert} onCheckedChange={(value) => update('hasAlert', value)} />
              <AlertTriangle className="h-4 w-4" /> התראה
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.hasEmailAction} onCheckedChange={(value) => update('hasEmailAction', value)} />
              <Mail className="h-4 w-4" /> פעולת אימייל
            </label>
          </div>

          <div className="flex justify-start gap-3 pt-2 border-t">
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              {isNew ? 'צור פתק' : 'שמור שינויים'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
