'use client';

import { useEffect, useState } from 'react';
import { getReminders, markReminded, type Task } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useLanguage } from './LanguageProvider';

// How often to ask the server for due reminders
const CHECK_EVERY_MS = 30_000; // 30 seconds

// Short beep generated with the Web Audio API (no audio file)
function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880; // High pitch
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Some browsers block audio until the user interacts with the page
  }
}

// Renders nothing unless there is a reminder to show.
// Runs in the background on every page (mounted in the app shell).
export default function ReminderWatcher() {
  const { t, lang } = useLanguage();
  // Reminders currently shown on screen
  const [toasts, setToasts] = useState<Task[]>([]);

  useEffect(() => {
    const check = async () => {
      try {
        const due = await getReminders();
        for (const task of due) {
          // 1) Browser notification (visible even from another tab)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`🔔 ${task.title}`, {
              body: task.due_at ? formatDateTime(task.due_at, lang) : '',
              tag: `task-${task.id}`, // Prevents duplicate notifications for the same task
            });
          }
          // 2) In-page toast
          setToasts((prev) => (prev.some((x) => x.id === task.id) ? prev : [...prev, task]));
          beep();
          // 3) Tell the server it was sent so it isn't sent again
          await markReminded(task.id);
        }
      } catch {
        // If the server is down, retry on the next tick without bothering the user
      }
    };

    check(); // Run once immediately
    // setInterval repeats the check every 30 seconds
    const timer = setInterval(check, CHECK_EVERY_MS);
    // Clean up the interval on unmount
    return () => clearInterval(timer);
  }, [lang]);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((x) => x.id !== id));

  if (toasts.length === 0) return null;

  return (
    // fixed keeps it in place while scrolling
    // end-4 pins it to the inline end (right in English, left in Arabic)
    <div className="fixed bottom-4 end-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((task) => (
        <div
          key={task.id}
          role="alert"
          className="rounded-2xl bg-white dark:bg-gray-900 shadow-lg border border-amber-300
                     dark:border-amber-700 p-4 animate-[slideIn_0.3s_ease-out]"
        >
          <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold">
            {t.notifications.reminderTitle}
          </p>
          <p className="font-bold mt-1">{task.title}</p>
          {task.due_at && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {t.notifications.dueAt}: {formatDateTime(task.due_at, lang)}
            </p>
          )}
          <button
            onClick={() => dismiss(task.id)}
            className="mt-3 w-full rounded-lg bg-amber-500 hover:bg-amber-600 text-white py-1.5 text-sm transition"
          >
            {t.notifications.dismiss}
          </button>
        </div>
      ))}
    </div>
  );
}
