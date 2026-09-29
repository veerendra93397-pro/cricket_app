import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Header } from '../components/common/Header';
import type { MatchStatus } from '../types';

export const AdminScoreUpdateScreen: React.FC = () => {
  const { matches, updateMatch, screenParams, navigateTo, goBack } = useCricket();
  const matchId = screenParams?.matchId;
  const match = matches.find((m) => m.id === matchId);

  const [t1Runs, setT1Runs] = useState(match?.team1Runs || 0);
  const [t1Wickets, setT1Wickets] = useState(match?.team1Wickets || 0);
  const [t1Overs, setT1Overs] = useState(match?.team1Overs || '0.0');

  const [t2Runs, setT2Runs] = useState(match?.team2Runs || 0);
  const [t2Wickets, setT2Wickets] = useState(match?.team2Wickets || 0);
  const [t2Overs, setT2Overs] = useState(match?.team2Overs || '0.0');

  const [status, setStatus] = useState<MatchStatus>(match?.status || 'live');
  const [winner, setWinner] = useState(match?.winner || '');
  const [result, setResult] = useState(match?.result || '');
  const [target, setTarget] = useState(match?.target || 0);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!match) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex flex-col">
        <Header title="MANUAL OVERRIDE" showBack onBack={goBack} />
        <div className="p-8 text-center text-sm text-[#8A978F]">Match not found</div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateMatch(match.id, {
        team1Runs: Number(t1Runs),
        team1Wickets: Number(t1Wickets),
        team1Overs: t1Overs,
        team1Score: `${t1Runs}/${t1Wickets}`,
        team2Runs: Number(t2Runs),
        team2Wickets: Number(t2Wickets),
        team2Overs: t2Overs,
        team2Score: `${t2Runs}/${t2Wickets}`,
        status,
        winner,
        result,
        target: target ? Number(target) : undefined,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-20">
      <Header title="MANUAL SCORE OVERRIDE" showBack onBack={goBack} />

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E4EAE6]">
          <h2 className="text-base font-black text-[#13201B] mb-1">
            Manual Override Panel
          </h2>
          <p className="text-xs text-[#5B6B63] mb-4">
            Use this panel to adjust official records, fix discrepancies, or edit match outcome.
          </p>

          {savedSuccess && (
            <div className="mb-4 p-3 bg-[#E7F7EE] text-[#00A94D] text-xs font-bold rounded-xl border border-[#00A94D]/30">
              ✓ Match details updated successfully!
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Match Status */}
            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Match Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MatchStatus)}
                className="w-full p-3 rounded-xl bg-[#EFF3F0] text-xs font-bold text-[#13201B] outline-none"
              >
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="innings_break">Innings Break</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Team 1 Score */}
            <div className="p-3 bg-[#EFF3F0] rounded-2xl space-y-2">
              <span className="text-xs font-black text-[#0B3D2E] block">
                {match.team1} (Team 1 / 1st Batting)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#5B6B63]">Runs</label>
                  <input
                    type="number"
                    value={t1Runs}
                    onChange={(e) => setT1Runs(Number(e.target.value))}
                    className="w-full p-2 bg-white rounded-lg text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5B6B63]">Wickets</label>
                  <input
                    type="number"
                    value={t1Wickets}
                    onChange={(e) => setT1Wickets(Number(e.target.value))}
                    className="w-full p-2 bg-white rounded-lg text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5B6B63]">Overs</label>
                  <input
                    type="text"
                    value={t1Overs}
                    onChange={(e) => setT1Overs(e.target.value)}
                    className="w-full p-2 bg-white rounded-lg text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Team 2 Score */}
            <div className="p-3 bg-[#EFF3F0] rounded-2xl space-y-2">
              <span className="text-xs font-black text-[#0B3D2E] block">
                {match.team2} (Team 2 / 2nd Batting)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#5B6B63]">Runs</label>
                  <input
                    type="number"
                    value={t2Runs}
                    onChange={(e) => setT2Runs(Number(e.target.value))}
                    className="w-full p-2 bg-white rounded-lg text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5B6B63]">Wickets</label>
                  <input
                    type="number"
                    value={t2Wickets}
                    onChange={(e) => setT2Wickets(Number(e.target.value))}
                    className="w-full p-2 bg-white rounded-lg text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5B6B63]">Overs</label>
                  <input
                    type="text"
                    value={t2Overs}
                    onChange={(e) => setT2Overs(e.target.value)}
                    className="w-full p-2 bg-white rounded-lg text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Target */}
            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Target (Runs)
              </label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                placeholder="Target"
                className="w-full p-3 rounded-xl bg-[#EFF3F0] text-xs font-bold outline-none"
              />
            </div>

            {/* Outcome fields */}
            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Winner
              </label>
              <input
                type="text"
                value={winner}
                onChange={(e) => setWinner(e.target.value)}
                placeholder="e.g. BTG Warriors"
                className="w-full p-3 rounded-xl bg-[#EFF3F0] text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Result Summary
              </label>
              <input
                type="text"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="e.g. BTG Warriors won by 5 wickets"
                className="w-full p-3 rounded-xl bg-[#EFF3F0] text-xs font-bold outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#00C853] hover:bg-[#00A94D] text-white font-black rounded-xl text-xs shadow-md transition-all mt-4 cursor-pointer"
            >
              {loading ? 'Saving Changes...' : 'SAVE MATCH OVERRIDE'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
