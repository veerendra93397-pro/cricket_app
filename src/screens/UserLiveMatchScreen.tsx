import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Header } from '../components/common/Header';
import { BallChip, InitialAvatar, StatusPill } from '../components/common/AppWidgets';
import { RemindMeButton } from '../components/common/RemindMeButton';
import { ShareMatchButton } from '../components/common/ShareMatchButton';
import {
  CricTheme,
  calculateRunRate,
  calculateRequiredRate,
  calculateBowlerEconomy,
  parseOversToBalls,
} from '../utils/cricTheme';
import {
  MapPin,
  Clock,
  Calendar,
  Trophy,
  Play,
  FileText,
  Activity,
  Flame,
  Layers,
  Award,
} from 'lucide-react';
import { PlayerOfTheMatchCard } from '../components/match/PlayerOfTheMatchCard';
import { PlayerOfTheMatchModal } from '../components/match/PlayerOfTheMatchModal';

export const UserLiveMatchScreen: React.FC = () => {
  const { matches, isAdmin, screenParams, navigateTo, goBack, updateMatch } = useCricket();
  const matchId = screenParams?.matchId;
  const match = matches.find((m) => m.id === matchId);

  const [activeTab, setActiveTab] = useState<'info' | 'live' | 'scorecard' | 'commentary' | 'highlights'>('live');
  const [scorecardInnings, setScorecardInnings] = useState<1 | 2>(1);
  const [isPotmModalOpen, setIsPotmModalOpen] = useState(false);

  if (!match) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex flex-col">
        <Header title="MATCH CENTER" showBack onBack={goBack} />
        <div className="p-8 text-center text-sm text-[#8A978F]">Match not found</div>
      </div>
    );
  }

  const battingTeam = match.team1;
  const bowlingTeam = match.team2;
  const totalOvers = match.totalOvers || 20;
  const currentInnings = match.inningsNumber || 1;
  const isLive = match.status === 'live' || match.status === 'innings_break';
  const isCompleted = match.status === 'completed';

  const crr = calculateRunRate(match.team1Runs || 0, match.team1Overs || '0.0');
  const rrr =
    currentInnings === 2 && match.target
      ? calculateRequiredRate(match.team1Runs || 0, match.team1Overs || '0.0', match.target, totalOvers)
      : null;

  // Commentary generated from recent deliveries
  const commentaryFeed = (match.recentBalls || [])
    .slice()
    .reverse()
    .map((ball, i) => {
      const batsman = match.currentBatsmen?.[0]?.name || 'Batter';
      const bowler = match.currentBowler?.name || 'Bowler';
      return {
        id: i,
        ball,
        text: CricTheme.commentaryFor(ball, batsman, bowler),
      };
    });

  // Highlights (Boundaries and Wickets)
  const highlights = (match.recentBalls || [])
    .map((ball, i) => ({ ball, index: i + 1 }))
    .filter((b) => b.ball === '4' || b.ball === '6' || b.ball === 'W');

  const handleSavePotm = async (
    name: string,
    details: { name: string; team: string; performanceSummary: string; citation?: string }
  ) => {
    if (!match) return;
    await updateMatch(match.id, {
      playerOfTheMatch: name,
      playerOfTheMatchDetails: details,
    });
  };

  const handleRemovePotm = async () => {
    if (!match) return;
    await updateMatch(match.id, {
      playerOfTheMatch: undefined,
      playerOfTheMatchDetails: undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-20">
      <Header
        title="BTG CRICKET"
        showBack
        onBack={goBack}
        actions={
          <div className="flex items-center gap-2">
            <ShareMatchButton match={match} variant="button" className="!bg-white/10 hover:!bg-white/20 !px-2.5 !py-1 text-xs" />
            {isAdmin && isLive && (
              <button
                onClick={() => navigateTo('live-scorer', { matchId: match.id })}
                className="bg-[#00C853] hover:bg-[#00A94D] text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Play className="w-3 h-3 fill-white" />
                Scorer
              </button>
            )}
            {isAdmin && (isCompleted || match.playerOfTheMatch) && (
              <button
                onClick={() => setIsPotmModalOpen(true)}
                className="bg-[#FFB300] hover:bg-[#FFA000] text-[#06251C] px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                title="Select Player of the Match"
              >
                <Award className="w-3.5 h-3.5" />
                <span>POTM</span>
              </button>
            )}
          </div>
        }
      />

      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-[#06251C] to-[#14764E] text-white px-4 py-5 shadow-md">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between text-xs text-white/80 mb-3">
            <span className="font-extrabold truncate">
              {match.team1} vs {match.team2}
            </span>
            <StatusPill
              label={match.status === 'innings_break' ? 'BREAK' : match.status}
              color={isLive ? '#E53935' : isCompleted ? '#2E7D32' : '#FF9100'}
              isLive={isLive}
            />
          </div>

          <div className="grid grid-cols-5 items-center py-2">
            <div className="col-span-2">
              <span className="text-xs uppercase font-black text-[#B9C9C0] tracking-wider block">
                {match.team1}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl sm:text-4xl font-black">
                  {match.team1Score}
                </span>
                <span className="text-xs text-white/80 font-bold">
                  ({match.team1Overs} ov)
                </span>
              </div>
              <span className="text-xs text-[#9FE1CB] font-semibold mt-0.5 block">
                CRR: {crr}
              </span>
            </div>

            <div className="col-span-1 text-center">
              <span className="text-xs font-black text-white/60 bg-white/10 px-2 py-1 rounded-md">
                VS
              </span>
            </div>

            <div className="col-span-2 text-right">
              <span className="text-xs uppercase font-black text-[#B9C9C0] tracking-wider block">
                {match.team2}
              </span>
              <div className="flex items-baseline justify-end gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black">
                  {match.team2Score || (currentInnings === 1 ? 'Yet to bat' : '0/0')}
                </span>
                {match.team2Overs && match.team2Score && (
                  <span className="text-xs text-white/80 font-bold">
                    ({match.team2Overs} ov)
                  </span>
                )}
              </div>
              {currentInnings === 2 && match.target && (
                <span className="text-xs text-[#FFD54F] font-bold mt-0.5 block">
                  Target: {match.target} (RRR: {rrr})
                </span>
              )}
            </div>
          </div>

          {isCompleted && match.result && (
            <div className="mt-3 p-2.5 bg-white/10 border border-white/20 rounded-xl flex items-center justify-between gap-2 text-xs font-bold text-[#FFD54F]">
              <div className="flex items-center gap-2 truncate">
                <Trophy className="w-4 h-4 text-[#FFD54F] shrink-0" />
                <span className="truncate">{match.result}</span>
              </div>
              <ShareMatchButton match={match} variant="button" className="!bg-[#FFD54F]/20 hover:!bg-[#FFD54F]/30 !text-white text-xs shrink-0" />
            </div>
          )}

          {!isLive && !isCompleted && (
            <div className="mt-3 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-white/80 font-medium">
                {match.matchDate} at {match.matchTime} • {match.venue || 'Stadium'}
              </span>
              <div className="flex items-center gap-2">
                <RemindMeButton matchId={match.id} matchDate={match.matchDate} matchTime={match.matchTime} />
                <ShareMatchButton match={match} variant="button" className="!bg-white/20 hover:!bg-white/30 text-white text-xs" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E4EAE6] sticky top-15 z-30 shadow-xs">
        <div className="max-w-3xl mx-auto px-2 flex justify-between overflow-x-auto">
          {[
            { id: 'info', label: 'INFO', icon: Activity },
            { id: 'live', label: 'LIVE', icon: Play },
            { id: 'scorecard', label: 'SCORECARD', icon: FileText },
            { id: 'commentary', label: 'COMMENTARY', icon: Layers },
            { id: 'highlights', label: 'HIGHLIGHTS', icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 sm:px-4 text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-[#00C853] text-[#0B3D2E]'
                    : 'border-transparent text-[#5B6B63] hover:text-[#13201B]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00C853]' : 'text-[#8A978F]'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Highlighted Player of the Match Card */}
        {(isCompleted || match.playerOfTheMatch) && (
          <PlayerOfTheMatchCard
            match={match}
            onOpenSelector={() => setIsPotmModalOpen(true)}
            canEdit={isAdmin}
          />
        )}

        {/* TAB 1: INFO */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E4EAE6] space-y-3.5">
              <h3 className="font-black text-sm text-[#13201B] uppercase tracking-wider">
                Match Details
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#EFF3F0]">
                  <span className="text-[#8A978F] font-bold">Tournament</span>
                  <span className="font-extrabold text-[#13201B]">BTG Premier Cup 2026</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#EFF3F0]">
                  <span className="text-[#8A978F] font-bold">Venue</span>
                  <span className="font-extrabold text-[#13201B]">{match.venue}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#EFF3F0]">
                  <span className="text-[#8A978F] font-bold">Date & Time</span>
                  <span className="font-extrabold text-[#13201B]">
                    {match.matchDate} at {match.matchTime}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#EFF3F0]">
                  <span className="text-[#8A978F] font-bold">Toss</span>
                  <span className="font-extrabold text-[#0B3D2E]">
                    {match.tossWinner
                      ? `${match.tossWinner} won the toss & chose to ${match.tossDecision}`
                      : 'Toss pending'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#EFF3F0]">
                  <span className="text-[#8A978F] font-bold">Overs</span>
                  <span className="font-extrabold text-[#13201B]">{totalOvers} Overs Per Side</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#8A978F] font-bold">Status</span>
                  <span className="font-extrabold capitalize text-[#00A94D]">{match.status}</span>
                </div>
              </div>
            </div>

            {/* Squads overview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#E4EAE6]">
                <h4 className="font-extrabold text-xs text-[#0B3D2E] mb-2 flex items-center gap-1.5">
                  <InitialAvatar text={match.team1} size={24} />
                  {match.team1}
                </h4>
                <p className="text-[11px] text-[#8A978F]">Playing XI announced and ready.</p>
              </div>
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#E4EAE6]">
                <h4 className="font-extrabold text-xs text-[#0B3D2E] mb-2 flex items-center gap-1.5">
                  <InitialAvatar text={match.team2} size={24} />
                  {match.team2}
                </h4>
                <p className="text-[11px] text-[#8A978F]">Playing XI announced and ready.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            {/* Recent Balls Strip */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E4EAE6]">
              <span className="text-xs font-black text-[#5B6B63] uppercase tracking-wider block mb-2">
                Recent Deliveries
              </span>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {match.recentBalls && match.recentBalls.length > 0 ? (
                  match.recentBalls.slice(-16).map((ball, i) => (
                    <BallChip key={i} ball={ball} size={30} />
                  ))
                ) : (
                  <span className="text-xs text-[#8A978F] italic py-1">
                    No deliveries bowled yet
                  </span>
                )}
              </div>
            </div>

            {/* Current Batsmen */}
            {match.currentBatsmen && match.currentBatsmen.length > 0 && (
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#E4EAE6]">
                <span className="text-xs font-black text-[#13201B] uppercase tracking-wider block mb-3 px-1">
                  Batters on Pitch
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {match.currentBatsmen.map((b, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl border transition-all ${
                        b.isOnStrike
                          ? 'bg-[#E7F7EE] border-[#00A94D] shadow-xs'
                          : 'bg-[#EFF3F0] border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-[#13201B] truncate">
                          {b.name}
                        </span>
                        {b.isOnStrike && (
                          <span className="text-[10px] font-black text-[#00A94D] uppercase">
                            Strike ★
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-black text-[#13201B]">{b.runs}</span>
                        <span className="text-xs text-[#5B6B63]">({b.balls}b)</span>
                      </div>
                      <div className="text-[11px] text-[#8A978F] mt-1 pt-1 border-t border-black/5 flex justify-between">
                        <span>4s: {b.fours} • 6s: {b.sixes}</span>
                        <span>
                          SR: {b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(0) : '0'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Bowler */}
            {match.currentBowler && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E4EAE6]">
                <span className="text-xs font-black text-[#13201B] uppercase tracking-wider block mb-2">
                  Bowler in Action
                </span>
                <div className="flex items-center justify-between bg-[#EFF3F0] p-3 rounded-xl">
                  <div>
                    <span className="font-extrabold text-sm text-[#13201B] block">
                      {match.currentBowler.name}
                    </span>
                    <span className="text-xs text-[#5B6B63]">
                      Economy: {calculateBowlerEconomy(match.currentBowler.runs, match.currentBowler.overs)}
                    </span>
                  </div>
                  <div className="text-right font-extrabold text-sm text-[#0B3D2E]">
                    {match.currentBowler.overs} ov • {match.currentBowler.maidens}m •{' '}
                    {match.currentBowler.runs}r • {match.currentBowler.wickets}w
                  </div>
                </div>
              </div>
            )}

            {/* Live commentary teaser */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#E4EAE6]">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-black text-[#13201B] uppercase tracking-wider">
                  Live Commentary
                </span>
                <button
                  onClick={() => setActiveTab('commentary')}
                  className="text-xs font-bold text-[#00A94D] hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2">
                {commentaryFeed.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5 text-xs py-1.5 border-b border-[#EFF3F0]">
                    <BallChip ball={item.ball} size={24} />
                    <p className="text-[#13201B] leading-snug">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SCORECARD */}
        {activeTab === 'scorecard' && (
          <div className="space-y-4">
            {/* Innings selector tabs */}
            <div className="flex bg-[#EFF3F0] p-1 rounded-xl">
              <button
                onClick={() => setScorecardInnings(1)}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
                  scorecardInnings === 1
                    ? 'bg-[#0B3D2E] text-white shadow-xs'
                    : 'text-[#5B6B63] hover:text-[#13201B]'
                }`}
              >
                1st Innings ({match.firstInningsTeam || match.team1})
              </button>
              <button
                onClick={() => setScorecardInnings(2)}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
                  scorecardInnings === 2
                    ? 'bg-[#0B3D2E] text-white shadow-xs'
                    : 'text-[#5B6B63] hover:text-[#13201B]'
                }`}
              >
                2nd Innings ({match.secondInningsTeam || match.team2})
              </button>
            </div>

            {/* Innings table card */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-[#E4EAE6] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E4EAE6]">
                <h4 className="font-extrabold text-sm text-[#0B3D2E]">
                  {scorecardInnings === 1
                    ? match.firstInningsTeam || match.team1
                    : match.secondInningsTeam || match.team2}{' '}
                  Batting
                </h4>
                <span className="font-black text-sm text-[#13201B]">
                  {scorecardInnings === 1
                    ? match.firstInningsScore || match.team1Score
                    : match.secondInningsScore || match.team2Score || 'Yet to bat'}
                </span>
              </div>

              {/* Batting Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[#8A978F] font-bold border-b border-[#EFF3F0]">
                      <th className="pb-2">Batter</th>
                      <th className="pb-2 text-center">R</th>
                      <th className="pb-2 text-center">B</th>
                      <th className="pb-2 text-center">4s</th>
                      <th className="pb-2 text-center">6s</th>
                      <th className="pb-2 text-right">SR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFF3F0]">
                    {(scorecardInnings === 1
                      ? match.firstInningsBatsmen || match.currentBatsmen || []
                      : match.secondInningsBatsmen || match.currentBatsmen || []
                    ).map((b, i) => {
                      const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={i} className="hover:bg-[#F4F7F5]">
                          <td className="py-2.5 font-bold text-[#13201B]">
                            {b.name}
                            {b.howOut && (
                              <span className="block text-[10px] font-normal text-[#8A978F]">
                                {b.howOut}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-center font-black text-[#13201B]">{b.runs}</td>
                          <td className="py-2.5 text-center text-[#5B6B63]">{b.balls}</td>
                          <td className="py-2.5 text-center text-[#5B6B63]">{b.fours}</td>
                          <td className="py-2.5 text-center text-[#5B6B63]">{b.sixes}</td>
                          <td className="py-2.5 text-right font-medium text-[#0B3D2E]">{sr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bowling Table */}
              <div className="pt-3 border-t border-[#E4EAE6]">
                <h4 className="font-extrabold text-sm text-[#0B3D2E] mb-2">Bowling Figures</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[#8A978F] font-bold border-b border-[#EFF3F0]">
                        <th className="pb-2">Bowler</th>
                        <th className="pb-2 text-center">O</th>
                        <th className="pb-2 text-center">M</th>
                        <th className="pb-2 text-center">R</th>
                        <th className="pb-2 text-center">W</th>
                        <th className="pb-2 text-right">ECON</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFF3F0]">
                      {(scorecardInnings === 1
                        ? match.firstInningsBowlers || match.bowlersHistory || []
                        : match.secondInningsBowlers || match.bowlersHistory || []
                      ).map((bw, i) => (
                        <tr key={i} className="hover:bg-[#F4F7F5]">
                          <td className="py-2.5 font-bold text-[#13201B]">{bw.name}</td>
                          <td className="py-2.5 text-center text-[#5B6B63]">{bw.overs}</td>
                          <td className="py-2.5 text-center text-[#5B6B63]">{bw.maidens}</td>
                          <td className="py-2.5 text-center text-[#5B6B63]">{bw.runs}</td>
                          <td className="py-2.5 text-center font-black text-[#E53935]">{bw.wickets}</td>
                          <td className="py-2.5 text-right text-[#0B3D2E] font-medium">
                            {calculateBowlerEconomy(bw.runs, bw.overs)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COMMENTARY */}
        {activeTab === 'commentary' && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E4EAE6]">
            <h3 className="font-black text-sm text-[#13201B] uppercase tracking-wider mb-4">
              Ball-by-Ball Live Commentary
            </h3>
            <div className="space-y-3">
              {commentaryFeed.length > 0 ? (
                commentaryFeed.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F4F7F5] transition-colors border-b border-[#EFF3F0] last:border-b-0">
                    <BallChip ball={item.ball} size={28} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[#13201B] leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#8A978F] text-center py-8">
                  Commentary will stream in as balls are delivered.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: HIGHLIGHTS */}
        {activeTab === 'highlights' && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E4EAE6]">
            <h3 className="font-black text-sm text-[#13201B] uppercase tracking-wider mb-4 flex items-center gap-1.5 text-[#E53935]">
              <Flame className="w-4 h-4 text-[#FF9100]" />
              Match Highlights (Boundaries & Wickets)
            </h3>
            <div className="space-y-3">
              {highlights.length > 0 ? (
                highlights.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#EFF3F0] border border-[#E4EAE6]"
                  >
                    <div className="flex items-center gap-3">
                      <BallChip ball={h.ball} size={32} />
                      <div>
                        <span className="font-extrabold text-xs text-[#13201B] block">
                          {h.ball === '6'
                            ? 'MAXIMUM! Massive Six'
                            : h.ball === '4'
                            ? 'BOUNDARY! Classic Four'
                            : 'WICKET! Breakthrough'}
                        </span>
                        <span className="text-[11px] text-[#8A978F]">Delivery #{h.index}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#0B3D2E]">Event</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#8A978F] text-center py-8">
                  No boundaries or wickets recorded yet.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Player of the Match Selector & Citation Modal */}
      <PlayerOfTheMatchModal
        match={match}
        isOpen={isPotmModalOpen}
        onClose={() => setIsPotmModalOpen(false)}
        onSave={handleSavePotm}
        onRemove={handleRemovePotm}
      />
    </div>
  );
};
