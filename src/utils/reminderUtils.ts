/**
 * Utilities for Match Reminders and Date/Time Parsing
 */

export function parseMatchDateTime(matchDate: string, matchTime?: string): Date | null {
  try {
    if (!matchDate) return null;
    let year = 0;
    let month = 0;
    let day = 0;
    const now = new Date();
    const cleanDate = matchDate.trim().toLowerCase();

    if (cleanDate === 'today') {
      year = now.getFullYear();
      month = now.getMonth();
      day = now.getDate();
    } else if (cleanDate === 'tomorrow') {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      year = tomorrow.getFullYear();
      month = tomorrow.getMonth();
      day = tomorrow.getDate();
    } else {
      // Check for YYYY-MM-DD
      const ymdMatch = matchDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (ymdMatch) {
        year = parseInt(ymdMatch[1], 10);
        month = parseInt(ymdMatch[2], 10) - 1;
        day = parseInt(ymdMatch[3], 10);
      } else {
        const parsed = new Date(matchDate);
        if (!isNaN(parsed.getTime())) {
          year = parsed.getFullYear();
          month = parsed.getMonth();
          day = parsed.getDate();
        } else {
          year = now.getFullYear();
          month = now.getMonth();
          day = now.getDate();
        }
      }
    }

    let hours = 19;
    let minutes = 30;

    if (matchTime) {
      const cleanTime = matchTime.trim();
      // 12-hour format: "7:30 PM", "12:15 AM", "03:45 pm"
      const match12 = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
      if (match12) {
        let h = parseInt(match12[1], 10);
        const m = parseInt(match12[2], 10);
        const meridiem = match12[3]?.toLowerCase();
        if (meridiem === 'pm' && h < 12) h += 12;
        if (meridiem === 'am' && h === 12) h = 0;
        hours = h;
        minutes = m;
      } else {
        // 24-hour format: "19:30", "14:00"
        const match24 = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
        if (match24) {
          hours = parseInt(match24[1], 10);
          minutes = parseInt(match24[2], 10);
        }
      }
    }

    const d = new Date(year, month, day, hours, minutes, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function formatTimeUntilMatch(matchDate: string, matchTime?: string): string {
  const matchDateTime = parseMatchDateTime(matchDate, matchTime);
  if (!matchDateTime) return '';

  const now = new Date();
  const diffMs = matchDateTime.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (60 * 1000));

  if (diffMinutes < 0) {
    const minsAgo = Math.abs(diffMinutes);
    if (minsAgo < 60) return `Started ${minsAgo}m ago`;
    const hoursAgo = Math.floor(minsAgo / 60);
    return `Started ${hoursAgo}h ago`;
  }

  if (diffMinutes === 0) return 'Starts now';
  if (diffMinutes <= 15) return `Starts in ${diffMinutes}m (Soon!)`;
  if (diffMinutes < 60) return `Starts in ${diffMinutes}m`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMins = diffMinutes % 60;
  if (diffHours < 24) {
    return remainingMins > 0 ? `Starts in ${diffHours}h ${remainingMins}m` : `Starts in ${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
}
