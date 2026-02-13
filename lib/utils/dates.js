import { format, parseISO, differenceInDays, eachDayOfInterval, isWithinInterval } from 'date-fns';

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return format(parseISO(dateStr), 'MMM d, yyyy');
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return format(parseISO(dateStr), 'MMM d');
}

export function formatDateRange(startStr, endStr) {
  if (!startStr && !endStr) return '';
  if (!startStr) return formatDate(endStr);
  if (!endStr) return formatDate(startStr);
  const start = parseISO(startStr);
  const end = parseISO(endStr);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')}–${format(end, 'd, yyyy')}`;
  }
  return `${format(start, 'MMM d')}–${format(end, 'MMM d, yyyy')}`;
}

export function tripDuration(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  return differenceInDays(parseISO(endStr), parseISO(startStr));
}

export function daysInRange(startStr, endStr) {
  if (!startStr || !endStr) return [];
  return eachDayOfInterval({ start: parseISO(startStr), end: parseISO(endStr) });
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return minutes === '00' ? `${h12}${suffix}` : `${h12}:${minutes}${suffix}`;
}

export function isDateInRange(dateStr, startStr, endStr) {
  if (!dateStr || !startStr || !endStr) return false;
  return isWithinInterval(parseISO(dateStr), {
    start: parseISO(startStr),
    end: parseISO(endStr),
  });
}
