// ============================================================
// BTG CRICKET — Unified Design System
// Single source of truth for color, type, spacing & shape.
// Exact port of lib/utils/cric_theme.dart
// ============================================================

export const CricTheme = {
  // BRAND COLORS
  primaryDark: '#06251C',
  primary: '#0B3D2E',
  primaryMedium: '#0F5238',
  primaryLight: '#14764E',
  accent: '#00C853', // pitch green
  accentDeep: '#00A94D',
  gold: '#FFB300',

  // Backward-compatible aliases
  headerStart: '#06251C',
  headerEnd: '#14764E',
  accentGreen: '#00C853',
  accentBlue: '#2979FF',
  accentOrange: '#FF9100',
  accentRed: '#E53935',
  accentPurple: '#7C4DFF',
  accentYellow: '#FFB300',

  // SURFACES
  scaffold: '#F4F7F5',
  surface: '#FFFFFF',
  surfaceMuted: '#EFF3F0',
  cardBg: '#FFFFFF',
  cardDark: '#10241C',
  divider: '#E4EAE6',
  background: '#06251C',

  // TEXT
  textDark: '#13201B',
  textPrimary: '#13201B',
  textSecondary: '#5B6B63',
  textMuted: '#8A978F',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: '#B9C9C0',
  textGreen: '#00A94D',
  textRed: '#D32F2F',

  // STATUS
  liveRed: '#E53935',
  completedGreen: '#2E7D32',
  upcomingOrange: '#FF9100',

  // SCORING
  boundaryGreen: '#00A550',
  sixPurple: '#7C4DFF',
  extraAmber: '#FF9100',
  wicketRed: '#E53935',
  strikeBg: '#E7F7EE',
  strikeBorder: '#00A94D',

  statusColor: (status: string) => {
    switch (status?.toLowerCase()) {
      case 'live':
        return '#E53935';
      case 'completed':
        return '#2E7D32';
      default:
        return '#FF9100';
    }
  },

  ballChipBg: (ball: string) => {
    const b = ball?.toUpperCase();
    if (b === '4') return '#00A550';
    if (b === '6') return '#7C4DFF';
    if (b === 'W') return '#E53935';
    if (b === 'WD' || b === 'NB' || b === 'B' || b === 'LB') return '#FF9100';
    if (b === '0') return '#6B7280';
    return '#10B981';
  },

  commentaryFor: (ball: string = '', batsman: string = 'Batsman', bowler: string = 'Bowler') => {
    switch (ball) {
      case '4':
        return `FOUR! ${batsman} drives it beautifully through the covers off ${bowler}`;
      case '6':
        return `SIX! ${batsman} launches it into the stands off ${bowler}!`;
      case 'W':
        return `OUT! ${batsman} is dismissed by ${bowler}`;
      case 'WD':
        return `Wide ball bowled by ${bowler}`;
      case 'NB':
        return `No ball by ${bowler}`;
      case '0':
        return `Dot ball. ${bowler} to ${batsman}`;
      case 'B':
        return `1 bye run taken. ${bowler} to ${batsman}`;
      case 'LB':
        return `1 leg-bye run taken. ${bowler} to ${batsman}`;
      default:
        return `${ball} run${ball === '1' ? '' : 's'}. ${bowler} to ${batsman}`;
    }
  },
};

export function parseOversToBalls(oversStr: string): number {
  if (!oversStr || oversStr === '0.0') return 0;
  const parts = oversStr.split('.');
  const overs = parseInt(parts[0], 10) || 0;
  const balls = parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;
  return overs * 6 + balls;
}

export function formatBallsToOvers(totalBalls: number): string {
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${overs}.${balls}`;
}

export function calculateRunRate(runs: number, oversStr: string): string {
  const totalBalls = parseOversToBalls(oversStr);
  if (totalBalls === 0) return '0.00';
  const oversDecimal = totalBalls / 6;
  return (runs / oversDecimal).toFixed(2);
}

export function calculateRequiredRate(runs: number, oversStr: string, target: number, totalOvers: number): string {
  const totalBalls = parseOversToBalls(oversStr);
  const remainingBalls = totalOvers * 6 - totalBalls;
  if (remainingBalls <= 0) return '0.00';
  const runsNeeded = target - runs;
  if (runsNeeded <= 0) return '0.00';
  const oversDecimal = remainingBalls / 6;
  return (runsNeeded / oversDecimal).toFixed(2);
}

export function calculateBowlerEconomy(runs: number, oversStr: string): string {
  const totalBalls = parseOversToBalls(oversStr);
  if (totalBalls === 0) return '0.00';
  const oversDecimal = totalBalls / 6;
  return (runs / oversDecimal).toFixed(2);
}
