import * as tz from 'date-fns-tz';

// Convert IST datetime-local string (from input) to UTC ISO string for DB
export function istLocalStringToUtcIso(localStr: string): string | null {
  if (!localStr) return null;
  // localStr: "2025-07-20T19:30"
  return new Date(localStr + ':00+05:30').toISOString();
}

// Convert UTC ISO string from DB to IST display string
export function utcIsoToIstDisplay(utcStr: string): string {
  if (!utcStr) return '-';
  const istDate = tz.toZonedTime(new Date(utcStr), 'Asia/Kolkata');
  return tz.format(istDate, 'dd/MM/yyyy, hh:mm a', { timeZone: 'Asia/Kolkata' });
}

// For datetime-local input, convert UTC ISO to IST-local string (for editing)
export function utcIsoToIstLocalInput(utcStr: string): string {
  if (!utcStr) return '';
  const istDate = tz.toZonedTime(new Date(utcStr), 'Asia/Kolkata');
  // Format as yyyy-MM-ddTHH:mm for datetime-local
  const yyyy = istDate.getFullYear();
  const mm = String(istDate.getMonth() + 1).padStart(2, '0');
  const dd = String(istDate.getDate()).padStart(2, '0');
  const hh = String(istDate.getHours()).padStart(2, '0');
  const min = String(istDate.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
} 