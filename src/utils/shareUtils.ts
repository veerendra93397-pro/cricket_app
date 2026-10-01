import type { MatchModel } from '../types';

export function generateMatchShareData(match: MatchModel) {
  const isLive = match.status === 'live' || match.status === 'innings_break';
  const isCompleted = match.status === 'completed';

  let title = `🏏 ${match.team1} vs ${match.team2}`;
  if (match.tournamentName) {
    title += ` - ${match.tournamentName}`;
  }

  let text = `🏏 ${match.team1} vs ${match.team2}\n`;
  if (match.tournamentName) {
    text += `🏆 ${match.tournamentName}\n`;
  }

  if (isLive) {
    text += `🔴 LIVE NOW!\n`;
    text += `${match.team1}: ${match.team1Score || '0/0'} (${match.team1Overs || '0'} ov)\n`;
    if (match.team2Score) {
      text += `${match.team2}: ${match.team2Score} (${match.team2Overs || '0'} ov)\n`;
    }
    if (match.target) {
      text += `Target: ${match.target}\n`;
    }
  } else if (isCompleted) {
    text += `✅ Final Result: ${match.result || 'Match Completed'}\n`;
    text += `${match.team1}: ${match.team1Score || '0/0'}\n`;
    text += `${match.team2}: ${match.team2Score || '0/0'}\n`;
  } else {
    text += `📅 Match Date: ${match.matchDate} at ${match.matchTime || 'TBD'}\n`;
    text += `📍 Venue: ${match.venue || 'Stadium'}\n`;
  }

  text += `\nTrack live ball-by-ball score and commentary on BTG Cricket!`;

  const url = typeof window !== 'undefined' ? window.location.href : '';

  return { title, text, url };
}

export async function shareMatch(match: MatchModel): Promise<'native' | 'copied' | 'modal'> {
  const { title, text, url } = generateMatchShareData(match);

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return 'native';
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        // User cancelled or unsupported, fallback
        return 'modal';
      }
      return 'native';
    }
  }

  return 'modal';
}
