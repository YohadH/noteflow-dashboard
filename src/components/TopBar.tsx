import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, Bell, User, Menu, X, Zap, LayoutDashboard, StickyNote, AlertTriangle, Mail, Flag, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNoteStore } from '@/stores/noteStore';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mobileNav = [
  { label: 'לוח בקרה', path: '/', icon: LayoutDashboard },
  { label: 'פתקים', path: '/notes', icon: StickyNote },
  { label: 'תזכורות', path: '/reminders', icon: Bell },
  { label: 'התראות', path: '/alerts', icon: AlertTriangle },
  { label: 'פעולות אימייל', path: '/email-actions', icon: Mail },
  { label: 'תצוגת עדיפות', path: '/priorities', icon: Flag },
  { label: 'הגדרות', path: '/settings', icon: Settings },
];

interface TopBarProps {
  onNewNote: () => void;
}

export function TopBar({ onNewNote }: TopBarProps) {
  const { searchQuery, setSearchQuery } = useNoteStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <>
      <header className="h-14 border-b bg-card flex items-center gap-3 px-4 sticky top-0 z-30">
        <button className="md:hidden p-2 -mr-2 rounded-md hover:bg-muted" onClick={() => setMobileMenuOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש פתקים..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 bg-secondary/50 border-0 h-9"
            />
          </div>
        </div>

        <Button size="sm" onClick={onNewNote} className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">פתק חדש</span>
        </Button>

        <button className="relative p-2 rounded-md hover:bg-muted" onClick={() => navigate('/alerts')}>
          <Bell className="h-4.5 w-4.5 text-muted-foreground" />
          <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-priority-urgent rounded-full" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => toast({ title: 'פרופיל', description: 'ניהול פרופיל יהיה זמין בקרוב.' })}>פרופיל</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>הגדרות</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast({ title: 'התנתקת', description: 'התנתקת בהצלחה.' })}>התנתק</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-sidebar animate-slide-in">
            <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                  <Zap className="h-4 w-4 text-sidebar-primary-foreground" />
                </div>
                <span className="font-semibold text-sidebar-accent-foreground text-lg">NoteFlow</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-sidebar-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="py-3 px-2 space-y-0.5">
              {mobileNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                    location.pathname === item.path
                      ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
