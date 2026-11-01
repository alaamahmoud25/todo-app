'use client';

import { useState } from 'react';
import {
  ApiError, createTask, deleteTask, updateTask,
  type Category, type Priority, type Repeat, type Task, type TaskInput,
} from '@/lib/api';
import { quickDate, toCairoInputValue } from '@/lib/format';
import { useLanguage } from './LanguageProvider';

type Props = {
  task: Task | null;        // null means a new task, otherwise we are editing
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;       // Called after save or delete so the page can reload the list
};

// Reminder options: (minutes before, translation key)
const REMIND_OPTIONS = [
  { value: null, key: 'none' },
  { value: 0, key: 'm0' },
  { value: 5, key: 'm5' },
  { value: 15, key: 'm15' },
  { value: 30, key: 'm30' },
  { value: 60, key: 'm60' },
  { value: 1440, key: 'm1440' },
] as const;

// Shared input classes
const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
  'dark:bg-gray-800 dark:border-gray-700';
const labelCls = 'block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300';

export default function TaskForm({ task, categories, onClose, onSaved }: Props) {
  const { t } = useLanguage();
  const isEdit = task !== null;

  // ===== Form state =====
  // Start from the task's values when editing, defaults when creating
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [category, setCategory] = useState<number | null>(task?.category ?? null);
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium');
  // Due date in datetime-local format, Cairo time
  const [dueAt, setDueAt] = useState(task?.due_at ? toCairoInputValue(task.due_at) : '');
  const [remind, setRemind] = useState<number | null>(
    task ? task.remind_before_minutes : 30,
  );
  const [repeat, setRepeat] = useState<Repeat>(task?.repeat ?? 'none');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // React.FormEvent is the event type fired on form submit
  const handleSubmit = async (e: React.FormEvent) => {
    // preventDefault stops the browser's default full page reload
    e.preventDefault();

    // Basic validation before hitting the server
    if (!title.trim()) return setError(t.form.titleRequired);
    if (repeat !== 'none' && !dueAt) return setError(t.form.repeatNeedsDate);

    const data: TaskInput = {
      title: title.trim(),
      description,
      category,
      priority,
      due_at: dueAt || null,
      remind_before_minutes: remind,
      repeat,
    };

    setSaving(true);
    setError(null);
    try {
      if (isEdit) await updateTask(task.id, data);
      else await createTask(data);
      onSaved();
    } catch (err) {
      // Show field errors returned by Django
      if (err instanceof ApiError && err.data && typeof err.data === 'object') {
        setError(Object.values(err.data as Record<string, string[]>).flat().join(' — '));
      } else {
        setError(t.serverError);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    // confirm shows the browser's native confirmation dialog
    if (!confirm(t.form.confirmDelete)) return;
    try {
      await deleteTask(task.id);
      onSaved();
    } catch {
      setError(t.serverError);
    }
  };

  return (
    // Backdrop: clicking it closes the form
    <div
      className="fixed inset-0 z-40 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        // stopPropagation keeps clicks inside the form from closing it
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 w-full md:max-w-lg rounded-t-2xl md:rounded-2xl shadow-xl
                   p-5 space-y-4 max-h-[92vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold">{isEdit ? t.form.editTask : t.form.addTask}</h2>

        {/* Title */}
        <div>
          <label htmlFor="title" className={labelCls}>{t.form.title}</label>
          <input
            id="title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.form.titlePlaceholder}
            maxLength={200}
            className={inputCls}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className={labelCls}>{t.form.description}</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.form.descriptionPlaceholder}
            rows={2}
            className={inputCls}
          />
        </div>

        {/* Category and priority side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="category" className={labelCls}>{t.form.category}</label>
            <select
              id="category"
              value={category ?? ''}
              onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : null)}
              className={inputCls}
            >
              <option value="">{t.form.noCategory}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="priority" className={labelCls}>{t.form.priority}</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className={inputCls}
            >
              <option value="high">{t.priority.high}</option>
              <option value="medium">{t.priority.medium}</option>
              <option value="low">{t.priority.low}</option>
            </select>
          </div>
        </div>

        {/* Due date */}
        <div>
          <label htmlFor="dueAt" className={labelCls}>🕐 {t.form.dueAt}</label>
          {/* datetime-local gives a native date and time picker */}
          <input
            id="dueAt"
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className={inputCls}
          />
          {/* Quick picks */}
          <div className="flex flex-wrap gap-2 mt-2">
            {([
              ['inHour', t.form.quickInHour],
              ['tonight', t.form.quickTonight],
              ['tomorrow', t.form.quickTomorrow],
            ] as const).map(([kind, label]) => (
              <button
                key={kind}
                type="button" // type="button" so it doesn't submit the form
                onClick={() => setDueAt(quickDate(kind))}
                className="text-xs rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {label}
              </button>
            ))}
            {dueAt && (
              <button
                type="button"
                onClick={() => setDueAt('')}
                className="text-xs rounded-full px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                ✕ {t.form.clearDate}
              </button>
            )}
          </div>
        </div>

        {/* Reminder and repeat (only shown when there is a due date) */}
        {dueAt && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="remind" className={labelCls}>🔔 {t.form.remind}</label>
              <select
                id="remind"
                value={remind ?? ''}
                onChange={(e) => setRemind(e.target.value === '' ? null : Number(e.target.value))}
                className={inputCls}
              >
                {REMIND_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.value ?? ''}>
                    {t.remindOptions[opt.key]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="repeat" className={labelCls}>🔁 {t.form.repeat}</label>
              <select
                id="repeat"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as Repeat)}
                className={inputCls}
              >
                <option value="none">{t.repeat.none}</option>
                <option value="daily">{t.repeat.daily}</option>
                <option value="weekly">{t.repeat.weekly}</option>
              </select>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-lg p-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 font-semibold transition"
          >
            {saving ? t.form.saving : t.form.save}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t.form.cancel}
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              aria-label={t.form.delete}
              title={t.form.delete}
              className="rounded-lg px-3 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              🗑️
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
