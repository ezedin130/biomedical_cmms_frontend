import { SLA_HOURS, STAGES } from './constants.js';

const HOUR = 3600e3, MIN = 6e4;

export const timeAgo = (d) => {
  const m = Math.round((Date.now() - new Date(d)) / MIN);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
};

export const stamp = (d) =>
  new Date(d).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export const money = (n) => `${Number(n || 0).toLocaleString()} ETB`;
export const initials = (n = '') =>
  n.replace(/^(Dr\.|Sr\.)\s*/, '').split(' ').map((x) => x[0]).slice(0, 2).join('');

export const stageIndex = (wo) =>
  ['on_hold', 'vendor'].includes(wo.status) ? 3 : STAGES.indexOf(wo.status);

export const isBreached = (wo) =>
  ['reported', 'triaged'].includes(wo.status) &&
  Date.now() - new Date(wo.reportedAt) > SLA_HOURS[wo.priority] * HOUR;

export const dueIn = (wo) => {
  const ms = new Date(wo.reportedAt).getTime() + SLA_HOURS[wo.priority] * HOUR - Date.now();
  const m = Math.round(Math.abs(ms) / MIN);
  const s = m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  return ms < 0 ? `${s} overdue` : `${s} left`;
};
