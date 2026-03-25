import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Bell, Mail, Palette, Tag, Plug, CheckCircle2, XCircle } from 'lucide-react';
import { tags as defaultTags, categories as defaultCategories } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState(defaultCategories);
  const [tags, setTags] = useState(defaultTags);

  const handleSave = () => {
    toast({ title: 'ההגדרות נשמרו', description: 'ההעדפות עודכנו בהצלחה.' });
  };

  const handleAddCategory = () => {
    const name = prompt('שם קטגוריה חדשה:');
    if (name?.trim()) {
      setCategories((prev) => [...prev, { id: crypto.randomUUID(), name: name.trim(), color: '#6b7280' }]);
      toast({ title: 'קטגוריה נוספה', description: `"${name.trim()}" נוספה בהצלחה.` });
    }
  };

  const handleAddTag = () => {
    const name = prompt('שם תגית חדשה:');
    if (name?.trim()) {
      setTags((prev) => [...prev, { id: crypto.randomUUID(), name: name.trim(), color: '#6b7280' }]);
      toast({ title: 'תגית נוספה', description: `"${name.trim()}" נוספה בהצלחה.` });
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">הגדרות</h1>
        <p className="text-sm text-muted-foreground mt-1">ניהול העדפות ואינטגרציות</p>
      </div>

      {/* Notifications */}
      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2"><Bell className="h-4 w-4" /> העדפות התראות</h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">התראות באימייל</span>
            <Switch defaultChecked />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">התראות באפליקציה</span>
            <Switch defaultChecked />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">התראות Push לתזכורות</span>
            <Switch />
          </label>
        </div>
      </section>

      {/* Reminder defaults */}
      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2"><Bell className="h-4 w-4" /> ברירות מחדל לתזכורות</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>שעת תזכורת ברירת מחדל</Label>
            <Select defaultValue="09:00">
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="08:00">08:00</SelectItem>
                <SelectItem value="09:00">09:00</SelectItem>
                <SelectItem value="10:00">10:00</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>משך נודניק</Label>
            <Select defaultValue="1h">
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15m">15 דקות</SelectItem>
                <SelectItem value="30m">30 דקות</SelectItem>
                <SelectItem value="1h">שעה</SelectItem>
                <SelectItem value="1d">יום</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Tags & categories */}
      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2"><Tag className="h-4 w-4" /> קטגוריות ותגיות</h2>
        <div>
          <Label>קטגוריות</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {categories.map((c) => <Badge key={c.id} variant="secondary">{c.name}</Badge>)}
            <Button variant="outline" size="sm" className="h-6 text-xs" onClick={handleAddCategory}>+ הוסף</Button>
          </div>
        </div>
        <div>
          <Label>תגיות</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((t) => <Badge key={t.id} variant="outline">{t.name}</Badge>)}
            <Button variant="outline" size="sm" className="h-6 text-xs" onClick={handleAddTag}>+ הוסף</Button>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2"><Plug className="h-4 w-4" /> אינטגרציות</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <p className="text-sm font-medium">נקודת קצה API</p>
              <p className="text-xs text-muted-foreground">התחבר ל-API של הבקאנד</p>
            </div>
            <Input placeholder="https://api.example.com" className="w-64" />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <p className="text-sm font-medium">כתובת Webhook</p>
              <p className="text-xs text-muted-foreground">קבל התראות דרך webhook</p>
            </div>
            <Input placeholder="https://hooks.example.com" className="w-64" />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <p className="text-sm font-medium">חיבור n8n</p>
              <p className="text-xs text-muted-foreground">מנוע אוטומציית תהליכים</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 text-status-failed" />
              לא מחובר
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <p className="text-sm font-medium">ספק אימייל</p>
              <p className="text-xs text-muted-foreground">SMTP / SendGrid / Resend</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 text-status-failed" />
              לא מוגדר
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-start">
        <Button onClick={handleSave}>שמור הגדרות</Button>
      </div>
    </div>
  );
}
