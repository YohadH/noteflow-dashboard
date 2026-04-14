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

export function NoteEditor({ note, open, onClose, onSave, defaults }: NoteEditorProps) {
  const categories = useNoteStore((state) => state.categories);
  const allTags = useNoteStore((state) => state.tags);
  const isNew = !note;
  const [form, setForm] = useState<Note>(() => buildDraft(note, defaults));
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [minReminderAt, setMinReminderAt] = useState(() => getFutureDateTimeFloor());

  useEffect(() => {
    if (!open) {
      return;
    }

    setMinReminderAt(getFutureDateTimeFloor());
    setForm(buildDraft(note, defaults));
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

  const toggleTag = (tagName: string) => {
    const nextTags = form.tags.includes(tagName)
      ? form.tags.filter((tag) => tag !== tagName)
      : [...form.tags, tagName];

    update('tags', nextTags);
  };

  const handleSave = async () => {
    if (form.reminderAt && new Date(form.reminderAt).getTime() <= Date.now()) {
      setValidationError('שעת התזכורת חייבת להיות בעתיד.');
      return;
    }

    setIsSaving(true);

    try {
      await onSave({ ...form, updatedAt: new Date().toISOString() });
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
              <Input
                type="datetime-local"
                value={toDateTimeLocalValue(form.reminderAt)}
                min={minReminderAt}
                onChange={(event) => update('reminderAt', fromDateTimeLocalValue(event.target.value))}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">בחר שעה עתידית בפורמט 24 שעות.</p>
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
