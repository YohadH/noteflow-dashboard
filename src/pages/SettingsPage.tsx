import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Tag, Plug, CheckCircle2, XCircle, Users, UserPlus, Trash2, House, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNoteStore } from '@/stores/noteStore';
import { pushSubscriptionsApi } from '@/api';
import { getErrorMessage } from '@/api/errors';
import {
  getExistingPushSubscription,
  getPushSupportState,
  subscribeCurrentDeviceToPush,
  unsubscribeCurrentDeviceFromPush,
} from '@/lib/push';
import type { UserSettings } from '@/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function SettingsPage() {
  const { toast } = useToast();
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
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [pushSupported, setPushSupported] = useState(false);
  const [hasPushPublicKey, setHasPushPublicKey] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isCurrentDeviceSubscribed, setIsCurrentDeviceSubscribed] = useState(false);
  const [isPushBusy, setIsPushBusy] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentBoard = boards.find((board) => board.id === settings.activeBoardId);
  const selectedBoard = boards.find((board) => board.id === form.activeBoardId) || currentBoard;
  const canEditBoardWebhook = selectedBoard?.role === 'owner';
  const canManageCurrentBoard = currentBoard?.role === 'owner';
  const hasPendingBoardChange = Boolean(form.activeBoardId && form.activeBoardId !== settings.activeBoardId);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const refreshPushState = async () => {
    const support = getPushSupportState();
    setPushSupported(support.supported);
    setHasPushPublicKey(support.hasPublicKey);
    setPushPermission(support.permission);
    setIsStandalone(support.standalone);

    if (!support.supported || !support.hasPublicKey) {
      setIsCurrentDeviceSubscribed(false);
      return;
    }

    try {
      const subscription = await getExistingPushSubscription();
      setIsCurrentDeviceSubscribed(Boolean(subscription));
    } catch {
      setIsCurrentDeviceSubscribed(false);
    }
  };

  useEffect(() => {
    void refreshPushState();
  }, [settings.activeBoardId]);

  const handleBoardSelectionChange = (boardId: string) => {
    const board = boards.find((item) => item.id === boardId);

    setForm((current) => ({
      ...current,
      activeBoardId: boardId,
      webhookUrl: board?.webhookUrl || '',
      n8nConnected: board?.n8nConnected ?? false,
    }));
  };

  const handleSave = async () => {
    const apiEndpoint = form.apiEndpoint?.trim() || '';
    const webhookUrl = form.webhookUrl?.trim() || '';
    const emailProvider = form.emailProvider?.trim() || '';

    if (apiEndpoint && !isValidHttpUrl(apiEndpoint)) {
      toast({
        title: 'שגיאה',
        description: 'כתובת ה-API חייבת להיות URL מלא שמתחיל ב-http או ב-https.',
        variant: 'destructive',
      });
      return;
    }

    if (canEditBoardWebhook && webhookUrl && !isValidHttpUrl(webhookUrl)) {
      toast({
        title: 'שגיאה',
        description: 'כתובת ה-webhook חייבת להיות URL מלא שמתחיל ב-http או ב-https.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      await updateSettings({
        ...form,
        apiEndpoint,
        webhookUrl,
        emailProvider,
      });

      toast({
        title: 'ההגדרות נשמרו',
        description: 'ההעדפות וההגדרות עודכנו בהצלחה.',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: getErrorMessage(error, 'לא הצלחנו לשמור את ההגדרות. בדוק את החיבור והרשאות הלוח ונסה שוב.'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = async () => {
    const name = prompt('שם קטגוריה חדשה:');
    if (!name?.trim()) {
      return;
    }

    try {
      await addCategory(name.trim());
      toast({
        title: 'קטגוריה נוספה',
        description: `"${name.trim()}" נוספה בהצלחה.`,
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: getErrorMessage(error, 'לא הצלחנו להוסיף קטגוריה ללוח הפעיל.'),
        variant: 'destructive',
      });
    }
  };

  const handleAddTag = async () => {
    const name = prompt('שם תגית חדשה:');
    if (!name?.trim()) {
      return;
    }

    try {
      await addTag(name.trim());
      toast({
        title: 'תגית נוספה',
        description: `"${name.trim()}" נוספה בהצלחה.`,
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: getErrorMessage(error, 'לא הצלחנו להוסיף תגית ללוח הפעיל.'),
        variant: 'destructive',
      });
    }
  };

  const handleConnectUser = async () => {
    const normalizedEmail = connectEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      toast({
        title: 'שגיאה',
        description: 'הכנס כתובת אימייל תקינה כדי לחבר משתמש נוסף ללוח.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await connectBoardUser(normalizedEmail);
      setConnectEmail('');
      toast({
        title: 'החיבור נשמר',
        description: 'אם המשתמש כבר קיים הוא יחובר מיד. אחרת תישמר הזמנה ממתינה.',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: getErrorMessage(error, 'לא הצלחנו לחבר את המשתמש ללוח הזה.'),
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeBoardUser(userId);
      toast({ title: 'המשתמש הוסר מהלוח' });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: getErrorMessage(error, 'לא הצלחנו להסיר את המשתמש מהלוח.'),
        variant: 'destructive',
      });
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      await revokeBoardInvitation(invitationId);
      toast({ title: 'ההזמנה בוטלה' });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: getErrorMessage(error, 'לא הצלחנו לבטל את ההזמנה.'),
        variant: 'destructive',
      });
    }
  };

  const handleBoardChange = async (boardId: string) => {
    try {
      await switchBoard(boardId);
      toast({ title: 'הלוח הפעיל הוחלף' });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: getErrorMessage(error, 'לא הצלחנו להחליף את הלוח הפעיל.'),
        variant: 'destructive',
      });
    }
  };

  const handleEnablePush = async () => {
    setIsPushBusy(true);

    try {
      const subscription = await subscribeCurrentDeviceToPush();
      await pushSubscriptionsApi.save(subscription);

      const nextSettings = {
        ...form,
        pushRemindersEnabled: true,
      };

      setForm(nextSettings);
      await updateSettings(nextSettings);

      toast({
        title: 'התראות Push הופעלו',
        description: 'המכשיר הזה יקבל התראות כאשר פתק עם תזכורת יגיע לזמן שנקבע.',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: getErrorMessage(error, 'לא הצלחנו להפעיל התראות Push במכשיר הזה.'),
        variant: 'destructive',
      });
    } finally {
      setIsPushBusy(false);
      await refreshPushState();
    }
  };

  const handleDisablePush = async () => {
    setIsPushBusy(true);

    try {
      const endpoint = await unsubscribeCurrentDeviceFromPush();

      if (endpoint) {
        await pushSubscriptionsApi.remove(endpoint);
      }

      const nextSettings = {
        ...form,
        pushRemindersEnabled: false,
      };

      setForm(nextSettings);
      await updateSettings(nextSettings);

      toast({
        title: 'התראות Push בוטלו',
        description: 'המכשיר הזה לא יקבל יותר התראות Push.',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: getErrorMessage(error, 'לא הצלחנו לבטל את התראות ה-Push במכשיר הזה.'),
        variant: 'destructive',
      });
    } finally {
      setIsPushBusy(false);
      await refreshPushState();
    }
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
            <Select value={form.activeBoardId} onValueChange={handleBoardSelectionChange}>
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
            disabled={!form.activeBoardId || form.activeBoardId === settings.activeBoardId || isSaving}
          >
            החלף לוח
          </Button>
        </div>
        {selectedBoard && (
          <p className="text-sm text-muted-foreground">
            {selectedBoard.isPersonal ? 'לוח אישי' : 'לוח משותף'} · הרשאה: {selectedBoard.role === 'owner' ? 'בעלים' : 'חבר'}
          </p>
        )}
        {hasPendingBoardChange && currentBoard && selectedBoard && (
          <p className="text-xs text-muted-foreground">
            הנתונים שמופיעים למטה עדיין שייכים ל-"{currentBoard.name}". שמור הגדרות או לחץ "החלף לוח" כדי לעבוד עם
            "{selectedBoard.name}".
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
            disabled={!canManageCurrentBoard || hasPendingBoardChange || isSaving}
          />
          <Button
            onClick={() => void handleConnectUser()}
            className="gap-2"
            disabled={!canManageCurrentBoard || hasPendingBoardChange || isSaving}
          >
            <UserPlus className="h-4 w-4" />
            חבר משתמש
          </Button>
        </div>
        {!canManageCurrentBoard && currentBoard && (
          <p className="text-xs text-muted-foreground">רק בעל הלוח הפעיל יכול לחבר או להסיר משתמשים מהלוח.</p>
        )}
        {hasPendingBoardChange && currentBoard && selectedBoard && (
          <p className="text-xs text-muted-foreground">
            כדי לנהל משתמשים של "{selectedBoard.name}" צריך קודם להחליף ללוח הזה.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          שני אימיילים שונים יכולים לעבוד על אותו לוח ואותם פתקים. אם המשתמש עדיין לא קיים, תישמר הזמנה ממתינה.
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
                {!member.isCurrentUser && canManageCurrentBoard && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleRemoveMember(member.userId)}
                    disabled={hasPendingBoardChange || isSaving}
                  >
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
                {canManageCurrentBoard && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleRevokeInvitation(invite.id)}
                    disabled={hasPendingBoardChange || isSaving}
                  >
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
        <div className="border-t pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                התראות לטלפון / לדפדפן הזה
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                צריך לאשר הרשאת התראות במכשיר. באייפון מומלץ להוסיף את האתר למסך הבית לפני ההפעלה.
              </p>
            </div>
            {isCurrentDeviceSubscribed ? (
              <Button variant="outline" onClick={() => void handleDisablePush()} disabled={isPushBusy || isSaving} className="shrink-0 w-full sm:w-auto">
                נתק מהמכשיר הזה
              </Button>
            ) : (
              <Button
                onClick={() => void handleEnablePush()}
                disabled={isPushBusy || isSaving || !pushSupported || !hasPushPublicKey}
                className="shrink-0 w-full sm:w-auto"
              >
                הפעל במכשיר הזה
              </Button>
            )}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>תמיכה בדפדפן: {pushSupported ? 'כן' : 'לא'}</p>
            <p>מפתח Push ציבורי: {hasPushPublicKey ? 'מוגדר' : 'חסר'}</p>
            <p>הרשאת התראות: {pushPermission}</p>
            <p>סטטוס מכשיר נוכחי: {isCurrentDeviceSubscribed ? 'רשום להתראות' : 'לא רשום'}</p>
            <p>מצב אפליקציה מותקנת: {isStandalone ? 'מותקנת / standalone' : 'דפדפן רגיל'}</p>
          </div>
        </div>
      </section>

      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2">
          <Bell className="h-4 w-4" /> ברירות מחדל לתזכורות
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={() => void handleAddCategory()}
              disabled={hasPendingBoardChange || isSaving}
            >
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
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={() => void handleAddTag()}
              disabled={hasPendingBoardChange || isSaving}
            >
              + הוסף
            </Button>
          </div>
        </div>
        {hasPendingBoardChange && (
          <p className="text-xs text-muted-foreground">כדי לערוך קטגוריות ותגיות של לוח אחר צריך קודם להחליף ללוח הזה.</p>
        )}
      </section>

      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2">
          <Plug className="h-4 w-4" /> אינטגרציות
        </h2>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md gap-3">
            <div className="shrink-0">
              <p className="text-sm font-medium">נקודת קצה API</p>
              <p className="text-xs text-muted-foreground">התחבר ל-API של הבקאנד</p>
            </div>
            <Input
              placeholder="https://api.example.com"
              className="w-full sm:w-64"
              value={form.apiEndpoint || ''}
              onChange={(event) => setForm((current) => ({ ...current, apiEndpoint: event.target.value }))}
              disabled={isSaving}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md gap-3">
            <div className="shrink-0">
              <p className="text-sm font-medium">Webhook של הלוח הפעיל</p>
              <p className="text-xs text-muted-foreground">כל המשתמשים בלוח הזה ישלחו התראות לאותה כתובת webhook</p>
            </div>
            <Input
              placeholder="https://hooks.example.com"
              className="w-full sm:w-64"
              value={form.webhookUrl || ''}
              onChange={(event) => setForm((current) => ({ ...current, webhookUrl: event.target.value }))}
              disabled={!canEditBoardWebhook || isSaving}
            />
          </div>
          {!canEditBoardWebhook && selectedBoard && (
            <p className="text-xs text-muted-foreground px-3">רק בעל הלוח יכול לשנות את ה-webhook המשותף של הלוח.</p>
          )}
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <p className="text-sm font-medium">מצב webhook משותף</p>
              <p className="text-xs text-muted-foreground">אפשר להפנות ל-n8n או לכל endpoint שמקבל POST</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {form.webhookUrl?.trim() ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-status-completed" />
                  מוגדר
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-status-failed" />
                  לא מוגדר
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md gap-3">
            <div className="shrink-0">
              <p className="text-sm font-medium">ספק אימייל</p>
              <p className="text-xs text-muted-foreground">SMTP / SendGrid / Resend</p>
            </div>
            <Input
              placeholder="Resend"
              className="w-full sm:w-64"
              value={form.emailProvider || ''}
              onChange={(event) => setForm((current) => ({ ...current, emailProvider: event.target.value }))}
              disabled={isSaving}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-start">
        <Button onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? 'שומר...' : 'שמור הגדרות'}
        </Button>
      </div>
    </div>
  );
}
