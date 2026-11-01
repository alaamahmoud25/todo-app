'use client';

import type { Summary } from '@/lib/api';
import { useLanguage } from './LanguageProvider';

export default function SummaryCards({ summary }: { summary: Summary }) {
  const { t } = useLanguage();

  const cards = [
    { label: t.summary.today, value: summary.today, color: 'text-blue-600 dark:text-blue-400' },
    { label: t.summary.overdue, value: summary.overdue, color: 'text-red-600 dark:text-red-400' },
    { label: t.summary.pending, value: summary.pending, color: 'text-amber-600 dark:text-amber-400' },
    { label: t.summary.doneToday, value: summary.done_today, color: 'text-green-600 dark:text-green-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 text-center">
          <p className={`text-3xl md:text-4xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
