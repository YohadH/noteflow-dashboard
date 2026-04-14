import { useEffect, useMemo, useState } from 'react';
import type { Note } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AlertEditorProps {
  notes: Note[];
  open: boolean;
  onClose: () => void;
  onSave: (payload: { noteId: string; reminderAt: string }) => Promise<void> | void;
}

function splitReminderDateTime(iso?: string) {
  if (!iso) {
    return { date: '', time: '' };
  }

  const date = new Date(iso);
  return {
    date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
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

function getFutureDateFloor() {
  const nextMinute = new Date(Date.now() + 60000);
  nextMinute.setSeconds(0, 0);
  return `${nextMinute.getFullYear()}-${String(nextMinute.getMonth() + 1).padStart(2, '0')}-${String(nextMinute.getDate()).padStart(2, '0')}`;
}

export function AlertEditor({ notes, open, onClose, onSave }: AlertEditorProps) {
  const selectableNotes = useMemo(
    () => [...notes].filter((note) => note.status !== 'archived').sort((first, second) => first.title.localeCompare(second.title)),
    [notes],
  );
  const [noteId, setNoteId] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const firstNote = selectableNotes[0];
    const reminder = splitReminderDateTime(firstNote?.reminderAt);
    setNoteId(firstNote?.id || '');
    setDateValue(reminder.date);
    setTimeValue(reminder.time);
    setError(null);
    setIsSaving(false);
  }, [open, selectableNotes]);

  const handleSave = async () => {
    if (!noteId) {
      setError('יש לבחור פתק קיים.');
      return;
    }

    if (!dateValue || !timeValue) {
      setError('יש לבחור גם תאריך וגם שעה להתראה.');
      return;
    }

    if (!isValid24HourTime(timeValue)) {
      setError('יש להזין שעה בפורמט 24 שעות, למשל 18:45.');
      return;
    }

    const reminderAt = combineReminderDateTime(dateValue, timeValue);
    if (!reminderAt) {
      setError('לא הצלחנו לבנות את זמן ההתראה.');
      return;
    }

    if (new Date(reminderAt).getTime() <= Date.now()) {
      setError('התראה חייבת להיות בזמן עתידי.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ noteId, reminderAt });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>הוסף התראה לפתק קיים</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>פתק</Label>
            <Select value={noteId} onValueChange={setNoteId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="בחר פתק" />
              </SelectTrigger>
              <SelectContent>
                {selectableNotes.map((note) => (
                  <SelectItem key={note.id} value={note.id}>
                    {note.title || 'פתק ללא כותרת'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[1fr_120px] gap-2">
            <div>
              <Label>תאריך</Label>
              <Input
                type="date"
                min={getFutureDateFloor()}
                className="mt-1.5"
                value={dateValue}
                onChange={(event) => setDateValue(event.target.value)}
              />
            </div>
            <div>
              <Label>שעה</Label>
              <Input
                type="text"
                dir="ltr"
                inputMode="numeric"
                maxLength={5}
                placeholder="14:30"
                className="mt-1.5"
                value={timeValue}
                onChange={(event) => setTimeValue(normalizeTimeInput(event.target.value))}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            התראה היא שכבה נפרדת על פתק קיים. היא לא יוצרת פתק חדש, אלא מוסיפה לפתק תזכורת/שליחה.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 border-t pt-3">
            <Button onClick={() => void handleSave()} disabled={isSaving || selectableNotes.length === 0}>
              שמור התראה
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
