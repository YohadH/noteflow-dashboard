import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Tag, Plug, CheckCircle2, XCircle, Users, UserPlus, Trash2, House } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNoteStore } from '@/stores/noteStore';
import { useUserStore } from '@/stores/userStore';
import type { UserSettings } from '@/types';

export default function SettingsPage() {
  const { toast } = useToast();
  const currentUser = useUserStore((state) => state.currentUser);
  const {
    categories,
    tags,
    settings,
    boards,
    boardMembers,
    boardInvitations,
    addCategory,
    addTag,
    updateSettings,
    connectBoardUser,
    removeBoardUser,
    revokeBoardInvitation,
    switchBoard,
  } = useNoteStore();

  const [form, setForm] = useState<UserSettings>(settings);
  const [connectEmail, setConnectEmail] = useState('');
  const activeBoard = boards.find((board) => board.id === form.activeBoardId);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(form);
    toast({ title: 'ההגדרות נשמרו', description: 'ההעדפות עודכנו בהצלחה.' });
  };

  const handleAddCategory = async () => {
    const name = prompt('שם קטגוריה חדשה:');
    if (!name?.trim()) {
      return;
    }

    await addCategory(name.trim());
    toast({ title: 'קטגוריה נוספה', description: `"${name.trim()}" נוספה בהצלחה.` });
  };

  const handleAddTag = async () => {
    const name = prompt('שם תגית חדשה:');
    if (!name?.trim()) {
      return;
    }

    await addTag(name.trim());
    toast({ title: 'תגית נוספה', description: `"${name.trim()}" נוספה בהצלחה.` });
  };

  const handleConnectUser = async () => {
    if (!connectEmail.trim()) {
      return;
    }

    await connectBoardUser(connectEmail.trim());
    setConnectEmail('');
    toast({
      title: 'החיבור נשמר',
      description: 'אם המשתמש קיים הוא חובר מיד. אחרת נשמרה הזמנה ממתינה.',
    });
  };

  const handleRemoveMember = async (userId: string) => {
    await removeBoardUser(userId);
    toast({ title: 'המשתמש הוסר מהלוח' });
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    await revokeBoardInvitation(invitationId);
    toast({ title: 'ההזמנה בוטלה' });
  };

  const handleBoardChange = async (boardId: string) => {
    await switchBoard(boardId);
    toast({ title: 'הלוח הפעיל הוחלף' });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">הגדרות</h1>
        <p className="text-sm text-muted-foreground mt-1">ניהול העדפות, חיבורים ולוחות משותפים</p>
      </div>

      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2">
          <House className="h-4 w-4" /> לוח פעיל
        </h2>
        <div className="grid md:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <Label>בחר לוח</Label>
            <Select value={form.activeBoardId} onValueChange={(value) => setForm((current) => ({ ...current, activeBoardId: value }))}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="בחר לוח" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => form.activeBoardId && void handleBoardChange(form.activeBoardId)}
            disabled={!form.activeBoardId || form.activeBoardId === settings.activeBoardId}
          >
            החלף לוח
          </Button>
        </div>
        {activeBoard && (
          <p className="text-sm text-muted-foreground">
            {activeBoard.isPersonal ? 'לוח אישי' : 'לוח משותף'} · הרשאה: {activeBoard.role === 'owner' ? 'בעלים' : 'חבר'}
          </p>
        )}
      </section>

      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2">
          <Users className="h-4 w-4" /> משתמשים מחוברים לאותו לוח
        </h2>
        <div className="grid md:grid-cols-[1fr_auto] gap-3">
          <Input
            type="email"
            placeholder="family@example.com"
            value={connectEmail}
            onChange={(event) => setConnectEmail(event.target.value)}
          />
          <Button onClick={() => void handleConnectUser()} className="gap-2">
            <UserPlus className="h-4 w-4" />
            חבר משתמש
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          שני אימיילים שונים יכולים לעבוד על אותו לוח ואותם פתקים. אם המשתמש עדיין לא קיים, נשמרת הזמנה.
        </p>

        <div className="space-y-3">
          {boardMembers.map((member) => (
            <div key={member.userId} className="flex items-center justify-between gap-4 border rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">
                  {member.name}
                  {member.isCurrentUser ? ' (אתה)' : ''}
                </p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{member.role === 'owner' ? 'בעלים' : 'חבר'}</Badge>
                {!member.isCurrentUser && activeBoard?.role === 'owner' && (
                  <Button variant="ghost" size="sm" onClick={() => void handleRemoveMember(member.userId)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {boardMembers.length === 0 && <p className="text-sm text-muted-foreground">אין חברים מחוברים ללוח הזה.</p>}
        </div>

        {boardInvitations.length > 0 && (
          <div className="space-y-3 pt-2 border-t">
            <Label>הזמנות ממתינות</Label>
            {boardInvitations.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between gap-4 border rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">ממתין להרשמה או להתחברות ללוח</p>
                </div>
                {activeBoard?.role === 'owner' && (
                  <Button variant="ghost" size="sm" onClick={() => void handleRevokeInvitation(invite.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2">
          <Bell className="h-4 w-4" /> העדפות התראות
        </h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">התראות באימייל</span>
            <Switch
              checked={form.emailAlertsEnabled}
              onCheckedChange={(value) => setForm((current) => ({ ...current, emailAlertsEnabled: value }))}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">התראות באפליקציה</span>
            <Switch
              checked={form.inAppAlertsEnabled}
              onCheckedChange={(value) => setForm((current) => ({ ...current, inAppAlertsEnabled: value }))}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">התראות Push לתזכורות</span>
            <Switch
              checked={form.pushRemindersEnabled}
              onCheckedChange={(value) => setForm((current) => ({ ...current, pushRemindersEnabled: value }))}
            />
          </label>
        </div>
      </section>

      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2">
          <Bell className="h-4 w-4" /> ברירות מחדל לתזכורות
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>שעת תזכורת ברירת מחדל</Label>
            <Select
              value={form.defaultReminderTime}
              onValueChange={(value) => setForm((current) => ({ ...current, defaultReminderTime: value }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="08:00:00">08:00</SelectItem>
                <SelectItem value="09:00:00">09:00</SelectItem>
                <SelectItem value="10:00:00">10:00</SelectItem>
                <SelectItem value="12:00:00">12:00</SelectItem>
                <SelectItem value="18:00:00">18:00</SelectItem>
                <SelectItem value="20:00:00">20:00</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>משך נודניק</Label>
            <Select
              value={form.defaultSnoozeInterval}
              onValueChange={(value) => setForm((current) => ({ ...current, defaultSnoozeInterval: value }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
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

      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2">
          <Tag className="h-4 w-4" /> קטגוריות ותגיות של הלוח
        </h2>
        <div>
          <Label>קטגוריות</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {categories.map((category) => (
              <Badge key={category.id} variant="secondary">
                {category.name}
              </Badge>
            ))}
            <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => void handleAddCategory()}>
              + הוסף
            </Button>
          </div>
        </div>
        <div>
          <Label>תגיות</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge key={tag.id} variant="outline">
                {tag.name}
              </Badge>
            ))}
            <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => void handleAddTag()}>
              + הוסף
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2">
          <Plug className="h-4 w-4" /> אינטגרציות
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md gap-4">
            <div>
              <p className="text-sm font-medium">נקודת קצה API</p>
              <p className="text-xs text-muted-foreground">התחבר ל-API של הבקאנד</p>
            </div>
            <Input
              placeholder="https://api.example.com"
              className="w-64"
              value={form.apiEndpoint || ''}
              onChange={(event) => setForm((current) => ({ ...current, apiEndpoint: event.target.value }))}
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md gap-4">
            <div>
              <p className="text-sm font-medium">כתובת Webhook</p>
              <p className="text-xs text-muted-foreground">קבל התראות דרך webhook</p>
            </div>
            <Input
              placeholder="https://hooks.example.com"
              className="w-64"
              value={form.webhookUrl || ''}
              onChange={(event) => setForm((current) => ({ ...current, webhookUrl: event.target.value }))}
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <p className="text-sm font-medium">חיבור n8n</p>
              <p className="text-xs text-muted-foreground">מנוע אוטומציית תהליכים</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {form.n8nConnected ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-status-completed" />
                  מחובר
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-status-failed" />
                  לא מחובר
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md gap-4">
            <div>
              <p className="text-sm font-medium">ספק אימייל</p>
              <p className="text-xs text-muted-foreground">SMTP / SendGrid / Resend</p>
            </div>
            <Input
              placeholder="Resend"
              className="w-64"
              value={form.emailProvider || ''}
              onChange={(event) => setForm((current) => ({ ...current, emailProvider: event.target.value }))}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-start">
        <Button onClick={() => void handleSave()}>שמור הגדרות</Button>
      </div>
    </div>
  );
}
