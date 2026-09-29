export const CricTheme = {
  primaryDark: '#06251C',
  primary: '#0B3D2E',
  primaryMedium: '#0F5238',
  primaryLight: '#14764E',
  accent: '#00C853',
  accentDeep: '#00A94D',
  gold: '#FFB300',

  scaffold: '#F4F7F5',
  surface: '#FFFFFF',
  surfaceMuted: '#EFF3F0',
  divider: '#E4EAE6',

  textPrimary: '#13201B',
  textSecondary: '#5B6B63',
  textMuted: '#8A978F',

  liveRed: '#E53935',
  completedGreen: '#2E7D32',
  upcomingOrange: '#FF9100',

  boundaryGreen: '#00A550',
  sixPurple: '#7C4DFF',
  extraAmber: '#FF9100',
  wicketRed: '#E53935',

  ballChipColor: (ball: string): string => {
    switch (ball) {
      case 'W':
      case 'w':
        return '#E53935'; // red
      case '4':
        return '#00A550'; // boundary green
      case '6':
        return '#7C4DFF'; // six purple
      case 'WD':
      case 'wd':
      case 'NB':
      case 'nb':
      case 'B':
      case 'LB':
        return '#FF9100'; // amber
      case '0':
        return '#9E9E9E'; // dot ball grey
      default:
        return '#2E7D32'; // runs green
    }
  },

  statusColor: (status: string): string => {
    switch (status.toLowerCase()) {
      case 'live':
      case 'innings_break':
        return '#E53935';
      case 'completed':
        return '#2E7D32';
      default:
        return '#FF9100';
    }
  },

  commentaryFor: (ball = '', batsman = 'Batsman', bowler = 'Bowler'): string => {
    switch (ball) {
      case '4':
        return `FOUR! ${batsman} drives it beautifully through the covers off ${bowler}`;
      case '6':
        return `SIX! ${batsman} launches it into the stands off ${bowler}! Massive hit!`;
      case 'W':
        return `OUT! ${batsman} is dismissed by ${bowler}! Huge breakthrough!`;
      case 'WD':
        return `Wide ball bowled down the leg side by ${bowler}`;
      case 'NB':
        return `No ball overstepping the crease by ${bowler}`;
      case '0':
        return `Dot ball. Good tight line and length by ${bowler} to ${batsman}`;
      case '1':
        return `1 run taken. Crisp push into the gap by ${batsman} off ${bowler}`;
      default:
        return `${ball} runs. Good running between the wickets by ${batsman} off ${bowler}`;
    }
  }
};
