'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getCategories, getSummary, getTasks, toggleTask,
  type Category, type Priority, type Summary, type Task, type View,
} from '@/lib/api';
import { useLanguage } from '@/components/LanguageProvider';
import SummaryCards from '@/components/SummaryCards';
import ViewTabs from '@/components/ViewTabs';
import TaskItem from '@/components/TaskItem';
import TaskForm from '@/components/TaskForm';

const selectCls =
  'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm';

export default function Home() {
  const { t } = useLanguage();

  // ===== Data =====
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null); // null = still loading
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState(false);

  // ===== Filters =====
  const [view, setView] = useState<View>('all');
  const [category, setCategory] = useState<number | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [search, setSearch] = useState('');

  // ===== Form =====
  // undefined = closed, null = new task, Task = editing that task
  const [editing, setEditing] = useState<Task | null | undefined>(undefined);

  const loadData = useCallback(async () => {
    try {
      const [tasksData, summaryData, categoriesData] = await Promise.all([
        getTasks({ view, category, priority, search }),
        getSummary(),
        getCategories(),
      ]);
      setTasks(tasksData);
      setSummary(summaryData);
      setCategories(categoriesData);
      setError(false);
    } catch {
      setError(true);
    }
  }, [view, category, priority, search]);

  // Load on mount and whenever a filter changes
  // Debounce search so we don't send a request on every keystroke
  useEffect(() => {
    const timer = setTimeout(loadData, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadData, search]);

  // Refresh every minute so relative times and overdue flags stay accurate
  useEffect(() => {
    const timer = setInterval(loadData, 60_000);
    return () => clearInterval(timer);
  }, [loadData]);

  const handleToggle = async (id: number) => {
    try {
      await toggleTask(id);
      await loadData();
    } catch {
      setError(true);
    }
  };

  return (
    <>
      {error && (
        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-xl p-3 mb-4">
          {t.serverError}
        </p>
      )}

      {summary && <SummaryCards summary={summary} />}

      {/* Tabs */}
      <div className="mb-3">
        <ViewTabs value={view} onChange={setView} />
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`🔍 ${t.search}`}
          className={`${selectCls} flex-1`}
        />
        <div className="flex gap-2">
          <select
            value={category ?? ''}
            onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : null)}
            className={`${selectCls} flex-1`}
          >
            <option value="">{t.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={priority ?? ''}
            onChange={(e) => setPriority((e.target.value as Priority) || null)}
            className={`${selectCls} flex-1`}
          >
            <option value="">{t.allPriorities}</option>
            <option value="high">{t.priority.high}</option>
            <option value="medium">{t.priority.medium}</option>
            <option value="low">{t.priority.low}</option>
          </select>
        </div>
      </div>

      {/* List */}
      {tasks === null && !error && <p className="text-gray-500">{t.loading}</p>}

      {tasks && tasks.length === 0 && (
        <p className="text-center text-gray-500 py-16">{t.noTasks}</p>
      )}

      {tasks && tasks.length > 0 && (
        <ul className="space-y-3 pb-24">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={handleToggle} onEdit={setEditing} />
          ))}
        </ul>
      )}

      {/* Floating add button */}
      <button
        onClick={() => setEditing(null)}
        aria-label={t.form.addTask}
        title={t.form.addTask}
        className="fixed bottom-6 start-6 z-30 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700
                   text-white text-3xl shadow-lg flex items-center justify-center transition hover:scale-105"
      >
        +
      </button>

      {/* Form: rendered only when editing is not undefined */}
      {editing !== undefined && (
        <TaskForm
          // key remounts the form with fresh values when another task is opened
          key={editing?.id ?? 'new'}
          task={editing}
          categories={categories}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            loadData();
          }}
        />
      )}
    </>
  );
}
