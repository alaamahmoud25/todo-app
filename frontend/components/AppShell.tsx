'use client';

import { useAuth } from './AuthProvider';
import Header from './Header';
import ReminderWatcher from './ReminderWatcher';

// Layout around every page:
// Logged in: header + page + reminder watcher
// Logged out (login page): the page only
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {user && <Header />}
      <main>{children}</main>
      {user && <ReminderWatcher />}
    </div>
  );
}
