import { Activity } from '@/types';
import { getBranding } from '@/config/branding';

/**
 * Generate a Google Calendar event creation URL from an activity.
 * Uses the Google Calendar web URL format (no API key needed).
 */
export function generateGoogleCalendarLink(activity: Activity, accountName?: string, contactName?: string): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';

  // Parse scheduled date
  const startDate = new Date(activity.scheduledDate);
  if (isNaN(startDate.getTime())) {
    return '';
  }

  // Calculate end date based on duration
  const endDate = activity.duration
    ? new Date(startDate.getTime() + activity.duration * 60000)
    : new Date(startDate.getTime() + 60 * 60000); // default 1 hour

  // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
  const formatDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const dates = `${formatDate(startDate)}/${formatDate(endDate)}`;

  // Build title
  const title = activity.title;

  // Build description
  let details = activity.description || '';
  if (accountName) {
    details += `\n\nCuenta: ${accountName}`;
  }
  if (contactName) {
    details += `\nContacto: ${contactName}`;
  }
  details += `\n\n---\nCreado desde ${getBranding().name}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: dates,
    details: details.trim(),
  });

  // If it's a meeting or visit, we could add a generic location or leave it empty
  if (activity.type === 'visit' || activity.type === 'meeting') {
    // No specific location, user can add it in Google Calendar
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Format a date for display in the UI.
 */
export function formatReminderDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
