'use client';

import { useEffect, useState } from 'react';
// Recharts: chart library for React
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { getStats, type Stats } from '@/lib/api';
import { formatDay } from '@/lib/format';
import { useLanguage } from '@/components/LanguageProvider';

// Series colors come from CSS variables, so they switch with dark mode (see globals.css)
const COLOR_DONE = 'var(--chart-done)';
const COLOR_DUE = 'var(--chart-due)';
const PRIORITY_COLORS = { high: '#e34948', medium: '#eda100', low: '#1baf7a' };

// Tooltip style (the box shown when hovering a bar)
const tooltipStyle = {
  backgroundColor: 'var(--tooltip-bg)',
  border: '1px solid var(--tooltip-border)',
  borderRadius: 12,
  color: 'var(--tooltip-text)',
};

// Shared card wrapper for each chart
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5">
      <h2 className="font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function StatsPage() {
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getStats().then(setStats).catch(() => setError(true));
  }, []);

  if (error) return <p className="text-red-600 dark:text-red-400">{t.serverError}</p>;
  if (!stats) return <p className="text-gray-500">{t.loading}</p>;

  // Shape the data the way Recharts expects
  const dailyData = stats.last_7_days.map((d) => ({
    day: formatDay(d.date, lang),
    [t.stats.done]: d.done,
    [t.stats.due]: d.due,
  }));

  const categoryData = [
    ...stats.by_category.map((c) => ({ name: c.name, value: c.count, color: c.color })),
    ...(stats.uncategorized
      ? [{ name: t.stats.uncategorized, value: stats.uncategorized, color: '#9ca3af' }]
      : []),
  ];

  const priorityData = (['high', 'medium', 'low'] as const).map((p) => ({
    name: t.priority[p],
    value: stats.by_priority[p],
    color: PRIORITY_COLORS[p],
  }));

  // Math.max(1, ...) avoids dividing by zero when there are no tasks
  const maxPriority = Math.max(1, ...priorityData.map((p) => p.value));

  const isAr = lang === 'ar';
  const axisTick = { fill: 'currentColor', fontSize: 12 };

  return (
    <div className="space-y-4 pb-10">
      {/* Completion rate: a big number instead of a chart */}
      <Card title={t.stats.completionRate}>
        <div className="flex items-end gap-3">
          <p className="text-5xl font-bold text-green-600 dark:text-green-400">
            {stats.completion_rate}%
          </p>
          <p className="text-sm text-gray-500 pb-2">{t.stats.completionHint}</p>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${stats.completion_rate}%` }}
          />
        </div>
      </Card>

      {/* Last 7 days */}
      <Card title={t.stats.last7Days}>
        {/* dir="ltr" so the library lays out correctly; in Arabic the day order is flipped with reversed */}
        <div dir="ltr" className="text-gray-500 dark:text-gray-400">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dailyData} barGap={2}>
              <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.15} />
              <XAxis dataKey="day" tick={axisTick} reversed={isAr} axisLine={false} tickLine={false} />
              <YAxis
                allowDecimals={false}
                tick={axisTick}
                orientation={isAr ? 'right' : 'left'}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
              {/* Legend text uses the normal text color; the colored swatch identifies the series */}
              <Legend
                formatter={(value) => (
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{value}</span>
                )}
              />
              <Bar dataKey={t.stats.done} fill={COLOR_DONE} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey={t.stats.due} fill={COLOR_DUE} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* By category: donut */}
        <Card title={t.stats.byCategory}>
          {categoryData.length === 0 ? (
            <p className="text-gray-500 py-10 text-center">{t.stats.empty}</p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-40 h-40 shrink-0" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="60%"
                      outerRadius="100%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {/* Cell: each slice uses its category's color */}
                      {categoryData.map((c) => (
                        <Cell key={c.name} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend with counts */}
              <ul className="space-y-2 text-sm flex-1">
                {categoryData.map((c) => (
                  <li key={c.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="flex-1">{c.name}</span>
                    <span className="font-semibold">{c.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* By priority: horizontal bars in plain HTML (simpler, and they follow text direction) */}
        <Card title={t.stats.byPriority}>
          <ul className="space-y-4 pt-2">
            {priorityData.map((p) => (
              <li key={p.name} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0">{p.name}</span>
                <div className="flex-1 h-6 rounded-md bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-md transition-all"
                    // Width is relative to the largest value
                    style={{ width: `${(p.value / maxPriority) * 100}%`, backgroundColor: p.color }}
                  />
                </div>
                <span className="w-6 text-end font-semibold">{p.value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
