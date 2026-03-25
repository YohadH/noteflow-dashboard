import { useState } from 'react';
import { Note, Priority, NoteStatus } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { categories, tags as allTags } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { X, Pin, Bell, Mail, AlertTriangle } from 'lucide-react';

interface NoteEditorProps {
  note?: Note | null;
  open: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
  defaults?: Partial<Note>;
}

const defaultNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '', content: '', priority: 'medium', status: 'active',
  tags: [], category: 'Projects', pinned: false,
  hasAlert: false, hasEmailAction: false,
};

export function NoteEditor({ note, open, onClose, onSave, defaults }: NoteEditorProps) {
  const isNew = !note;
  const [form, setForm] = useState(() => note ? { ...note } : {
    ...defaultNote,
    ...defaults,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Note);
  const [dirty, setDirty] = useState(false);

  const update = <K extends keyof Note>(key: K, val: Note[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    setDirty(true);
  };

  const toggleTag = (tag: string) => {
    const tags = form.tags.includes(tag) ? form.tags.filter((t) => t !== tag) : [...form.tags, tag];
    update('tags', tags);
  };

  const handleSave = () => {
    onSave({ ...form, updatedAt: new Date().toISOString() });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isNew ? 'פתק חדש' : 'עריכת פתק'}
            {dirty && <span className="text-xs bg-status-pending/10 text-status-pending px-2 py-0.5 rounded-full">לא נשמר</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div>
            <Label>כותרת</Label>
            <Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="כותרת הפתק..." className="mt-1.5" />
          </div>

          <div>
            <Label>תוכן</Label>
            <Textarea value={form.content} onChange={(e) => update('content', e.target.value)} placeholder="כתוב את הפתק שלך..." rows={6} className="mt-1.5 font-mono text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>עדיפות</Label>
              <Select value={form.priority} onValueChange={(v) => update('priority', v as Priority)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
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
              <Select value={form.category} onValueChange={(v) => update('category', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>תאריך יעד</Label>
              <Input type="date" value={form.dueDate?.slice(0, 10) ?? ''} onChange={(e) => update('dueDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)} className="mt-1.5" />
            </div>
            <div>
              <Label>תזכורת</Label>
              <Input type="datetime-local" value={form.reminderAt?.slice(0, 16) ?? ''} onChange={(e) => update('reminderAt', e.target.value ? new Date(e.target.value).toISOString() : undefined)} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>תגיות</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {allTags.map((t) => (
                <Badge
                  key={t.id}
                  variant={form.tags.includes(t.name) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleTag(t.name)}
                >
                  {t.name}
                  {form.tags.includes(t.name) && <X className="h-3 w-3 mr-1" />}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.pinned} onCheckedChange={(v) => update('pinned', v)} />
              <Pin className="h-4 w-4" /> נעוץ
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.hasAlert} onCheckedChange={(v) => update('hasAlert', v)} />
              <AlertTriangle className="h-4 w-4" /> התראה
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.hasEmailAction} onCheckedChange={(v) => update('hasEmailAction', v)} />
              <Mail className="h-4 w-4" /> פעולת אימייל
            </label>
          </div>

          <div className="flex justify-start gap-3 pt-2 border-t">
            <Button onClick={handleSave}>
              {isNew ? 'צור פתק' : 'שמור שינויים'}
            </Button>
            <Button variant="outline" onClick={onClose}>ביטול</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
