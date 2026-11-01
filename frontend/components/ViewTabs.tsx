'use client';

import type { View } from '@/lib/api';
import { useLanguage } from './LanguageProvider';

type Props = {
  value: View;
  onChange: (view: View) => void;
};

const VIEWS: View[] = ['all', 'today', 'overdue', 'upcoming', 'done'];

export default function ViewTabs({ value, onChange }: Props) {
  const { t } = useLanguage();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {VIEWS.map((view) => (
        <button
          key={view}
          onClick={() => onChange(view)}
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
            value === view
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          {t.views[view]}
        </button>
      ))}
    </div>
  );
}
