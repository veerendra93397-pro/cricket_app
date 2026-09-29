import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Header } from '../components/common/Header';
import { calculateBowlerEconomy } from '../utils/cricTheme';
import { Trophy } from 'lucide-react';

export const ScorecardScreen: React.FC = () => {
  const { matches, screenParams, goBack } = useCricket();
  const matchId = screenParams?.matchId;
  const match = matches.find((m) => m.id === matchId);

  const [activeTab, setActiveTab] = useState<1 | 2>(1);

  if (!match) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex flex-col">
        <Header title="SCORECARD" showBack onBack={goBack} />
        <div className="p-8 text-center text-sm text-[#8A978F]">Match not found</div>
      </div>
    );
  }

  const inn1Team = match.firstInningsTeam || match.team1;
  const inn1Score = match.firstInningsScore || match.team1Score;
  const inn1Overs = match.firstInningsOvers || match.team1Overs;

  const inn2Team = match.secondInningsTeam || match.team2;
  const inn2Score = match.secondInningsScore || match.team2Score || 'Yet to bat';
  const inn2Overs = match.secondInningsOvers || match.team2Overs || '0.0';

  const inn1Batsmen = match.firstInningsBatsmen || match.currentBatsmen || [];
  const inn1Bowlers = match.firstInningsBowlers || match.bowlersHistory || [];

  const inn2Batsmen = match.secondInningsBatsmen || match.currentBatsmen || [];
  const inn2Bowlers = match.secondInningsBowlers || match.bowlersHistory || [];

  const displayedBatsmen = activeTab === 1 ? inn1Batsmen : inn2Batsmen;
  const displayedBowlers = activeTab === 1 ? inn1Bowlers : inn2Bowlers;
  const displayedTeam = activeTab === 1 ? inn1Team : inn2Team;
  const displayedScore = activeTab === 1 ? inn1Score : inn2Score;
  const displayedOvers = activeTab === 1 ? inn1Overs : inn2Overs;

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-16">
      <Header title="MATCH SCORECARD" showBack onBack={goBack} />

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Match Header */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E4EAE6]">
          <div className="flex items-center justify-between text-xs text-[#8A978F] mb-3">
            <span>{match.venue}</span>
            <span>{match.matchDate}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#E4EAE6]">
            <div>
              <span className="font-extrabold text-sm text-[#13201B] block">{inn1Team}</span>
              <span className="font-black text-xl text-[#0B3D2E]">{inn1Score}</span>
              <span className="text-xs text-[#8A978F] ml-1">({inn1Overs} ov)</span>
            </div>

            <span className="text-xs font-black text-[#8A978F] bg-[#EFF3F0] px-2.5 py-1 rounded-md">
              VS
            </span>

            <div className="text-right">
              <span className="font-extrabold text-sm text-[#13201B] block">{inn2Team}</span>
              <span className="font-black text-xl text-[#0B3D2E]">{inn2Score}</span>
              {inn2Overs !== '0.0' && (
                <span className="text-xs text-[#8A978F] ml-1">({inn2Overs} ov)</span>
              )}
            </div>
          </div>

          {match.result && (
            <div className="mt-3 p-2.5 bg-[#2E7D32]/10 border border-[#2E7D32]/20 rounded-xl flex items-center gap-2 text-xs font-extrabold text-[#2E7D32]">
              <Trophy className="w-4 h-4 text-[#FFB300] shrink-0" />
              <span>{match.result}</span>
            </div>
          )}
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#EFF3F0] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab(1)}
            className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${
              activeTab === 1
                ? 'bg-[#0B3D2E] text-white shadow-xs'
                : 'text-[#5B6B63] hover:text-[#13201B]'
            }`}
          >
            {inn1Team} (1st Innings)
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${
              activeTab === 2
                ? 'bg-[#0B3D2E] text-white shadow-xs'
                : 'text-[#5B6B63] hover:text-[#13201B]'
            }`}
          >
            {inn2Team} (2nd Innings)
          </button>
        </div>

        {/* Batting Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E4EAE6] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#EFF3F0]">
            <h3 className="font-black text-sm text-[#0B3D2E]">
              {displayedTeam} Batting Scorecard
            </h3>
            <span className="font-extrabold text-xs text-[#13201B]">
              Total: {displayedScore} ({displayedOvers} ov)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[#8A978F] font-extrabold border-b border-[#EFF3F0]">
                  <th className="pb-2.5">Batter</th>
                  <th className="pb-2.5 text-center">R</th>
                  <th className="pb-2.5 text-center">B</th>
                  <th className="pb-2.5 text-center">4s</th>
                  <th className="pb-2.5 text-center">6s</th>
                  <th className="pb-2.5 text-right">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFF3F0]">
                {displayedBatsmen.map((b, idx) => {
                  const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={idx} className="hover:bg-[#F4F7F5]">
                      <td className="py-2.5 font-bold text-[#13201B]">
                        {b.name}
                        {b.howOut ? (
                          <span className="block text-[10px] text-[#8A978F] font-normal">
                            {b.howOut}
                          </span>
                        ) : (
                          <span className="block text-[10px] text-[#00A94D] font-normal">
                            not out
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

          {/* Bowling Breakdown */}
          <div className="pt-4 border-t border-[#E4EAE6]">
            <h3 className="font-black text-sm text-[#0B3D2E] mb-3">Bowling Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#8A978F] font-extrabold border-b border-[#EFF3F0]">
                    <th className="pb-2">Bowler</th>
                    <th className="pb-2 text-center">O</th>
                    <th className="pb-2 text-center">M</th>
                    <th className="pb-2 text-center">R</th>
                    <th className="pb-2 text-center">W</th>
                    <th className="pb-2 text-right">ECON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFF3F0]">
                  {displayedBowlers.map((bw, idx) => (
                    <tr key={idx} className="hover:bg-[#F4F7F5]">
                      <td className="py-2.5 font-bold text-[#13201B]">{bw.name}</td>
                      <td className="py-2.5 text-center text-[#5B6B63]">{bw.overs}</td>
                      <td className="py-2.5 text-center text-[#5B6B63]">{bw.maidens}</td>
                      <td className="py-2.5 text-center text-[#5B6B63]">{bw.runs}</td>
                      <td className="py-2.5 text-center font-black text-[#E53935]">{bw.wickets}</td>
                      <td className="py-2.5 text-right font-medium text-[#0B3D2E]">
                        {calculateBowlerEconomy(bw.runs, bw.overs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
