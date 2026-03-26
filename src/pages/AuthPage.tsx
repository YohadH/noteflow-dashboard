import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import { useNoteStore } from '@/stores/noteStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { StickyNote, LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, signup } = useUserStore();
  const { loadUserData } = useNoteStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const success = login(email, password);
      if (success) {
        const user = useUserStore.getState().currentUser!;
        loadUserData(user.id);
        navigate('/');
      } else {
        toast({ title: 'שגיאה', description: 'אימייל או סיסמה שגויים', variant: 'destructive' });
      }
    } else {
      if (!name.trim()) {
        toast({ title: 'שגיאה', description: 'נא להזין שם', variant: 'destructive' });
        return;
      }
      const success = signup(name, email, password);
      if (success) {
        const user = useUserStore.getState().currentUser!;
        loadUserData(user.id);
        navigate('/');
      } else {
        toast({ title: 'שגיאה', description: 'האימייל כבר קיים במערכת', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <StickyNote className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">NoteFlow</h1>
          <p className="text-muted-foreground">
            {isLogin ? 'התחבר לחשבונך' : 'צור חשבון חדש'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">שם מלא</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ישראל ישראלי"
                required={!isLogin}
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">אימייל</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">סיסמה</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={4}
              dir="ltr"
            />
          </div>
          <Button type="submit" className="w-full gap-2">
            {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {isLogin ? 'התחבר' : 'הרשם'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? 'אין לך חשבון?' : 'כבר יש לך חשבון?'}{' '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-medium hover:underline"
          >
            {isLogin ? 'הרשם כאן' : 'התחבר כאן'}
          </button>
        </p>
      </div>
    </div>
  );
}
