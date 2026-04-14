import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Bell, CheckCircle2, House, Plug, Smartphone, Users, UserPlus, XCircle, Trash2 } from 'lucide-react';
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
import { TaxonomyManager } from '@/components/TaxonomyManager';
import type { Category, Tag, UserSettings } from '@/types';

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
    updateCategory,
    updateTag,
    deleteCategory,
    deleteTag,
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
        description: 'העדפות הלוח וההתראות עודכנו בהצלחה.',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: getErrorMessage(error, 'לא הצלחנו לשמור את ההגדרות.'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
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

  const handleConnectUser = async () => {
    const normalizedEmail = connectEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין כתובת אימייל תקינה.',
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
        description: 'המכשיר הזה נרשם לקבלת תזכורות מהלוח הפעיל.',
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
        description: 'המכשיר הזה לא יקבל יותר תזכורות Push.',
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

  const handleAddCategory = async (name: string, isShareable: boolean) => {
    await addCategory(name, isShareable);
    toast({
      title: 'קטגוריה נוספה',
      description: isShareable ? 'הקטגוריה תהיה זמינה לשיתוף בלוח.' : 'הקטגוריה נוספה כקטגוריה פרטית.',
    });
  };

  const handleUpdateCategoryShareable = async (category: Category, isShareable: boolean) => {
    await updateCategory(category.id, {
      name: category.name,
      isShareable,
    });
    toast({
      title: 'מצב השיתוף עודכן',
      description: isShareable ? 'הקטגוריה הזאת משתפת פתקים עם כל חברי הלוח.' : 'הקטגוריה הזאת נשארת פרטית.',
    });
  };

  const handleDeleteCategory = async (category: Category) => {
    await deleteCategory(category.id);
    toast({
      title: 'הקטגוריה נמחקה',
      description: `הקטגוריה "${category.name}" הוסרה וגם קישורי הפתקים אליה נוקו.`,
    });
  };

  const handleAddTag = async (name: string, isShareable: boolean) => {
    await addTag(name, undefined, isShareable);
    toast({
      title: 'תגית נוספה',
      description: isShareable ? 'התגית תהיה משותפת לכל חברי הלוח.' : 'התגית נוספה כתגית פרטית.',
    });
  };

  const handleUpdateTagShareable = async (tag: Tag, isShareable: boolean) => {
    await updateTag(tag.id, {
      name: tag.name,
      color: tag.color,
      isShareable,
    });
    toast({
      title: 'מצב השיתוף עודכן',
      description: isShareable ? 'כל פתק עם התגית הזאת יהפוך לגלוי לכל חברי הלוח.' : 'התגית הזאת חזרה למצב פרטי.',
    });
  };

  const handleDeleteTag = async (tag: Tag) => {
    await deleteTag(tag.id);
    toast({
      title: 'התגית נמחקה',
      description: `התגית "${tag.name}" הוסרה גם מהפתקים שקישרו אליה.`,
    });
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">הגדרות</h1>
        <p className="mt-1 text-sm text-muted-foreground">ניהול הלוח הפעיל, משתמשים מחוברים, שיתוף פתקים והתראות.</p>
      </div>

      <section className="space-y-4 rounded-lg border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 font-medium">
          <House className="h-4 w-4" />
          לוח פעיל
        </h2>
        <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]">
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
            כרגע הנתונים למטה עדיין מוצגים מתוך "{currentBoard.name}". שמור הגדרות או לחץ "החלף לוח" כדי לעבוד עם "{selectedBoard.name}".
          </p>
        )}
      </section>

      <section className="space-y-4 rounded-lg border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 font-medium">
          <Users className="h-4 w-4" />
          משתמשים מחוברים ללוח
        </h2>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
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
          <p className="text-xs text-muted-foreground">רק בעל הלוח הפעיל יכול לחבר או להסיר משתמשים.</p>
        )}
        {boardMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין חברים מחוברים ללוח הזה עדיין.</p>
        ) : (
          <div className="space-y-3">
            {boardMembers.map((member) => (
              <div key={member.userId} className="flex items-center justify-between gap-4 rounded-lg border p-3">
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
                      size="icon"
                      onClick={() => void handleRemoveMember(member.userId)}
                      disabled={hasPendingBoardChange || isSaving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {boardInvitations.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <Label>הזמנות ממתינות</Label>
            {boardInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{invitation.email}</p>
                  <p className="text-xs text-muted-foreground">ממתין להרשמה או לחיבור ללוח</p>
                </div>
                {canManageCurrentBoard && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void handleRevokeInvitation(invitation.id)}
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

      <section className="space-y-4 rounded-lg border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 font-medium">
          <Bell className="h-4 w-4" />
          העדפות התראות
        </h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between text-sm">
            <span>התראות באימייל</span>
            <Switch checked={form.emailAlertsEnabled} onCheckedChange={(value) => setForm((current) => ({ ...current, emailAlertsEnabled: value }))} />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>התראות באפליקציה</span>
            <Switch checked={form.inAppAlertsEnabled} onCheckedChange={(value) => setForm((current) => ({ ...current, inAppAlertsEnabled: value }))} />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>התראות Push לתזכורות</span>
            <Switch checked={form.pushRemindersEnabled} onCheckedChange={(value) => setForm((current) => ({ ...current, pushRemindersEnabled: value }))} />
          </label>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <Smartphone className="h-4 w-4" />
                התראות במכשיר הזה
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                באייפון כדאי לפתוח את האתר מה-Home Screen לפני הפעלה. אם השרת של process-alerts לא מעודכן עדיין, המכשיר יירשם אבל לא יקבל הודעות עד שהפונקציה תעבוד.
              </p>
            </div>
            {isCurrentDeviceSubscribed ? (
              <Button variant="outline" onClick={() => void handleDisablePush()} disabled={isPushBusy || isSaving}>
                נתק מהמכשיר הזה
              </Button>
            ) : (
              <Button onClick={() => void handleEnablePush()} disabled={isPushBusy || isSaving || !pushSupported || !hasPushPublicKey}>
                הפעל במכשיר הזה
              </Button>
            )}
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>תמיכה בדפדפן: {pushSupported ? 'כן' : 'לא'}</p>
            <p>מפתח Push ציבורי: {hasPushPublicKey ? 'מוגדר' : 'חסר'}</p>
            <p>הרשאת התראות: {pushPermission}</p>
            <p>סטטוס מכשיר נוכחי: {isCurrentDeviceSubscribed ? 'רשום להתראות' : 'לא רשום'}</p>
            <p>מצב אפליקציה מותקנת: {isStandalone ? 'standalone / מותקן' : 'דפדפן רגיל'}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 font-medium">
          <Bell className="h-4 w-4" />
          ברירות מחדל לתזכורות
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>שעת ברירת מחדל</Label>
            <Select value={form.defaultReminderTime} onValueChange={(value) => setForm((current) => ({ ...current, defaultReminderTime: value }))}>
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
            <Select value={form.defaultSnoozeInterval} onValueChange={(value) => setForm((current) => ({ ...current, defaultSnoozeInterval: value }))}>
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

      <section className="space-y-4 rounded-lg border bg-card p-6 shadow-card">
        <h2 className="font-medium">קטגוריות ותגיות</h2>
        <TaxonomyManager
          categories={categories}
          tags={tags}
          disabled={hasPendingBoardChange || isSaving}
          onAddCategory={handleAddCategory}
          onUpdateCategoryShareable={handleUpdateCategoryShareable}
          onDeleteCategory={handleDeleteCategory}
          onAddTag={handleAddTag}
          onUpdateTagShareable={handleUpdateTagShareable}
          onDeleteTag={handleDeleteTag}
        />
        {hasPendingBoardChange && <p className="text-xs text-muted-foreground">כדי לערוך את מבנה השיתוף של לוח אחר צריך קודם להחליף אליו.</p>}
      </section>

      <section className="space-y-4 overflow-hidden rounded-lg border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 font-medium">
          <Plug className="h-4 w-4" />
          אינטגרציות
        </h2>
        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-3 rounded-md border p-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium">נקודת קצה API</p>
              <p className="text-xs text-muted-foreground">חיבור ל-backend נוסף אם צריך.</p>
            </div>
            <Input
              placeholder="https://api.example.com"
              className="w-full sm:w-72"
              value={form.apiEndpoint || ''}
              onChange={(event) => setForm((current) => ({ ...current, apiEndpoint: event.target.value }))}
              disabled={isSaving}
            />
          </div>
          <div className="flex flex-col justify-between gap-3 rounded-md border p-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium">Webhook של הלוח הפעיל</p>
              <p className="text-xs text-muted-foreground">כל ההתראות המשותפות של הלוח יכולות להישלח לאותה כתובת POST.</p>
            </div>
            <Input
              placeholder="https://hooks.example.com"
              className="w-full sm:w-72"
              value={form.webhookUrl || ''}
              onChange={(event) => setForm((current) => ({ ...current, webhookUrl: event.target.value }))}
              disabled={!canEditBoardWebhook || isSaving}
            />
          </div>
          {!canEditBoardWebhook && selectedBoard && (
            <p className="px-1 text-xs text-muted-foreground">רק בעל הלוח יכול לשנות את כתובת ה-webhook המשותפת.</p>
          )}
          <div className="flex flex-col justify-between gap-3 rounded-md border p-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium">מצב webhook</p>
              <p className="text-xs text-muted-foreground">אפשר להפנות ל-n8n, ל-webhook.site או לשרת פרטי.</p>
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
          <div className="flex flex-col justify-between gap-3 rounded-md border p-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium">ספק אימייל</p>
              <p className="text-xs text-muted-foreground">SMTP / SendGrid / Resend</p>
            </div>
            <Input
              placeholder="Resend"
              className="w-full sm:w-72"
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
