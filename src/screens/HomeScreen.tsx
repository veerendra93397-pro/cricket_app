import React from 'react';
import { useCricket } from '../context/CricketContext';
import { Header } from '../components/common/Header';
import {
  StatusPill,
  InitialAvatar,
  AppCard,
  SectionHeader,
} from '../components/common/AppWidgets';
import { RemindMeButton } from '../components/common/RemindMeButton';
import { ShareMatchButton } from '../components/common/ShareMatchButton';
import {
  Users,
  User,
  Calendar,
  Tv,
  Trophy,
  MapPin,
  CheckCircle,
  Play,
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { matches, isAdmin, navigateTo } = useCricket();

  const liveMatch = matches.find((m) => m.status === 'live' || m.status === 'innings_break');
  const upcomingMatches = matches.filter((m) => m.status === 'upcoming').slice(0, 3);
  const completedMatches = matches.filter((m) => m.status === 'completed').slice(0, 4);

  const quickActions = [
    {
      label: 'Teams',
      icon: Users,
      gradient: 'from-[#0B3D2E] to-[#00A94D]',
      screen: 'teams',
    },
    {
      label: 'Players',
      icon: User,
      gradient: 'from-[#7C4DFF] to-[#5E35B1]',
      screen: 'players',
    },
    {
      label: 'Matches',
      icon: Calendar,
      gradient: 'from-[#2979FF] to-[#1565C0]',
      screen: 'matches',
    },
    {
      label: 'Live Score',
      icon: Tv,
      gradient: 'from-[#FF9100] to-[#E65100]',
      screen: liveMatch ? 'live-score' : 'matches',
      params: liveMatch ? { matchId: liveMatch.id } : { tab: 'live' },
    },
    {
      label: 'Tournaments',
      icon: Trophy,
      gradient: 'from-[#FFD54F] via-[#FFB300] to-[#FF8F00]',
      screen: 'tournaments',
    },
    {
      label: 'Profile',
      icon: User,
      gradient: 'from-[#26A69A] to-[#00695C]',
      screen: 'profile',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-16">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-6">
        {/* Live Match Hero Section */}
        <section>
          <SectionHeader title="Live Match" />

          {liveMatch ? (
            <div className="bg-gradient-to-br from-[#C62828] to-[#E53935] rounded-3xl p-5 text-white shadow-[0_8px_24px_rgba(229,57,53,0.32)]">
              {/* Header row */}
              <div className="flex items-center justify-between pb-3 border-b border-white/20">
                <span className="text-xs font-black tracking-widest uppercase">
                  {liveMatch.status === 'innings_break' ? 'INNINGS BREAK' : 'LIVE MATCH'}
                </span>
                <span className="flex items-center gap-1.5 bg-white text-[#E53935] px-2.5 py-1 rounded-full text-xs font-black tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#E53935] animate-ping" />
                  LIVE
                </span>
              </div>

              {/* Teams & Scores */}
              <div className="py-4 grid grid-cols-5 items-center">
                {/* Team 1 (Batting) */}
                <div className="col-span-2 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center font-black text-2xl text-white shadow-inner mb-2">
                    {liveMatch.team1.charAt(0)}
                  </div>
                  <h4 className="font-extrabold text-sm line-clamp-1">{liveMatch.team1}</h4>
                  <span className="text-2xl font-black tracking-tight mt-1">
                    {liveMatch.team1Score}
                  </span>
                  <span className="text-xs text-white/80 font-medium">
                    ({liveMatch.team1Overs} ov)
                  </span>
                </div>

                {/* VS divider */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-white/70 bg-white/10 px-2 py-1 rounded-md">
                    VS
                  </span>
                  {liveMatch.target && (
                    <span className="text-[10px] font-bold text-white/90 mt-2 text-center bg-black/20 px-2 py-0.5 rounded-full">
                      Target {liveMatch.target}
                    </span>
                  )}
                </div>

                {/* Team 2 (Bowling / 1st inn) */}
                <div className="col-span-2 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center font-black text-2xl text-white shadow-inner mb-2">
                    {liveMatch.team2.charAt(0)}
                  </div>
                  <h4 className="font-extrabold text-sm line-clamp-1">{liveMatch.team2}</h4>
                  <span className="text-2xl font-black tracking-tight mt-1">
                    {liveMatch.team2Score || (liveMatch.inningsNumber === 1 ? 'Yet to bat' : '0/0')}
                  </span>
                  {liveMatch.team2Overs && liveMatch.team2Score && (
                    <span className="text-xs text-white/80 font-medium">
                      ({liveMatch.team2Overs} ov)
                    </span>
                  )}
                </div>
              </div>

              {/* Action button */}
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    if (isAdmin) {
                      navigateTo('live-scorer', { matchId: liveMatch.id });
                    } else {
                      navigateTo('user-live-match', { matchId: liveMatch.id });
                    }
                  }}
                  className="bg-white hover:bg-slate-50 text-[#E53935] font-black px-6 sm:px-8 py-2.5 rounded-full text-xs tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-[#E53935]" />
                  {isAdmin ? 'UPDATE LIVE SCORE' : 'VIEW LIVE SCORE'}
                </button>
                <ShareMatchButton
                  match={liveMatch}
                  variant="button"
                  className="!bg-white/20 hover:!bg-white/30 text-white rounded-full py-2.5 px-4 text-xs font-bold"
                />
              </div>
            </div>
          ) : (
            <div className="bg-[#EFF3F0] rounded-3xl p-8 text-center border border-dashed border-[#B9C9C0]">
              <div className="w-12 h-12 rounded-full bg-[#B9C9C0]/40 flex items-center justify-center text-2xl mx-auto mb-2 text-[#5B6B63]">
                🏏
              </div>
              <p className="text-sm font-bold text-[#5B6B63]">No live matches right now</p>
              {isAdmin && (
                <button
                  onClick={() => navigateTo('add-match')}
                  className="mt-3 text-xs font-bold bg-[#00C853] text-white px-4 py-2 rounded-xl hover:bg-[#00A94D] transition-colors"
                >
                  Create or Schedule Match
                </button>
              )}
            </div>
          )}
        </section>

        {/* Quick Actions Grid */}
        <section>
          <SectionHeader title="Quick Actions" />
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigateTo(action.screen, action.params)}
                  className={`bg-gradient-to-br ${action.gradient} rounded-2xl p-3 sm:p-4 text-white shadow-sm hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center text-center aspect-square sm:aspect-auto sm:h-24 cursor-pointer`}
                >
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8 mb-1.5 drop-shadow-xs" />
                  <span className="text-xs sm:text-sm font-black tracking-tight">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Upcoming Matches */}
        <section>
          <SectionHeader
            title="Upcoming Matches"
            actionText="View All"
            onAction={() => navigateTo('matches', { tab: 'upcoming' })}
          />
          <div className="space-y-3">
            {upcomingMatches.length > 0 ? (
              upcomingMatches.map((m) => (
                <AppCard
                  key={m.id}
                  onClick={() => {
                    if (isAdmin) {
                      navigateTo('match-setup', { matchId: m.id });
                    } else {
                      navigateTo('user-live-match', { matchId: m.id });
                    }
                  }}
                  className="hover:border-[#00C853]/40"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <StatusPill label="UPCOMING" color="#FF9100" />
                      <span className="text-xs font-medium text-[#8A978F]">
                        {m.matchDate} • {m.matchTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RemindMeButton
                        matchId={m.id}
                        matchDate={m.matchDate}
                        matchTime={m.matchTime}
                        compact
                      />
                      <ShareMatchButton match={m} variant="icon" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <InitialAvatar text={m.team1} size={38} />
                      <span className="font-extrabold text-sm text-[#13201B] truncate">
                        {m.team1}
                      </span>
                    </div>

                    <div className="px-3">
                      <span className="text-xs font-black text-[#8A978F] bg-[#EFF3F0] px-2 py-1 rounded-md">
                        VS
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
                      <span className="font-extrabold text-sm text-[#13201B] truncate text-right">
                        {m.team2}
                      </span>
                      <InitialAvatar text={m.team2} size={38} />
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#E4EAE6] flex items-center justify-between text-xs text-[#8A978F]">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#8A978F]" />
                      <span className="truncate">{m.venue || 'TBD'}</span>
                    </div>
                    {isAdmin && (
                      <span className="text-[11px] font-bold text-[#00A94D] bg-[#00A94D]/10 px-2 py-0.5 rounded-full shrink-0">
                        Start Match →
                      </span>
                    )}
                  </div>
                </AppCard>
              ))
            ) : (
              <p className="text-xs text-[#8A978F] text-center py-4 bg-white rounded-2xl border border-[#E4EAE6]">
                No upcoming fixtures scheduled
              </p>
            )}
          </div>
        </section>

        {/* Recent Results */}
        <section>
          <SectionHeader
            title="Recent Results"
            actionText="View All"
            onAction={() => navigateTo('matches', { tab: 'completed' })}
          />
          <div className="space-y-3">
            {completedMatches.length > 0 ? (
              completedMatches.map((m) => (
                <AppCard
                  key={m.id}
                  onClick={() => navigateTo('user-live-match', { matchId: m.id })}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-sm text-[#13201B] truncate">
                          {m.team1} vs {m.team2}
                        </h4>
                        <span className="text-xs font-bold text-[#0B3D2E] shrink-0">
                          {m.team1Score}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#2E7D32] mt-0.5 truncate">
                        {m.result || `${m.winner || 'Winner'} won the match`}
                      </p>
                    </div>
                    <ShareMatchButton match={m} variant="icon" />
                  </div>
                </AppCard>
              ))
            ) : (
              <p className="text-xs text-[#8A978F] text-center py-4 bg-white rounded-2xl border border-[#E4EAE6]">
                No completed matches yet
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
