'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from './LanguageProvider';

// Browser notification permission state
// default = not asked yet, granted, denied, unsupported = no Notification API
type PermissionState = NotificationPermission | 'unsupported';

export default function NotificationButton({ className }: { className: string }) {
  const { t } = useLanguage();
  const [permission, setPermission] = useState<PermissionState>('default');

  // Read the current state on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of browser state
    setPermission('Notification' in window ? Notification.permission : 'unsupported');
  }, []);

  if (permission === 'unsupported') return null;

  const label =
    permission === 'granted'
      ? t.notifications.enabled
      : permission === 'denied'
        ? t.notifications.blocked
        : t.notifications.enable;

  const handleClick = async () => {
    if (permission !== 'default') return;
    // Shows the browser's "Allow notifications?" prompt
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={`${className} ${permission === 'default' ? 'animate-pulse' : ''}`}
    >
      {permission === 'denied' ? '🔕' : '🔔'}
    </button>
  );
}
