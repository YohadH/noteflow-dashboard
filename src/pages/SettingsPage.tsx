import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Bell, Mail, Palette, Tag, Plug, CheckCircle2, XCircle } from 'lucide-react';
import { tags, categories } from '@/data/mockData';

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your preferences and integrations</p>
      </div>

      {/* Notifications */}
      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2"><Bell className="h-4 w-4" /> Notification Preferences</h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">Email notifications</span>
            <Switch defaultChecked />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">In-app notifications</span>
            <Switch defaultChecked />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">Reminder push notifications</span>
            <Switch />
          </label>
        </div>
      </section>

      {/* Reminder defaults */}
      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2"><Bell className="h-4 w-4" /> Reminder Defaults</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Default reminder time</Label>
            <Select defaultValue="09:00">
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="08:00">8:00 AM</SelectItem>
                <SelectItem value="09:00">9:00 AM</SelectItem>
                <SelectItem value="10:00">10:00 AM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Snooze duration</Label>
            <Select defaultValue="1h">
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15m">15 minutes</SelectItem>
                <SelectItem value="30m">30 minutes</SelectItem>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="1d">1 day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Tags & categories */}
      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2"><Tag className="h-4 w-4" /> Categories & Tags</h2>
        <div>
          <Label>Categories</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {categories.map((c) => <Badge key={c.id} variant="secondary">{c.name}</Badge>)}
            <Button variant="outline" size="sm" className="h-6 text-xs">+ Add</Button>
          </div>
        </div>
        <div>
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((t) => <Badge key={t.id} variant="outline">{t.name}</Badge>)}
            <Button variant="outline" size="sm" className="h-6 text-xs">+ Add</Button>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="bg-card rounded-lg border p-6 shadow-card space-y-4">
        <h2 className="font-medium flex items-center gap-2"><Plug className="h-4 w-4" /> Integrations</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <p className="text-sm font-medium">API Endpoint</p>
              <p className="text-xs text-muted-foreground">Connect to your backend API</p>
            </div>
            <Input placeholder="https://api.example.com" className="w-64" />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <p className="text-sm font-medium">Webhook URL</p>
              <p className="text-xs text-muted-foreground">Receive notifications via webhook</p>
            </div>
            <Input placeholder="https://hooks.example.com" className="w-64" />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <p className="text-sm font-medium">n8n Connection</p>
              <p className="text-xs text-muted-foreground">Automation workflow engine</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 text-status-failed" />
              Not connected
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <p className="text-sm font-medium">Email Provider</p>
              <p className="text-xs text-muted-foreground">SMTP / SendGrid / Resend</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 text-status-failed" />
              Not configured
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button>Save Settings</Button>
      </div>
    </div>
  );
}
