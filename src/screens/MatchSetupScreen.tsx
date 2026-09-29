import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Header } from '../components/common/Header';
import { InitialAvatar } from '../components/common/AppWidgets';

export const MatchSetupScreen: React.FC = () => {
  const { matches, players, startMatch, screenParams, navigateTo, goBack } = useCricket();
  const matchId = screenParams?.matchId;
  const match = matches.find((m) => m.id === matchId);

  const team1Name = match?.team1 || 'Team 1';
  const team2Name = match?.team2 || 'Team 2';

  const [tossWinner, setTossWinner] = useState<string>(team1Name);
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');
  const [totalOvers, setTotalOvers] = useState<number>(match?.totalOvers || 20);
  const [selectedBatsmen, setSelectedBatsmen] = useState<string[]>([]);
  const [selectedBowler, setSelectedBowler] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Compute batting and bowling teams
  const battingTeam =
    tossDecision === 'bat'
      ? tossWinner
      : tossWinner === team1Name
      ? team2Name
      : team1Name;

  const bowlingTeam =
    battingTeam === team1Name ? team2Name : team1Name;

  // Players belonging to the batting and bowling teams
  const battingPlayers = players.filter((p) => p.teamName === battingTeam);
  const bowlingPlayers = players.filter((p) => p.teamName === bowlingTeam);

  // Fallback defaults if roster has fewer players
  const effectiveBattingPlayers =
    battingPlayers.length >= 2
      ? battingPlayers
      : [
          { uid: 'b1', playerName: `${battingTeam} Opener 1`, role: 'Batsman' as const },
          { uid: 'b2', playerName: `${battingTeam} Opener 2`, role: 'Batsman' as const },
          { uid: 'b3', playerName: `${battingTeam} Batter 3`, role: 'Batsman' as const },
        ];

  const effectiveBowlingPlayers =
    bowlingPlayers.length >= 1
      ? bowlingPlayers
      : [
          { uid: 'bw1', playerName: `${bowlingTeam} Strike Bowler`, role: 'Bowler' as const },
          { uid: 'bw2', playerName: `${bowlingTeam} Second Bowler`, role: 'Bowler' as const },
        ];

  const toggleBatsman = (name: string) => {
    if (selectedBatsmen.includes(name)) {
      setSelectedBatsmen(selectedBatsmen.filter((n) => n !== name));
    } else {
      if (selectedBatsmen.length >= 2) {
        setError('You can only select 2 opening batsmen');
        return;
      }
      setError('');
      setSelectedBatsmen([...selectedBatsmen, name]);
    }
  };

  const handleStart = async () => {
    if (!matchId) return;

    if (selectedBatsmen.length !== 2) {
      setError('Please select exactly 2 opening batsmen');
      return;
    }
    if (!selectedBowler) {
      setError('Please select an opening bowler');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await startMatch(matchId, {
        tossWinner,
        tossDecision,
        battingTeam,
        bowlingTeam,
        totalOvers,
        selectedBatsmen,
        selectedBowler,
      });
      navigateTo('live-scorer', { matchId });
    } catch (err: any) {
      setError(err?.message || 'Failed to start match');
      setLoading(false);
    }
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex flex-col">
        <Header title="MATCH SETUP" showBack onBack={goBack} />
        <div className="p-8 text-center text-sm text-[#8A978F]">Match not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-24">
      <Header title="MATCH SETUP" showBack onBack={goBack} />

      <main className="max-w-xl mx-auto px-4 py-5 space-y-5">
        {/* Match Card Info */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E4EAE6]">
          <div className="flex items-center justify-between text-xs text-[#8A978F] mb-3">
            <span>{match.venue}</span>
            <span>{match.matchDate}</span>
          </div>
          <div className="flex items-center justify-around py-2">
            <div className="flex flex-col items-center">
              <InitialAvatar text={team1Name} size={44} />
              <span className="font-extrabold text-sm text-[#13201B] mt-1.5">{team1Name}</span>
            </div>
            <span className="text-xs font-black text-[#8A978F] bg-[#EFF3F0] px-2.5 py-1 rounded-md">
              VS
            </span>
            <div className="flex flex-col items-center">
              <InitialAvatar text={team2Name} size={44} />
              <span className="font-extrabold text-sm text-[#13201B] mt-1.5">{team2Name}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[#E53935]/10 border border-[#E53935]/25 rounded-2xl text-[#E53935] text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Toss Section */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E4EAE6] space-y-4">
          <h3 className="font-extrabold text-sm text-[#13201B] uppercase tracking-wide">
            1. Toss Result
          </h3>

          <div>
            <label className="block text-xs font-bold text-[#5B6B63] mb-2">Who won the toss?</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTossWinner(team1Name)}
                className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all ${
                  tossWinner === team1Name
                    ? 'bg-[#0B3D2E] text-white border-[#0B3D2E] shadow-xs'
                    : 'bg-[#EFF3F0] text-[#13201B] border-transparent'
                }`}
              >
                {team1Name}
              </button>
              <button
                type="button"
                onClick={() => setTossWinner(team2Name)}
                className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all ${
                  tossWinner === team2Name
                    ? 'bg-[#0B3D2E] text-white border-[#0B3D2E] shadow-xs'
                    : 'bg-[#EFF3F0] text-[#13201B] border-transparent'
                }`}
              >
                {team2Name}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5B6B63] mb-2">Elected to</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTossDecision('bat')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all ${
                  tossDecision === 'bat'
                    ? 'bg-[#00C853] text-white border-[#00C853] shadow-xs'
                    : 'bg-[#EFF3F0] text-[#13201B] border-transparent'
                }`}
              >
                🏏 Bat First
              </button>
              <button
                type="button"
                onClick={() => setTossDecision('bowl')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all ${
                  tossDecision === 'bowl'
                    ? 'bg-[#00C853] text-white border-[#00C853] shadow-xs'
                    : 'bg-[#EFF3F0] text-[#13201B] border-transparent'
                }`}
              >
                ⚾ Bowl First
              </button>
            </div>
          </div>

          <div className="p-3 bg-[#E7F7EE] rounded-xl text-xs text-[#0F5238] font-semibold border border-[#00A94D]/20">
            <strong>{tossWinner}</strong> won the toss and elected to <strong>{tossDecision}</strong>.
            <br />
            Batting: <span className="underline font-bold">{battingTeam}</span> | Bowling: <span className="underline font-bold">{bowlingTeam}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5B6B63] mb-2">Match Overs</label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((ov) => (
                <button
                  key={ov}
                  type="button"
                  onClick={() => setTotalOvers(ov)}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                    totalOvers === ov
                      ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                      : 'bg-[#EFF3F0] text-[#13201B] border-transparent'
                  }`}
                >
                  {ov} Overs
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Batsmen Selection */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E4EAE6] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#13201B] uppercase tracking-wide">
              2. Select 2 Opening Batsmen
            </h3>
            <span className="text-xs font-bold text-[#00A94D]">
              {selectedBatsmen.length}/2 selected
            </span>
          </div>
          <p className="text-xs text-[#8A978F]">Team: {battingTeam}</p>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {effectiveBattingPlayers.map((p) => {
              const isSelected = selectedBatsmen.includes(p.playerName);
              return (
                <div
                  key={p.uid || p.playerName}
                  onClick={() => toggleBatsman(p.playerName)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-[#E7F7EE] border-[#00A94D] text-[#0B3D2E]'
                      : 'bg-[#EFF3F0] border-transparent hover:border-[#B9C9C0] text-[#13201B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 text-[#00C853] rounded"
                    />
                    <span className="text-xs font-bold">{p.playerName}</span>
                  </div>
                  <span className="text-[11px] text-[#8A978F]">{p.role}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bowler Selection */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E4EAE6] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#13201B] uppercase tracking-wide">
              3. Select Opening Bowler
            </h3>
            <span className="text-xs font-bold text-[#00A94D]">
              {selectedBowler ? '1 selected' : '0 selected'}
            </span>
          </div>
          <p className="text-xs text-[#8A978F]">Team: {bowlingTeam}</p>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {effectiveBowlingPlayers.map((p) => {
              const isSelected = selectedBowler === p.playerName;
              return (
                <div
                  key={p.uid || p.playerName}
                  onClick={() => setSelectedBowler(p.playerName)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-[#E7F7EE] border-[#00A94D] text-[#0B3D2E]'
                      : 'bg-[#EFF3F0] border-transparent hover:border-[#B9C9C0] text-[#13201B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 text-[#00C853]"
                    />
                    <span className="text-xs font-bold">{p.playerName}</span>
                  </div>
                  <span className="text-[11px] text-[#8A978F]">{p.role}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleStart}
          disabled={loading || selectedBatsmen.length !== 2 || !selectedBowler}
          className="w-full py-4 bg-[#00C853] hover:bg-[#00A94D] disabled:opacity-40 text-white font-black rounded-2xl shadow-lg transition-all text-sm tracking-wide cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? 'Starting Match...' : 'START LIVE MATCH & OPEN SCORER'}
        </button>
      </main>
    </div>
  );
};
