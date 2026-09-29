import type { MatchModel } from '../types';

export interface MatchShareInfo {
  title: string;
  text: string;
  summary: string;
  url: string;
}

export function getMatchShareUrl(matchId: string): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?matchId=${encodeURIComponent(matchId)}`;
  }
  return `https://btg-cricket.app/?matchId=${encodeURIComponent(matchId)}`;
}

export function getMatchShareContent(match: MatchModel): MatchShareInfo {
  const url = getMatchShareUrl(match.id);
  const team1 = match.team1;
  const team2 = match.team2;
  const venue = match.venue || 'Stadium';

  let title = '';
  let text = '';
  let summary = '';

  if (match.status === 'live' || match.status === 'innings_break') {
    title = `🔴 LIVE: ${team1} vs ${team2}`;
    const score1 = match.team1Score || '0/0';
    const overs1 = match.team1Overs ? ` (${match.team1Overs} ov)` : '';
    const score2 = match.team2Score ? ` | ${team2}: ${match.team2Score}` : '';
    const breakStatus = match.status === 'innings_break' ? ' [Innings Break]' : '';

    summary = `${team1}: ${score1}${overs1}${score2}${breakStatus}`;
    text = `🏏 LIVE CRICKET ALERT!\n${team1} vs ${team2}\n${summary}\nVenue: ${venue}\n\nFollow ball-by-ball live score and commentary:`;
  } else if (match.status === 'completed') {
    title = `🏆 Result: ${team1} vs ${team2}`;
    const resultText = match.result || (match.winner ? `${match.winner} won the match` : 'Match Completed');
    const score1 = match.team1Score ? `${team1}: ${match.team1Score}` : team1;
    const score2 = match.team2Score ? `${team2}: ${match.team2Score}` : team2;

    summary = `${resultText} (${score1} | ${score2})`;
    text = `🏆 MATCH RESULT!\n${team1} vs ${team2}\n${resultText}\nScores: ${score1} vs ${score2}\nVenue: ${venue}\n\nView complete match scorecard:`;
  } else {
    // Upcoming
    title = `🏏 Fixture: ${team1} vs ${team2}`;
    const dateStr = match.matchDate ? `${match.matchDate} at ${match.matchTime || '7:30 PM'}` : 'Upcoming';

    summary = `${team1} vs ${team2} • ${dateStr} • ${venue}`;
    text = `🏏 UPCOMING CRICKET FIXTURE!\n${team1} vs ${team2}\nDate: ${dateStr}\nVenue: ${venue}\n\nSet a match reminder & follow live:`;
  }

  return { title, text, summary, url };
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}
