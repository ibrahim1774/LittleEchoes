import type { ParentProfile } from '@/types';
import { getTodaySession } from './storage';

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export async function checkAndFireReminder(parent: ParentProfile, childId: string): Promise<void> {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const { reminderTime, reminderDays } = parent.settings;
  if (!reminderTime || reminderDays.length === 0) return;

  const now = new Date();
  const todayDayName = DAY_NAMES[now.getDay()];
  if (!reminderDays.includes(todayDayName)) return;

  const [hh, mm] = reminderTime.split(':').map(Number);
  const reminderMinutes = hh * 60 + mm;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (nowMinutes < reminderMinutes) return;

  // Check if already recorded today
  const session = await getTodaySession(childId);
  if (session?.status === 'completed') return;

  // Throttle: only fire once per day (store last fired date)
  const lastFiredKey = `le_reminder_fired_${childId}`;
  const todayStr = now.toISOString().split('T')[0];
  if (localStorage.getItem(lastFiredKey) === todayStr) return;

  localStorage.setItem(lastFiredKey, todayStr);
  new Notification("Time for today's echo! 🎤", {
    body: "Tap to start recording today's questions.",
    icon: '/icons/icon-192.png',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}
