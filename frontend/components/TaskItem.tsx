'use client';

import type { Task } from '@/lib/api';
import { formatDateTime, formatRelative } from '@/lib/format';
import { useLanguage } from './LanguageProvider';

type Props = {
  task: Task;
  onToggle: (id: number) => void;
  onEdit: (task: Task) => void;
};

// Side border color by priority
const priorityBorder = {
  high: 'border-s-red-500',
  medium: 'border-s-amber-400',
  low: 'border-s-green-500',
};

export default function TaskItem({ task, onToggle, onEdit }: Props) {
  const { t, lang } = useLanguage();

  return (
    // border-s-4 draws the border on the inline start, so it flips with text direction
    <li
      className={`group bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 flex gap-3 items-start
                  border-s-4 ${priorityBorder[task.priority]} ${task.is_done ? 'opacity-60' : ''}`}
    >
      <input
        type="checkbox"
        checked={task.is_done}
        onChange={() => onToggle(task.id)}
        aria-label={task.title}
        className="mt-1.5 h-5 w-5 cursor-pointer accent-green-600 shrink-0"
      />

      {/* Clicking the task opens it for editing */}
      <button onClick={() => onEdit(task)} className="flex-1 min-w-0 text-start">
        <p className={`font-semibold ${task.is_done ? 'line-through text-gray-500' : ''}`}>
          {task.title}
        </p>

        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 whitespace-pre-line">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
          {task.category_detail && (
            <span
              className="px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: task.category_detail.color + '22',
                color: task.category_detail.color,
              }}
            >
              {task.category_detail.name}
            </span>
          )}

          <span className="text-gray-600 dark:text-gray-400">{t.priority[task.priority]}</span>

          {task.repeat !== 'none' && (
            <span className="text-gray-600 dark:text-gray-400">🔁 {t.repeat[task.repeat]}</span>
          )}

          {task.due_at ? (
            <span
              className={
                task.is_overdue
                  ? 'text-red-600 dark:text-red-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-400'
              }
            >
              🕐 {formatDateTime(task.due_at, lang)}
              {!task.is_done && ` (${formatRelative(task.due_at, lang)})`}
            </span>
          ) : (
            <span className="text-gray-400">{t.noDueDate}</span>
          )}

          {/* Reminder icon: only for upcoming tasks that have a reminder */}
          {task.remind_before_minutes !== null && task.due_at && !task.is_done && !task.is_overdue && (
            <span className="text-gray-500" title={t.form.remind}>🔔</span>
          )}

          {task.is_overdue && (
            <span className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">
              {t.overdueBadge}
            </span>
          )}
        </div>
      </button>

      {/* Edit icon: fully visible on hover */}
      <button
        onClick={() => onEdit(task)}
        aria-label={t.form.editTask}
        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 opacity-60 group-hover:opacity-100 transition px-1"
      >
        ✏️
      </button>
    </li>
  );
}
