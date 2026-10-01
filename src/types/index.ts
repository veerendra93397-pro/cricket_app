export type PlayerRole = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';

export interface PlayerModel {
  uid: string;
  playerName: string;
  email: string;
  age: number;
  jerseyNumber: number;
  role: PlayerRole;
  teamName: string;
  matches?: number;
  totalRuns?: number;
  totalBalls?: number;
  totalWickets?: number;
  oversBowled?: number;
  runsConceded?: number;
  highScore?: number;
  bestBowling?: string;
  avatarUrl?: string;
}

export interface Team {
  id: string;
  teamName: string;
  captain: string;
  playerCount?: number;
  logoUrl?: string;
}

export interface BatsmanData {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOnStrike?: boolean;
  howOut?: string;
}

export interface BowlerData {
  name: string;
  overs: string;
  runs: number;
  wickets: number;
  maidens: number;
}

export type MatchStatus = 'upcoming' | 'live' | 'innings_break' | 'completed';

export interface MatchModel {
  id: string;
  tournamentId?: string;
  team1: string; // Batting team during current innings or Team 1
  team2: string; // Bowling team during current innings or Team 2
  team1Score: string;
  team2Score: string;
  team1Overs: string;
  team2Overs?: string;
  team1Runs: number;
  team1Wickets: number;
  team2Runs?: number;
  team2Wickets?: number;
  status: MatchStatus;
  winner?: string;
  result?: string;
  venue: string;
  matchDate: string;
  matchTime: string;
  tossWinner?: string;
  tossDecision?: 'bat' | 'bowl';
  totalOvers: number;
  inningsNumber: 1 | 2;
  target?: number;
  firstInningsTeam?: string;
  firstInningsScore?: string;
  firstInningsOvers?: string;
  firstInningsBatsmen?: BatsmanData[];
  firstInningsBowlers?: BowlerData[];
  secondInningsTeam?: string;
  secondInningsScore?: string;
  secondInningsOvers?: string;
  secondInningsBatsmen?: BatsmanData[];
  secondInningsBowlers?: BowlerData[];
  currentBatsmen: BatsmanData[];
  currentBowler: BowlerData | null;
  bowlersHistory: BowlerData[];
  recentBalls: string[];
  playerOfTheMatch?: string;
  playerOfTheMatchDetails?: {
    name: string;
    team: string;
    performanceSummary?: string;
    citation?: string;
  };
}

export interface TeamStanding {
  played: number;
  won: number;
  lost: number;
  nrr: number;
  points: number;
}

export interface TournamentModel {
  id: string;
  name: string;
  teams: string[];
  totalMatches: number;
  completedMatches: number;
  oversPerMatch: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  stage?: string;
  pointsTable: Record<string, TeamStanding>;
  createdAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin?: boolean;
}
