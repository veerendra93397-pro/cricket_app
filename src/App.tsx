import React, { useState } from 'react';
import { CricketProvider, useCricket } from './context/CricketContext';
import { SplashScreen } from './screens/SplashScreen';
import { AuthScreen } from './screens/AuthScreen';
import { PlayerRegistrationScreen } from './screens/PlayerRegistrationScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MatchesScreen } from './screens/MatchesScreen';
import { AddMatchScreen } from './screens/AddMatchScreen';
import { MatchSetupScreen } from './screens/MatchSetupScreen';
import { LiveScoringInterface } from './screens/LiveScoringInterface';
import { UserLiveMatchScreen } from './screens/UserLiveMatchScreen';
import { ScorecardScreen } from './screens/ScorecardScreen';
import { AdminScoreUpdateScreen } from './screens/AdminScoreUpdateScreen';
import {
  TeamsScreen,
  TeamDetailsScreen,
  AddTeamScreen,
} from './screens/TeamsScreen';
import {
  PlayersScreen,
  PlayerDetailsScreen,
  AddPlayerScreen,
  MyProfileScreen,
} from './screens/PlayersScreen';
import {
  TournamentsScreen,
  TournamentDetailsScreen,
} from './screens/TournamentsScreen';
import { CreateTournamentScreen } from './screens/CreateTournamentScreen';
import { PointsTableScreen } from './screens/PointsTableScreen';
import { ReminderNotificationToast } from './components/common/ReminderNotificationToast';
import { Home, Calendar, Users, Trophy, User } from './components/Icons';

const MainNavigator: React.FC = () => {
  const { activeScreen, currentUser, navigateTo } = useCricket();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Auth gate if user explicitly logs out or wants to log in
  if (activeScreen === 'auth' && !currentUser) {
    return <AuthScreen />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen />;
      case 'auth':
        return <AuthScreen />;
      case 'player-registration':
        return <PlayerRegistrationScreen />;
      case 'matches':
        return <MatchesScreen />;
      case 'add-match':
        return <AddMatchScreen />;
      case 'match-setup':
        return <MatchSetupScreen />;
      case 'live-scorer':
        return <LiveScoringInterface />;
      case 'live-score':
      case 'user-live-match':
        return <UserLiveMatchScreen />;
      case 'scorecard':
        return <ScorecardScreen />;
      case 'admin-score-update':
        return <AdminScoreUpdateScreen />;
      case 'teams':
        return <TeamsScreen />;
      case 'team-details':
        return <TeamDetailsScreen />;
      case 'add-team':
        return <AddTeamScreen />;
      case 'players':
        return <PlayersScreen />;
      case 'player-details':
        return <PlayerDetailsScreen />;
      case 'add-player':
        return <AddPlayerScreen />;
      case 'profile':
        return <MyProfileScreen />;
      case 'tournaments':
        return <TournamentsScreen />;
      case 'tournament-details':
        return <TournamentDetailsScreen />;
      case 'create-tournament':
        return <CreateTournamentScreen />;
      case 'points-table':
        return <PointsTableScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const showBottomNav =
    activeScreen !== 'live-scorer' &&
    activeScreen !== 'auth' &&
    activeScreen !== 'player-registration' &&
    activeScreen !== 'match-setup';

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex flex-col justify-between selection:bg-[#00C853] selection:text-white">
      <ReminderNotificationToast />
      <div className="flex-1">{renderScreen()}</div>

      {/* Persistent Bottom App Bar */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E4EAE6] shadow-lg">
          <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around">
            <button
              onClick={() => navigateTo('home')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
                activeScreen === 'home'
                  ? 'text-[#0B3D2E] font-black'
                  : 'text-[#8A978F] font-semibold hover:text-[#13201B]'
              }`}
            >
              <Home className={`w-5 h-5 ${activeScreen === 'home' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px]">Home</span>
            </button>

            <button
              onClick={() => navigateTo('matches')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
                activeScreen === 'matches'
                  ? 'text-[#0B3D2E] font-black'
                  : 'text-[#8A978F] font-semibold hover:text-[#13201B]'
              }`}
            >
              <Calendar className={`w-5 h-5 ${activeScreen === 'matches' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px]">Matches</span>
            </button>

            <button
              onClick={() => navigateTo('teams')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
                activeScreen === 'teams'
                  ? 'text-[#0B3D2E] font-black'
                  : 'text-[#8A978F] font-semibold hover:text-[#13201B]'
              }`}
            >
              <Users className={`w-5 h-5 ${activeScreen === 'teams' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px]">Teams</span>
            </button>

            <button
              onClick={() => navigateTo('tournaments')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
                activeScreen === 'tournaments' || activeScreen === 'tournament-details'
                  ? 'text-[#0B3D2E] font-black'
                  : 'text-[#8A978F] font-semibold hover:text-[#13201B]'
              }`}
            >
              <Trophy className={`w-5 h-5 ${activeScreen === 'tournaments' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px]">Leagues</span>
            </button>

            <button
              onClick={() => navigateTo('profile')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
                activeScreen === 'profile'
                  ? 'text-[#0B3D2E] font-black'
                  : 'text-[#8A978F] font-semibold hover:text-[#13201B]'
              }`}
            >
              <User className={`w-5 h-5 ${activeScreen === 'profile' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px]">Profile</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export function App() {
  return (
    <CricketProvider>
      <MainNavigator />
    </CricketProvider>
  );
}

export default App;
