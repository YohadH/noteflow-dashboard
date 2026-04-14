import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppLayout } from '@/components/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import NotesPage from '@/pages/NotesPage';
import RemindersPage from '@/pages/RemindersPage';
import AlertsPage from '@/pages/AlertsPage';
import EmailActionsPage from '@/pages/EmailActionsPage';
import PriorityViewPage from '@/pages/PriorityViewPage';
import SettingsPage from '@/pages/SettingsPage';
import CalendarPage from '@/pages/CalendarPage';
import AuthPage from '@/pages/AuthPage';
import NotFound from '@/pages/NotFound';
import { useUserStore } from '@/stores/userStore';

const queryClient = new QueryClient();

function AppRoutes() {
  const initialize = useUserStore((state) => state.initialize);
  const isInitialized = useUserStore((state) => state.isInitialized);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Loading NoteFlow...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/email-actions" element={<EmailActionsPage />} />
          <Route path="/priorities" element={<PriorityViewPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AppRoutes />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
