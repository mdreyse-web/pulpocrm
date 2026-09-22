/**
 * Generate WhatsApp click-to-chat link
 * Cleans the phone number to only keep digits
 */
export function getWhatsAppLink(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  // Chile numbers: add +56 if missing and starts with 9
  let number = cleaned;
  if (cleaned.startsWith('9') && cleaned.length === 9) {
    number = '56' + cleaned;
  } else if (cleaned.startsWith('56') && cleaned.length === 11) {
    number = cleaned;
  } else if (cleaned.startsWith('+56')) {
    number = cleaned.slice(1);
  }
  return `https://wa.me/${number}`;
}

/**
 * Calculate days since last activity
 */
export function getDaysSinceLastActivity(activities: { completedDate: string | null; createdAt: string; scheduledDate: string }[]): number | null {
  if (!activities || activities.length === 0) return null;
  const now = new Date().getTime();
  const sorted = [...activities].sort((a, b) => {
    const dateA = a.completedDate ? new Date(a.completedDate).getTime() : new Date(a.scheduledDate).getTime();
    const dateB = b.completedDate ? new Date(b.completedDate).getTime() : new Date(b.scheduledDate).getTime();
    return dateB - dateA;
  });
  const last = sorted[0];
  const lastDate = last.completedDate ? new Date(last.completedDate) : new Date(last.scheduledDate);
  const diffMs = now - lastDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function getDaysSinceContactBadge(days: number | null): { text: string; color: string; bgColor: string } {
  if (days === null) return { text: 'Sin actividad', color: 'text-[#6B7280]', bgColor: 'bg-[#2A2D3A]' };
  if (days <= 7) return { text: `${days}d`, color: 'text-[#22C55E]', bgColor: 'bg-[#22C55E]/10' };
  if (days <= 30) return { text: `${days}d`, color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/10' };
  return { text: `${days}d`, color: 'text-[#EF4444]', bgColor: 'bg-[#EF4444]/10' };
}
