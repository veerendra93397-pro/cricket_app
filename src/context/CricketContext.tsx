import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  PlayerModel,
  Team,
  MatchModel,
  TournamentModel,
  UserProfile,
} from '../types';
import {
  parseOversToBalls,
  formatBallsToOvers,
} from '../utils/cricTheme';
import { parseMatchDateTime } from '../utils/reminderUtils';
import { authenticateUserCredentials } from '../utils/authAccounts';

interface CricketContextType {
  currentUser: UserProfile | null;
  isAdmin: boolean;
  playerProfile: PlayerModel | null;
  teams: Team[];
  players: PlayerModel[];
  matches: MatchModel[];
  tournaments: TournamentModel[];
  isLoading: boolean;
  activeScreen: string;
  screenParams: any;
  navigateTo: (screen: string, params?: any) => void;
  goBack: () => void;
  signIn: (email: string, password?: string) => Promise<boolean>;
  signUp: (email: string, name?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  loginAsDemo: (role: 'admin' | 'player') => void;
  savePlayerProfile: (profile: Partial<PlayerModel>) => Promise<void>;
  addTeam: (team: Omit<Team, 'id'>) => Promise<string>;
  addPlayer: (player: Omit<PlayerModel, 'uid'>) => Promise<string>;
  updatePlayer: (uid: string, data: Partial<PlayerModel>) => Promise<void>;
  addMatch: (match: Omit<MatchModel, 'id'>) => Promise<string>;
  updateMatch: (matchId: string, updates: Partial<MatchModel>) => Promise<void>;
  deleteMatch: (matchId: string) => Promise<void>;
  createTournament: (name: string, selectedTeams: string[], oversPerMatch: number) => Promise<string>;
  updateTournament: (tournamentId: string, updates: Partial<TournamentModel>) => Promise<void>;
  deleteTournament: (tournamentId: string) => Promise<void>;
  updateAdminProfile: (displayName: string, email?: string) => Promise<void>;
  startMatch: (
    matchId: string,
    setup: {
      tossWinner: string;
      tossDecision: 'bat' | 'bowl';
      battingTeam: string;
      bowlingTeam: string;
      totalOvers: number;
      selectedBatsmen: string[];
      selectedBowler: string;
    }
  ) => Promise<void>;
  addBall: (matchId: string, ballType: string) => Promise<{
    needNewBatsman?: boolean;
    overComplete?: boolean;
    inningsOver?: boolean;
    matchWon?: boolean;
    matchResult?: string;
  }>;
  undoLastBall: (matchId: string) => Promise<void>;
  setNewBatsman: (matchId: string, batsmanName: string) => Promise<void>;
  setNewBowler: (matchId: string, bowlerName: string) => Promise<void>;
  startSecondInnings: (
    matchId: string,
    openingBatsmen: string[],
    openingBowler: string
  ) => Promise<void>;
  completeMatch: (matchId: string, winner: string, result: string) => Promise<void>;
  undoStack: Record<string, any[]>;
  reminders: string[];
  toggleReminder: (matchId: string) => Promise<{ success: boolean; status: 'added' | 'removed' | 'denied' | 'unsupported'; message: string }>;
  isReminderSet: (matchId: string) => boolean;
  notificationPermission: NotificationPermission | 'unsupported';
  requestNotificationPermission: () => Promise<NotificationPermission | 'unsupported'>;
  triggerMatchNotification: (match: MatchModel, minutesAway?: number) => void;
  reminderToast: { id: string; title: string; body: string; matchId?: string } | null;
  dismissReminderToast: () => void;
}


const CricketContext = createContext<CricketContextType | undefined>(undefined);

// Initial mock data mirroring the BTG Cricket Firestore collections
const INITIAL_TEAMS: Team[] = [
  { id: 'team-1', teamName: 'BTG Warriors', captain: 'Rohit Sharma', playerCount: 11, logoUrl: '' },
  { id: 'team-2', teamName: 'Royal Challengers', captain: 'Virat Kohli', playerCount: 11, logoUrl: '' },
  { id: 'team-3', teamName: 'Super Kings', captain: 'MS Dhoni', playerCount: 11, logoUrl: '' },
  { id: 'team-4', teamName: 'Knight Riders', captain: 'Shreyas Iyer', playerCount: 10, logoUrl: '' },
];

const INITIAL_PLAYERS: PlayerModel[] = [
  { uid: 'p-1', playerName: 'Rohit Sharma', email: 'rohit@btg.com', age: 36, jerseyNumber: 45, role: 'Batsman', teamName: 'BTG Warriors', totalRuns: 420, totalBalls: 310, totalWickets: 2, oversBowled: 4, highScore: 104 },
  { uid: 'p-2', playerName: 'KL Rahul', email: 'kl@btg.com', age: 31, jerseyNumber: 1, role: 'Wicket-Keeper', teamName: 'BTG Warriors', totalRuns: 380, totalBalls: 290, totalWickets: 0, oversBowled: 0, highScore: 88 },
  { uid: 'p-3', playerName: 'Hardik Pandya', email: 'hardik@btg.com', age: 30, jerseyNumber: 33, role: 'All-Rounder', teamName: 'BTG Warriors', totalRuns: 280, totalBalls: 180, totalWickets: 12, oversBowled: 28, highScore: 62 },
  { uid: 'p-4', playerName: 'Jasprit Bumrah', email: 'bumrah@btg.com', age: 30, jerseyNumber: 93, role: 'Bowler', teamName: 'BTG Warriors', totalRuns: 34, totalBalls: 28, totalWickets: 18, oversBowled: 36, bestBowling: '4/14' },
  { uid: 'p-5', playerName: 'Suryakumar Yadav', email: 'sky@btg.com', age: 33, jerseyNumber: 63, role: 'Batsman', teamName: 'BTG Warriors', totalRuns: 450, totalBalls: 260, totalWickets: 0, oversBowled: 0, highScore: 112 },
  { uid: 'p-6', playerName: 'Virat Kohli', email: 'virat@btg.com', age: 35, jerseyNumber: 18, role: 'Batsman', teamName: 'Royal Challengers', totalRuns: 540, totalBalls: 380, totalWickets: 1, oversBowled: 2, highScore: 113 },
  { uid: 'p-7', playerName: 'Faf du Plessis', email: 'faf@btg.com', age: 39, jerseyNumber: 13, role: 'Batsman', teamName: 'Royal Challengers', totalRuns: 390, totalBalls: 275, totalWickets: 0, oversBowled: 0, highScore: 79 },
  { uid: 'p-8', playerName: 'Glenn Maxwell', email: 'maxwell@btg.com', age: 35, jerseyNumber: 32, role: 'All-Rounder', teamName: 'Royal Challengers', totalRuns: 310, totalBalls: 170, totalWickets: 9, oversBowled: 22, highScore: 95 },
  { uid: 'p-9', playerName: 'Mohammed Siraj', email: 'siraj@btg.com', age: 29, jerseyNumber: 73, role: 'Bowler', teamName: 'Royal Challengers', totalRuns: 20, totalBalls: 25, totalWickets: 14, oversBowled: 34, bestBowling: '4/21' },
  { uid: 'p-10', playerName: 'Dinesh Karthik', email: 'dk@btg.com', age: 38, jerseyNumber: 19, role: 'Wicket-Keeper', teamName: 'Royal Challengers', totalRuns: 230, totalBalls: 130, totalWickets: 0, oversBowled: 0, highScore: 53 },
  { uid: 'p-11', playerName: 'MS Dhoni', email: 'msd@btg.com', age: 42, jerseyNumber: 7, role: 'Wicket-Keeper', teamName: 'Super Kings', totalRuns: 340, totalBalls: 190, totalWickets: 0, oversBowled: 0, highScore: 84 },
  { uid: 'p-12', playerName: 'Ravindra Jadeja', email: 'jaddu@btg.com', age: 35, jerseyNumber: 8, role: 'All-Rounder', teamName: 'Super Kings', totalRuns: 260, totalBalls: 195, totalWickets: 15, oversBowled: 38, highScore: 62 },
  { uid: 'p-13', playerName: 'Ruturaj Gaikwad', email: 'rutu@btg.com', age: 27, jerseyNumber: 31, role: 'Batsman', teamName: 'Super Kings', totalRuns: 480, totalBalls: 350, totalWickets: 0, oversBowled: 0, highScore: 98 },
  { uid: 'p-14', playerName: 'Shreyas Iyer', email: 'iyer@btg.com', age: 29, jerseyNumber: 41, role: 'Batsman', teamName: 'Knight Riders', totalRuns: 410, totalBalls: 295, totalWickets: 0, oversBowled: 0, highScore: 85 },
  { uid: 'p-15', playerName: 'Andre Russell', email: 'dre@btg.com', age: 35, jerseyNumber: 12, role: 'All-Rounder', teamName: 'Knight Riders', totalRuns: 360, totalBalls: 180, totalWickets: 13, oversBowled: 26, highScore: 80 },
];

// Helper to generate dynamic upcoming fixture times so reminders can be tested in real-time
const getUpcomingFixtureTimes = () => {
  const now = new Date();
  const todayYMD = now.toISOString().slice(0, 10);
  
  // A match starting in 14 minutes (within the 15-minute window for testing!)
  const soon = new Date(now.getTime() + 14 * 60 * 1000);
  let h1 = soon.getHours();
  const m1 = soon.getMinutes().toString().padStart(2, '0');
  const ampm1 = h1 >= 12 ? 'PM' : 'AM';
  h1 = h1 % 12 || 12;
  const soonTimeStr = `${h1}:${m1} ${ampm1}`;

  // A match starting in 3 hours
  const later = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  let h2 = later.getHours();
  const m2 = later.getMinutes().toString().padStart(2, '0');
  const ampm2 = h2 >= 12 ? 'PM' : 'AM';
  h2 = h2 % 12 || 12;
  const laterTimeStr = `${h2}:${m2} ${ampm2}`;

  return { todayYMD, soonTimeStr, laterTimeStr };
};

const fixtureTimes = getUpcomingFixtureTimes();

const INITIAL_MATCHES: MatchModel[] = [
  {
    id: 'match-live-1',
    tournamentId: 'tourn-1',
    team1: 'BTG Warriors',
    team2: 'Royal Challengers',
    team1Score: '142/3',
    team2Score: '168/6',
    team1Overs: '15.4',
    team2Overs: '20.0',
    team1Runs: 142,
    team1Wickets: 3,
    team2Runs: 168,
    team2Wickets: 6,
    status: 'live',
    venue: 'Wankhede Stadium, Mumbai',
    matchDate: '2026-09-29',
    matchTime: '7:30 PM',
    tossWinner: 'BTG Warriors',
    tossDecision: 'bowl',
    totalOvers: 20,
    inningsNumber: 2,
    target: 169,
    firstInningsTeam: 'Royal Challengers',
    firstInningsScore: '168/6',
    firstInningsOvers: '20.0',
    firstInningsBatsmen: [
      { name: 'Virat Kohli', runs: 74, balls: 48, fours: 7, sixes: 2, howOut: 'c Rahul b Bumrah' },
      { name: 'Faf du Plessis', runs: 42, balls: 28, fours: 4, sixes: 1, howOut: 'b Hardik' },
      { name: 'Glenn Maxwell', runs: 28, balls: 16, fours: 2, sixes: 2, howOut: 'c SKY b Bumrah' },
      { name: 'Dinesh Karthik', runs: 16, balls: 10, fours: 2, sixes: 0, howOut: 'not out' },
    ],
    firstInningsBowlers: [
      { name: 'Jasprit Bumrah', overs: '4.0', maidens: 1, runs: 24, wickets: 3 },
      { name: 'Hardik Pandya', overs: '4.0', maidens: 0, runs: 38, wickets: 2 },
    ],
    currentBatsmen: [
      { name: 'Rohit Sharma', runs: 68, balls: 44, fours: 6, sixes: 3, isOnStrike: true },
      { name: 'Suryakumar Yadav', runs: 45, balls: 26, fours: 4, sixes: 2, isOnStrike: false },
    ],
    currentBowler: {
      name: 'Mohammed Siraj',
      overs: '3.4',
      maidens: 0,
      runs: 32,
      wickets: 1,
    },
    bowlersHistory: [
      { name: 'Mohammed Siraj', overs: '3.4', maidens: 0, runs: 32, wickets: 1 },
      { name: 'Glenn Maxwell', overs: '4.0', maidens: 0, runs: 36, wickets: 1 },
    ],
    recentBalls: ['1', '4', '0', '6', '1', '2', '0', '1', '4', '1'],
  },
  {
    id: 'match-upcoming-1',
    tournamentId: 'tourn-1',
    team1: 'Super Kings',
    team2: 'Knight Riders',
    team1Score: '0/0',
    team2Score: '0/0',
    team1Overs: '0.0',
    team1Runs: 0,
    team1Wickets: 0,
    status: 'upcoming',
    venue: 'MA Chidambaram Stadium, Chennai',
    matchDate: fixtureTimes.todayYMD,
    matchTime: fixtureTimes.soonTimeStr,
    totalOvers: 20,
    inningsNumber: 1,
    currentBatsmen: [],
    currentBowler: null,
    bowlersHistory: [],
    recentBalls: [],
  },
  {
    id: 'match-upcoming-2',
    tournamentId: 'tourn-1',
    team1: 'BTG Warriors',
    team2: 'Super Kings',
    team1Score: '0/0',
    team2Score: '0/0',
    team1Overs: '0.0',
    team1Runs: 0,
    team1Wickets: 0,
    status: 'upcoming',
    venue: 'Eden Gardens, Kolkata',
    matchDate: fixtureTimes.todayYMD,
    matchTime: fixtureTimes.laterTimeStr,
    totalOvers: 20,
    inningsNumber: 1,
    currentBatsmen: [],
    currentBowler: null,
    bowlersHistory: [],
    recentBalls: [],
  },
  {
    id: 'match-completed-1',
    tournamentId: 'tourn-1',
    team1: 'BTG Warriors',
    team2: 'Knight Riders',
    team1Score: '185/4',
    team2Score: '162/9',
    team1Overs: '20.0',
    team2Overs: '20.0',
    team1Runs: 185,
    team1Wickets: 4,
    team2Runs: 162,
    team2Wickets: 9,
    status: 'completed',
    winner: 'BTG Warriors',
    result: 'BTG Warriors won by 23 runs',
    venue: 'Wankhede Stadium, Mumbai',
    matchDate: '2026-09-24',
    matchTime: '7:30 PM',
    totalOvers: 20,
    inningsNumber: 2,
    firstInningsTeam: 'BTG Warriors',
    firstInningsScore: '185/4',
    firstInningsOvers: '20.0',
    firstInningsBatsmen: [
      { name: 'Rohit Sharma', runs: 82, balls: 48, fours: 8, sixes: 4 },
      { name: 'Suryakumar Yadav', runs: 58, balls: 32, fours: 5, sixes: 3 },
    ],
    firstInningsBowlers: [
      { name: 'Andre Russell', overs: '4.0', maidens: 0, runs: 39, wickets: 2 },
    ],
    secondInningsTeam: 'Knight Riders',
    secondInningsScore: '162/9',
    secondInningsOvers: '20.0',
    secondInningsBatsmen: [
      { name: 'Shreyas Iyer', runs: 64, balls: 45, fours: 6, sixes: 1 },
      { name: 'Andre Russell', runs: 35, balls: 18, fours: 3, sixes: 3 },
    ],
    secondInningsBowlers: [
      { name: 'Jasprit Bumrah', overs: '4.0', maidens: 1, runs: 18, wickets: 4 },
    ],
    currentBatsmen: [],
    currentBowler: null,
    bowlersHistory: [],
    recentBalls: [],
  },
];

const INITIAL_TOURNAMENTS: TournamentModel[] = [
  {
    id: 'tourn-1',
    name: 'BTG Premier Cup 2026',
    teams: ['BTG Warriors', 'Royal Challengers', 'Super Kings', 'Knight Riders'],
    totalMatches: 6,
    completedMatches: 1,
    oversPerMatch: 20,
    status: 'ongoing',
    stage: 'group',
    pointsTable: {
      'BTG Warriors': { played: 1, won: 1, lost: 0, nrr: 1.15, points: 2 },
      'Super Kings': { played: 0, won: 0, lost: 0, nrr: 0.0, points: 0 },
      'Royal Challengers': { played: 0, won: 0, lost: 0, nrr: 0.0, points: 0 },
      'Knight Riders': { played: 1, won: 0, lost: 1, nrr: -1.15, points: 0 },
    },
  },
];

export const CricketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('btg_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isAdmin && (!parsed.displayName || parsed.displayName === 'Rohit Sharma' || parsed.displayName === 'Admin Scorer')) {
          parsed.displayName = 'Tournament Admin';
        }
        return parsed;
      } catch {}
    }
    // Default to null so user or admin must sign in with credentials
    return null;
  });

  const [playerProfile, setPlayerProfile] = useState<PlayerModel | null>(() => {
    const saved = localStorage.getItem('btg_player_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('btg_teams');
    return saved ? JSON.parse(saved) : INITIAL_TEAMS;
  });

  const [players, setPlayers] = useState<PlayerModel[]>(() => {
    const saved = localStorage.getItem('btg_players');
    return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
  });

  const [matches, setMatches] = useState<MatchModel[]>(() => {
    const saved = localStorage.getItem('btg_matches');
    return saved ? JSON.parse(saved) : INITIAL_MATCHES;
  });

  const [tournaments, setTournaments] = useState<TournamentModel[]>(() => {
    const saved = localStorage.getItem('btg_tournaments');
    return saved ? JSON.parse(saved) : INITIAL_TOURNAMENTS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeScreen, setActiveScreen] = useState('home');
  const [screenParams, setScreenParams] = useState<any>({});
  const [navigationHistory, setNavigationHistory] = useState<{ screen: string; params: any }[]>([]);
  const [undoStack, setUndoStack] = useState<Record<string, any[]>>({});

  // Match Reminder Preferences State
  const [reminders, setReminders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('btg_match_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  // Track match IDs that have already triggered a 15-minute alert in this session
  const [notifiedMatches, setNotifiedMatches] = useState<Set<string>>(() => new Set());

  // In-app alert banner/toast
  const [reminderToast, setReminderToast] = useState<{
    id: string;
    title: string;
    body: string;
    matchId?: string;
  } | null>(null);

  const dismissReminderToast = () => setReminderToast(null);

  useEffect(() => {
    localStorage.setItem('btg_match_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return 'unsupported';
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      return perm;
    } catch {
      return 'denied';
    }
  };

  const triggerMatchNotification = (match: MatchModel, minutesAway: number = 15) => {
    const title = `🏏 Match Alert: ${match.team1} vs ${match.team2}`;
    const body = `Match starts in ~${minutesAway} minutes at ${match.venue || 'the stadium'}! Get ready to follow live.`;

    // 1. Browser Notification API
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: `match-reminder-${match.id}`,
        });
        notif.onclick = () => {
          window.focus();
          navigateTo('user-live-match', { matchId: match.id });
        };
      } catch (e) {
        console.warn('Browser notification error:', e);
      }
    }

    // 2. Play gentle reminder tone via Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {}

    // 3. In-App Banner Toast
    setReminderToast({
      id: `${match.id}-${Date.now()}`,
      title,
      body,
      matchId: match.id,
    });
  };

  const isReminderSet = (matchId: string) => reminders.includes(matchId);

  const toggleReminder = async (
    matchId: string
  ): Promise<{ success: boolean; status: 'added' | 'removed' | 'denied' | 'unsupported'; message: string }> => {
    const isCurrentlySet = reminders.includes(matchId);
    const targetMatch = matches.find((m) => m.id === matchId);
    const matchName = targetMatch ? `${targetMatch.team1} vs ${targetMatch.team2}` : 'Upcoming match';

    if (isCurrentlySet) {
      // Toggle OFF
      setReminders((prev) => prev.filter((id) => id !== matchId));
      setReminderToast({
        id: `toast-${Date.now()}`,
        title: 'Reminder Turned Off',
        body: `You will not receive 15-minute alerts for ${matchName}.`,
        matchId,
      });
      return { success: true, status: 'removed', message: 'Reminder removed' };
    } else {
      // Toggle ON
      let perm = notificationPermission;
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          perm = await Notification.requestPermission();
          setNotificationPermission(perm);
        } else {
          perm = Notification.permission;
        }
      } else {
        perm = 'unsupported';
      }

      setReminders((prev) => [...prev, matchId]);

      // Check if match is already within 15 minutes right now
      if (targetMatch) {
        const matchDateTime = parseMatchDateTime(targetMatch.matchDate, targetMatch.matchTime);
        if (matchDateTime) {
          const diffMs = matchDateTime.getTime() - Date.now();
          const diffMinutes = Math.round(diffMs / (60 * 1000));
          if (diffMinutes >= 0 && diffMinutes <= 15) {
            // Already 15 mins away! Trigger notification immediately!
            setTimeout(() => {
              triggerMatchNotification(targetMatch, Math.max(1, diffMinutes));
            }, 300);
            return {
              success: true,
              status: perm === 'granted' ? 'added' : perm === 'denied' ? 'denied' : 'unsupported',
              message: `Match starts in ${Math.max(1, diffMinutes)}m! Alert triggered.`,
            };
          }
        }
      }

      if (perm === 'granted') {
        setReminderToast({
          id: `toast-${Date.now()}`,
          title: '🔔 Remind Me Activated!',
          body: `We will notify you 15 minutes before ${matchName} begins.`,
          matchId,
        });
        return { success: true, status: 'added', message: 'Reminder set for 15 minutes before match start' };
      } else if (perm === 'denied') {
        setReminderToast({
          id: `toast-${Date.now()}`,
          title: 'Notifications Blocked',
          body: `Reminder saved in app! To receive desktop/system notifications, please allow notifications for this site in your browser.`,
          matchId,
        });
        return { success: true, status: 'denied', message: 'Saved, but notifications blocked in browser' };
      } else {
        setReminderToast({
          id: `toast-${Date.now()}`,
          title: '🔔 Reminder Set',
          body: `You will receive an in-app alert 15 minutes before ${matchName} starts.`,
          matchId,
        });
        return { success: true, status: 'unsupported', message: 'Reminder saved' };
      }
    }
  };

  // Background 15-minute interval checker
  useEffect(() => {
    const checkReminders = () => {
      if (reminders.length === 0) return;
      const now = new Date();

      reminders.forEach((matchId) => {
        const match = matches.find((m) => m.id === matchId);
        if (!match || match.status !== 'upcoming') return;

        const matchDateTime = parseMatchDateTime(match.matchDate, match.matchTime);
        if (!matchDateTime) return;

        const diffMs = matchDateTime.getTime() - now.getTime();
        const diffMinutes = Math.round(diffMs / (60 * 1000));

        // When match is 15 minutes away (between 0 and 15 mins inclusive)
        if (diffMinutes >= 0 && diffMinutes <= 15) {
          if (!notifiedMatches.has(match.id)) {
            setNotifiedMatches((prev) => new Set(prev).add(match.id));
            triggerMatchNotification(match, Math.max(1, diffMinutes));
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [reminders, matches, notifiedMatches]);


  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('btg_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('btg_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('btg_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('btg_tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('btg_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('btg_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (playerProfile) {
      localStorage.setItem('btg_player_profile', JSON.stringify(playerProfile));
    }
  }, [playerProfile]);

  const isAdmin = currentUser?.email?.toLowerCase() === 'admin@gmail.com' || Boolean(currentUser?.isAdmin);

  const navigateTo = (screen: string, params: any = {}) => {
    setNavigationHistory((prev) => [...prev, { screen: activeScreen, params: screenParams }]);
    setActiveScreen(screen);
    setScreenParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (navigationHistory.length > 0) {
      const prev = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory((history) => history.slice(0, history.length - 1));
      setActiveScreen(prev.screen);
      setScreenParams(prev.params);
    } else {
      setActiveScreen('home');
      setScreenParams({});
    }
  };

  const signIn = async (email: string, password?: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    const authResult = authenticateUserCredentials(email, password);
    setIsLoading(false);
    if (!authResult.success || !authResult.user) {
      throw new Error(authResult.error || 'Authentication failed');
    }
    setCurrentUser(authResult.user);
    if (authResult.user.isAdmin) {
      setPlayerProfile(null);
      localStorage.removeItem('btg_player_profile');
    }
    return true;
  };

  const signUp = async (email: string, name?: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    const isAdminUser = email.toLowerCase() === 'admin@gmail.com';
    const user: UserProfile = {
      uid: 'user-' + Date.now(),
      email: email.trim().toLowerCase(),
      displayName: name?.trim() || email.split('@')[0],
      isAdmin: isAdminUser,
    };
    setCurrentUser(user);
    setIsLoading(false);
    return true;
  };

  const signOut = async () => {
    setCurrentUser(null);
    navigateTo('auth');
  };

  const loginAsDemo = (role: 'admin' | 'player') => {
    if (role === 'admin') {
      const adminUser: UserProfile = {
        uid: 'admin-1',
        email: 'admin@gmail.com',
        displayName: 'Tournament Admin',
        isAdmin: true,
      };
      setCurrentUser(adminUser);
      localStorage.setItem('btg_user', JSON.stringify(adminUser));
      setPlayerProfile(null);
      localStorage.removeItem('btg_player_profile');
    } else {
      const playerUser: UserProfile = {
        uid: 'player-1',
        email: 'player@btgcricket.com',
        displayName: 'Rohit Sharma',
        isAdmin: false,
      };
      setCurrentUser(playerUser);
      setPlayerProfile(INITIAL_PLAYERS[0]);
      localStorage.setItem('btg_user', JSON.stringify(playerUser));
      localStorage.setItem('btg_player_profile', JSON.stringify(INITIAL_PLAYERS[0]));
    }
    navigateTo('home');
  };

  const savePlayerProfile = async (profile: Partial<PlayerModel>) => {
    if (!currentUser) return;
    const newProfile: PlayerModel = {
      uid: currentUser.uid,
      playerName: profile.playerName || currentUser.displayName || 'Player',
      email: currentUser.email,
      age: profile.age || 25,
      jerseyNumber: profile.jerseyNumber || 10,
      role: profile.role || 'All-Rounder',
      teamName: profile.teamName || (teams[0] ? teams[0].teamName : 'BTG Warriors'),
      totalRuns: profile.totalRuns || 0,
      totalBalls: profile.totalBalls || 0,
      totalWickets: profile.totalWickets || 0,
      oversBowled: profile.oversBowled || 0,
    };
    setPlayerProfile(newProfile);

    // Also update players list if exists
    setPlayers((prev) => {
      const idx = prev.findIndex((p) => p.uid === currentUser.uid || p.email === currentUser.email);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...newProfile };
        return updated;
      }
      return [...prev, newProfile];
    });
  };

  const addTeam = async (teamData: Omit<Team, 'id'>) => {
    const newTeam: Team = {
      id: 'team-' + Date.now(),
      ...teamData,
      playerCount: teamData.playerCount || 0,
    };
    setTeams((prev) => [...prev, newTeam]);
    return newTeam.id;
  };

  const addPlayer = async (playerData: Omit<PlayerModel, 'uid'>) => {
    const newPlayer: PlayerModel = {
      uid: 'player-' + Date.now(),
      ...playerData,
      totalRuns: playerData.totalRuns || 0,
      totalBalls: playerData.totalBalls || 0,
      totalWickets: playerData.totalWickets || 0,
      oversBowled: playerData.oversBowled || 0,
    };
    setPlayers((prev) => [...prev, newPlayer]);

    // Bump team player count
    setTeams((prev) =>
      prev.map((t) =>
        t.teamName === playerData.teamName ? { ...t, playerCount: (t.playerCount || 0) + 1 } : t
      )
    );
    return newPlayer.uid;
  };

  const updatePlayer = async (uid: string, data: Partial<PlayerModel>) => {
    setPlayers((prev) => prev.map((p) => (p.uid === uid ? { ...p, ...data } : p)));
    if (playerProfile?.uid === uid) {
      setPlayerProfile((prev) => (prev ? { ...prev, ...data } : null));
    }
  };

  const addMatch = async (matchData: Omit<MatchModel, 'id'>) => {
    const newMatch: MatchModel = {
      id: 'match-' + Date.now(),
      ...matchData,
      team1Score: matchData.team1Score || '0/0',
      team2Score: matchData.team2Score || '0/0',
      team1Overs: matchData.team1Overs || '0.0',
      team1Runs: matchData.team1Runs || 0,
      team1Wickets: matchData.team1Wickets || 0,
      status: matchData.status || 'upcoming',
      totalOvers: matchData.totalOvers || 20,
      inningsNumber: matchData.inningsNumber || 1,
      currentBatsmen: matchData.currentBatsmen || [],
      currentBowler: matchData.currentBowler || null,
      bowlersHistory: matchData.bowlersHistory || [],
      recentBalls: matchData.recentBalls || [],
    };
    setMatches((prev) => [newMatch, ...prev]);
    return newMatch.id;
  };

  const updateMatch = async (matchId: string, updates: Partial<MatchModel>) => {
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, ...updates } : m)));
  };

  const deleteMatch = async (matchId: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
  };

  const createTournament = async (name: string, selectedTeams: string[], oversPerMatch: number) => {
    const totalMatches = Math.floor((selectedTeams.length * (selectedTeams.length - 1)) / 2);
    const pointsTable: Record<string, { played: number; won: number; lost: number; nrr: number; points: number }> = {};
    selectedTeams.forEach((t) => {
      pointsTable[t] = { played: 0, won: 0, lost: 0, nrr: 0.0, points: 0 };
    });

    const tournamentId = 'tourn-' + Date.now();
    const newTourn: TournamentModel = {
      id: tournamentId,
      name,
      teams: selectedTeams,
      totalMatches,
      completedMatches: 0,
      oversPerMatch,
      status: 'upcoming',
      stage: 'group',
      pointsTable,
      createdAt: new Date().toISOString(),
    };

    setTournaments((prev) => [newTourn, ...prev]);

    // Auto-generate round-robin match fixtures
    const newFixtures: MatchModel[] = [];
    for (let i = 0; i < selectedTeams.length; i++) {
      for (let j = i + 1; j < selectedTeams.length; j++) {
        newFixtures.push({
          id: `match-t-${Date.now()}-${i}-${j}`,
          tournamentId,
          team1: selectedTeams[i],
          team2: selectedTeams[j],
          team1Score: '0/0',
          team2Score: '0/0',
          team1Overs: '0.0',
          team1Runs: 0,
          team1Wickets: 0,
          status: 'upcoming',
          totalOvers: oversPerMatch,
          venue: 'BTG International Stadium',
          matchDate: new Date(Date.now() + (i * selectedTeams.length + j) * 86400000).toLocaleDateString(),
          matchTime: '7:30 PM',
          inningsNumber: 1,
          currentBatsmen: [],
          currentBowler: null,
          bowlersHistory: [],
          recentBalls: [],
        });
      }
    }

    setMatches((prev) => [...newFixtures, ...prev]);
    return tournamentId;
  };

  const updateTournament = async (tournamentId: string, updates: Partial<TournamentModel>) => {
    setTournaments((prev) =>
      prev.map((t) => {
        if (t.id !== tournamentId) return t;
        const updated = { ...t, ...updates };
        if (updates.teams) {
          const currentTable = updated.pointsTable || {};
          const newTable: Record<string, { played: number; won: number; lost: number; nrr: number; points: number }> = {};
          updates.teams.forEach((team) => {
            newTable[team] = currentTable[team] || { played: 0, won: 0, lost: 0, nrr: 0.0, points: 0 };
          });
          updated.pointsTable = newTable;
          updated.totalMatches = Math.floor((updates.teams.length * (updates.teams.length - 1)) / 2);
        }
        return updated;
      })
    );
  };

  const deleteTournament = async (tournamentId: string) => {
    setTournaments((prev) => prev.filter((t) => t.id !== tournamentId));
    // Also remove fixtures that belonged strictly to this tournament
    setMatches((prev) => prev.filter((m) => m.tournamentId !== tournamentId));
  };

  const updateAdminProfile = async (displayName: string, email?: string) => {
    if (!currentUser) return;
    const updatedUser: UserProfile = {
      ...currentUser,
      displayName: displayName.trim() || 'Tournament Admin',
      email: email?.trim() || currentUser.email,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('btg_user', JSON.stringify(updatedUser));
  };

  const startMatch = async (
    matchId: string,
    setup: {
      tossWinner: string;
      tossDecision: 'bat' | 'bowl';
      battingTeam: string;
      bowlingTeam: string;
      totalOvers: number;
      selectedBatsmen: string[];
      selectedBowler: string;
    }
  ) => {
    const initialBatsmen = setup.selectedBatsmen.map((name, idx) => ({
      name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOnStrike: idx === 0,
    }));

    const initialBowler = {
      name: setup.selectedBowler,
      overs: '0.0',
      runs: 0,
      wickets: 0,
      maidens: 0,
    };

    updateMatch(matchId, {
      status: 'live',
      tossWinner: setup.tossWinner,
      tossDecision: setup.tossDecision,
      team1: setup.battingTeam,
      team2: setup.bowlingTeam,
      totalOvers: setup.totalOvers,
      team1Score: '0/0',
      team1Overs: '0.0',
      team1Runs: 0,
      team1Wickets: 0,
      team2Score: '0/0',
      team2Overs: '0.0',
      team2Runs: 0,
      team2Wickets: 0,
      inningsNumber: 1,
      currentBatsmen: initialBatsmen,
      currentBowler: initialBowler,
      bowlersHistory: [initialBowler],
      recentBalls: [],
    });
  };

  const addBall = async (matchId: string, ballType: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return {};

    // Save state for undo
    setUndoStack((prev) => ({
      ...prev,
      [matchId]: [
        ...(prev[matchId] || []),
        JSON.parse(JSON.stringify(match)),
      ],
    }));

    let t1Runs = match.team1Runs || 0;
    let t1Wickets = match.team1Wickets || 0;
    const currentOversStr = match.team1Overs || '0.0';
    let totalBalls = parseOversToBalls(currentOversStr);

    let runsToAdd = 0;
    let isLegalBall = true;
    let isPersonalRun = true;
    let ballDisplay = ballType;

    const batsmen = match.currentBatsmen ? [...match.currentBatsmen] : [];
    const strikerIndex = batsmen.findIndex((b) => b.isOnStrike);
    let bowler = match.currentBowler ? { ...match.currentBowler } : null;

    switch (ballType) {
      case '0':
        runsToAdd = 0;
        break;
      case '1':
        runsToAdd = 1;
        break;
      case '2':
        runsToAdd = 2;
        break;
      case '3':
        runsToAdd = 3;
        break;
      case '4':
        runsToAdd = 4;
        break;
      case '6':
        runsToAdd = 6;
        break;
      case 'W':
        runsToAdd = 0;
        t1Wickets++;
        ballDisplay = 'W';
        break;
      case 'WD':
        runsToAdd = 1;
        isLegalBall = false;
        isPersonalRun = false;
        ballDisplay = 'WD';
        break;
      case 'NB':
        runsToAdd = 1;
        isLegalBall = false;
        isPersonalRun = false;
        ballDisplay = 'NB';
        break;
      case 'BYE':
      case 'B':
        runsToAdd = 1;
        isLegalBall = true;
        isPersonalRun = false;
        ballDisplay = 'B';
        break;
      case 'LB':
        runsToAdd = 1;
        isLegalBall = true;
        isPersonalRun = false;
        ballDisplay = 'LB';
        break;
    }

    t1Runs += runsToAdd;

    if (isLegalBall) {
      totalBalls++;
    }

    // Update striker stats
    if (strikerIndex >= 0 && isLegalBall) {
      const striker = { ...batsmen[strikerIndex] };
      striker.balls = (striker.balls || 0) + 1;
      if (isPersonalRun) {
        striker.runs = (striker.runs || 0) + runsToAdd;
        if (runsToAdd === 4) striker.fours = (striker.fours || 0) + 1;
        if (runsToAdd === 6) striker.sixes = (striker.sixes || 0) + 1;
      }
      batsmen[strikerIndex] = striker;
    }

    // Update bowler stats
    if (bowler) {
      if (ballType === 'WD' || ballType === 'NB') {
        bowler.runs = (bowler.runs || 0) + runsToAdd;
      } else if (ballType === 'BYE' || ballType === 'B' || ballType === 'LB') {
        const bBalls = parseOversToBalls(bowler.overs || '0.0') + 1;
        bowler.overs = formatBallsToOvers(bBalls);
      } else {
        const bBalls = parseOversToBalls(bowler.overs || '0.0') + 1;
        bowler.overs = formatBallsToOvers(bBalls);
        bowler.runs = (bowler.runs || 0) + runsToAdd;
        if (ballType === 'W') {
          bowler.wickets = (bowler.wickets || 0) + 1;
        }
      }
    }

    // Strike rotation on odd runs (only for runs off bat / personal runs)
    if (ballType !== 'W' && isPersonalRun && runsToAdd % 2 !== 0 && batsmen.length === 2) {
      batsmen[0].isOnStrike = !batsmen[0].isOnStrike;
      batsmen[1].isOnStrike = !batsmen[1].isOnStrike;
    }

    const newOvers = formatBallsToOvers(totalBalls);
    const newScoreStr = `${t1Runs}/${t1Wickets}`;
    const recent = [...(match.recentBalls || []), ballDisplay];

    // Bowler history sync
    const bowlersHistory = match.bowlersHistory ? [...match.bowlersHistory] : [];
    if (bowler) {
      const bIdx = bowlersHistory.findIndex((b) => b.name === bowler!.name);
      if (bIdx >= 0) {
        bowlersHistory[bIdx] = bowler;
      } else {
        bowlersHistory.push(bowler);
      }
    }

    const totalOvers = match.totalOvers || 20;
    const maxBalls = totalOvers * 6;
    const target = match.target || 0;
    const currentInnings = match.inningsNumber || 1;

    const targetReached = currentInnings === 2 && target > 0 && t1Runs >= target;
    const isInningsOver = totalBalls >= maxBalls || t1Wickets >= 10 || targetReached;

    // Check if over completed (legal ball and totalBalls % 6 === 0)
    const isOverComplete = isLegalBall && totalBalls % 6 === 0 && !isInningsOver;

    // If over complete, auto rotate strike for next over
    if (isOverComplete && batsmen.length === 2) {
      batsmen[0].isOnStrike = !batsmen[0].isOnStrike;
      batsmen[1].isOnStrike = !batsmen[1].isOnStrike;
    }

    const updatePayload: Partial<MatchModel> = {
      team1Runs: t1Runs,
      team1Wickets: t1Wickets,
      team1Overs: newOvers,
      team1Score: newScoreStr,
      currentBatsmen: batsmen,
      currentBowler: bowler,
      bowlersHistory,
      recentBalls: recent,
    };

    if (isInningsOver && currentInnings === 1 && !targetReached) {
      updatePayload.status = 'innings_break';
    }

    let matchWon = false;
    let matchResult = '';

    if (isInningsOver) {
      const battingTeam = match.team1;
      const bowlingTeam = match.team2;

      if (targetReached) {
        const wicketsRemaining = 10 - t1Wickets;
        matchResult = `${battingTeam} won by ${wicketsRemaining} wicket${wicketsRemaining === 1 ? '' : 's'}`;
        matchWon = true;
        await completeMatch(matchId, battingTeam, matchResult);
      } else if (currentInnings === 2) {
        const runsShort = target - t1Runs;
        const isTie = runsShort === 1;
        const winner = isTie ? 'Tied' : bowlingTeam;
        matchResult = isTie ? 'Match Tied' : `${bowlingTeam} won by ${runsShort - 1} runs`;
        matchWon = true;
        await completeMatch(matchId, winner, matchResult);
      }
    }

    updateMatch(matchId, updatePayload);

    return {
      needNewBatsman: ballType === 'W' && t1Wickets < 10 && !isInningsOver,
      overComplete: isOverComplete,
      inningsOver: isInningsOver,
      matchWon,
      matchResult,
    };
  };

  const undoLastBall = async (matchId: string) => {
    const stack = undoStack[matchId] || [];
    if (stack.length === 0) return;
    const lastState = stack[stack.length - 1];
    setUndoStack((prev) => ({
      ...prev,
      [matchId]: stack.slice(0, stack.length - 1),
    }));
    updateMatch(matchId, lastState);
  };

  const setNewBatsman = async (matchId: string, batsmanName: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const batsmen = match.currentBatsmen ? [...match.currentBatsmen] : [];
    const outIdx = batsmen.findIndex((b) => b.isOnStrike);

    const newBatsman = {
      name: batsmanName,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOnStrike: true,
    };

    if (outIdx >= 0) {
      batsmen[outIdx] = newBatsman;
    } else {
      batsmen.push(newBatsman);
    }

    updateMatch(matchId, { currentBatsmen: batsmen });
  };

  const setNewBowler = async (matchId: string, bowlerName: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const bowlersHistory = match.bowlersHistory ? [...match.bowlersHistory] : [];
    const existing = bowlersHistory.find((b) => b.name === bowlerName);

    const newBowler = existing || {
      name: bowlerName,
      overs: '0.0',
      runs: 0,
      wickets: 0,
      maidens: 0,
    };

    updateMatch(matchId, { currentBowler: newBowler });
  };

  const startSecondInnings = async (
    matchId: string,
    openingBatsmen: string[],
    openingBowler: string
  ) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const oldBatting = match.team1;
    const newBatting = match.team2;
    const firstInningsScore = match.team1Score;
    const firstInningsOvers = match.team1Overs;
    const target = (match.team1Runs || 0) + 1;

    const initialBatsmen = openingBatsmen.map((name, idx) => ({
      name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOnStrike: idx === 0,
    }));

    const initialBowler = {
      name: openingBowler,
      overs: '0.0',
      runs: 0,
      wickets: 0,
      maidens: 0,
    };

    updateMatch(matchId, {
      team1: newBatting,
      team2: oldBatting,
      firstInningsTeam: oldBatting,
      firstInningsScore,
      firstInningsOvers,
      firstInningsBatsmen: match.currentBatsmen,
      firstInningsBowlers: match.bowlersHistory,
      team1Score: '0/0',
      team1Overs: '0.0',
      team1Runs: 0,
      team1Wickets: 0,
      target,
      status: 'live',
      recentBalls: [],
      bowlersHistory: [initialBowler],
      currentBatsmen: initialBatsmen,
      currentBowler: initialBowler,
      inningsNumber: 2,
    });
  };

  const completeMatch = async (matchId: string, winner: string, result: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    updateMatch(matchId, {
      status: 'completed',
      winner,
      result,
      secondInningsTeam: match.team1,
      secondInningsScore: match.team1Score,
      secondInningsOvers: match.team1Overs,
      secondInningsBatsmen: match.currentBatsmen,
      secondInningsBowlers: match.bowlersHistory,
    });

    // Update tournament points table if part of a tournament
    if (match.tournamentId) {
      setTournaments((prev) =>
        prev.map((t) => {
          if (t.id !== match.tournamentId) return t;

          const pointsTable = { ...t.pointsTable };
          const teamA = match.firstInningsTeam || match.team1;
          const teamB = match.firstInningsTeam === match.team1 ? match.team2 : match.team1;

          if (pointsTable[teamA] && pointsTable[teamB]) {
            const loser = winner === teamA ? teamB : teamA;
            if (winner !== 'Tied') {
              pointsTable[winner] = {
                ...pointsTable[winner],
                played: pointsTable[winner].played + 1,
                won: pointsTable[winner].won + 1,
                points: pointsTable[winner].points + 2,
                nrr: +(pointsTable[winner].nrr + 0.85).toFixed(2),
              };
              pointsTable[loser] = {
                ...pointsTable[loser],
                played: pointsTable[loser].played + 1,
                lost: pointsTable[loser].lost + 1,
                nrr: +(pointsTable[loser].nrr - 0.85).toFixed(2),
              };
            } else {
              pointsTable[teamA] = {
                ...pointsTable[teamA],
                played: pointsTable[teamA].played + 1,
                points: pointsTable[teamA].points + 1,
              };
              pointsTable[teamB] = {
                ...pointsTable[teamB],
                played: pointsTable[teamB].played + 1,
                points: pointsTable[teamB].points + 1,
              };
            }
          }

          return {
            ...t,
            completedMatches: t.completedMatches + 1,
            pointsTable,
          };
        })
      );
    }
  };

  return (
    <CricketContext.Provider
      value={{
        currentUser,
        isAdmin,
        playerProfile,
        teams,
        players,
        matches,
        tournaments,
        isLoading,
        activeScreen,
        screenParams,
        navigateTo,
        goBack,
        signIn,
        signUp,
        signOut,
        loginAsDemo,
        savePlayerProfile,
        addTeam,
        addPlayer,
        updatePlayer,
        addMatch,
        updateMatch,
        deleteMatch,
        createTournament,
        updateTournament,
        deleteTournament,
        updateAdminProfile,
        startMatch,
        addBall,
        undoLastBall,
        setNewBatsman,
        setNewBowler,
        startSecondInnings,
        completeMatch,
        undoStack,
        reminders,
        toggleReminder,
        isReminderSet,
        notificationPermission,
        requestNotificationPermission,
        triggerMatchNotification,
        reminderToast,
        dismissReminderToast,
      }}
    >
      {children}
    </CricketContext.Provider>
  );
};

export const useCricket = () => {
  const context = useContext(CricketContext);
  if (!context) {
    throw new Error('useCricket must be used within a CricketProvider');
  }
  return context;
};
