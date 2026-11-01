// Utilities for browser notifications, background tab detection, and session completion sound alerts

export interface SessionNotificationPayload {
  username?: string;
  minutes: number;
  bixEarned: number;
  characterName?: string;
  force?: boolean;
}

/**
 * Check if the Notifications API is supported by the user's browser.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current Notification permission state.
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission from the user.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Check if the user does NOT have the app active/open in foreground.
 * Evaluates document visibilityState (hidden) or whether the document has focus.
 */
export function isAppNotOpen(): boolean {
  if (typeof document === 'undefined') return true;
  // If the document is hidden (tab switched, browser minimized, phone screen off)
  // or the window does not have focus (user interacting with another app or window)
  return document.visibilityState === 'hidden' || !document.hasFocus();
}

/**
 * Register Service Worker for reliable background push / notification display
 */
export function registerNotificationServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // SW registered successfully
        })
        .catch(() => {
          // Service worker registration skipped or not supported in sandbox
        });
    });
  }
}

/**
 * Plays a soothing multi-tone chime using the Web Audio API.
 * Synthesized completely client-side with zero external assets needed.
 */
export function playCompletionChime() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Pleasant chord notes: C5 (523.25 Hz), E5 (659.25 Hz), G5 (783.99 Hz), C6 (1046.50 Hz)
    const tones = [
      { freq: 523.25, start: 0, duration: 0.8 },
      { freq: 659.25, start: 0.12, duration: 0.8 },
      { freq: 783.99, start: 0.24, duration: 1.0 },
      { freq: 1046.5, start: 0.36, duration: 1.4 },
    ];

    tones.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      // Smooth attack and exponential decay envelope
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (e) {
    // AudioContext may be blocked if no user interaction yet, silently handle
  }
}

/**
 * Trigger system notification when session is completed.
 * Specifically designed to alert the user if they are in another tab or application.
 */
export async function sendSessionDoneNotification(
  payload: SessionNotificationPayload
): Promise<boolean> {
  const { username, minutes, bixEarned, force = false } = payload;

  // Always play the completion chime
  playCompletionChime();

  const title = `Progress Club • Session Done! 🎯`;
  const nameGreeting = username ? `${username}, ` : '';
  const body = `Great focus, ${nameGreeting}your ${minutes}-minute session is complete! You earned +${bixEarned} Bix. Tap to view your streak.`;

  // If user doesn't have the app open OR force is true, show system notification
  const appInactive = isAppNotOpen();
  if (!appInactive && !force) {
    return false;
  }

  if (!isNotificationSupported()) {
    return false;
  }

  // If permission is not granted, we cannot show native notification
  if (Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions & { renotify?: boolean } = {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'progress-club-session-complete',
    renotify: true,
    requireInteraction: true,
  };

  // Try Service Worker showNotification first (best for background tabs & mobile)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, notificationOptions);
        return true;
      }
    } catch (swErr) {
      // Fall through to standard Notification
    }
  }

  // Fallback to standard Notification API
  try {
    const notification = new Notification(title, notificationOptions);
    notification.onclick = () => {
      try {
        window.focus();
        notification.close();
      } catch (e) {}
    };
    return true;
  } catch (e) {
    console.warn('Could not display system notification:', e);
    return false;
  }
}

/**
 * Plays an upbeat alert chime when a scheduled focus timer reaches its start time.
 */
export function playScheduledAlertChime() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Ascending melody: G4 (392Hz), C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz)
    const notes = [
      { freq: 392.0, start: 0, duration: 0.18 },
      { freq: 523.25, start: 0.14, duration: 0.18 },
      { freq: 659.25, start: 0.28, duration: 0.22 },
      { freq: 783.99, start: 0.44, duration: 0.6 },
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.linearRampToValueAtTime(0.22, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (e) {
    // Silently ignore if audio context is blocked
  }
}

/**
 * Trigger system notification when a scheduled timer starts or is ready to begin.
 */
export async function sendScheduledTimerNotification(params: {
  username?: string;
  durationMinutes: number;
  label?: string;
  autoStarted: boolean;
}): Promise<boolean> {
  const { username, durationMinutes, label, autoStarted } = params;

  // Always play alert chime
  playScheduledAlertChime();

  const title = autoStarted ? `⏰ Scheduled Session Started!` : `🔔 Scheduled Session Ready!`;
  const labelText = label ? ` ("${label}")` : '';
  const greeting = username ? `${username}, ` : '';
  const body = autoStarted
    ? `${greeting}your ${durationMinutes}-minute focus session${labelText} has just started. Let's do this!`
    : `${greeting}it's time for your ${durationMinutes}-minute focus session${labelText}! Tap to start.`;

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions & { renotify?: boolean } = {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'progress-club-scheduled-session',
    renotify: true,
    requireInteraction: true,
  };

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, notificationOptions);
        return true;
      }
    } catch (swErr) {
      // Fall through to standard notification
    }
  }

  try {
    const notification = new Notification(title, notificationOptions);
    notification.onclick = () => {
      try {
        window.focus();
        notification.close();
      } catch (e) {}
    };
    return true;
  } catch (e) {
    return false;
  }
}

