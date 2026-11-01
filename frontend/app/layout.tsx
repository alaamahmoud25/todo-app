import type { Metadata } from 'next';
// Cairo font bundled as a package (works offline)
import '@fontsource-variable/cairo';
import './globals.css';
import { LanguageProvider } from '@/components/LanguageProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/components/AuthProvider';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'مهامي | My Tasks',
  description: 'تنظيم المهام اليومية مع تذكيرات',
};

// Runs before the page paints and applies the saved theme and direction,
// which avoids a white flash or a direction flip after load
const bootScript = `
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
    var l = localStorage.getItem('lang');
    if (l === 'en') { document.documentElement.lang = 'en'; document.documentElement.dir = 'ltr'; }
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body
        className="min-h-screen antialiased font-sans bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100"
        suppressHydrationWarning
      >
        {/* Order matters: AuthProvider uses the dictionary, so it must sit inside LanguageProvider */}
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <AppShell>{children}</AppShell>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
