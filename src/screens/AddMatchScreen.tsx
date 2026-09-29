import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Header } from '../components/common/Header';

export const AddMatchScreen: React.FC = () => {
  const { teams, addMatch, navigateTo, goBack } = useCricket();
  const [team1, setTeam1] = useState(teams[0]?.teamName || '');
  const [team2, setTeam2] = useState(teams[1]?.teamName || teams[0]?.teamName || '');
  const [venue, setVenue] = useState('Wankhede Stadium, Mumbai');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [matchTime, setMatchTime] = useState('7:30 PM');
  const [totalOvers, setTotalOvers] = useState<number>(20);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1 || !team2) {
      setError('Please select both teams');
      return;
    }
    if (team1 === team2) {
      setError('Team 1 and Team 2 must be different');
      return;
    }
    if (!venue.trim()) {
      setError('Please specify the match venue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addMatch({
        team1,
        team2,
        team1Score: '0/0',
        team2Score: '0/0',
        team1Overs: '0.0',
        team1Runs: 0,
        team1Wickets: 0,
        status: 'upcoming',
        venue: venue.trim(),
        matchDate,
        matchTime,
        totalOvers,
        inningsNumber: 1,
        currentBatsmen: [],
        currentBowler: null,
        bowlersHistory: [],
        recentBalls: [],
      });
      navigateTo('matches');
    } catch (err: any) {
      setError(err?.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-16">
      <Header title="ADD NEW MATCH" showBack onBack={goBack} />

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E4EAE6]">
          <h2 className="text-xl font-black text-[#13201B] mb-1">Schedule Fixture</h2>
          <p className="text-xs text-[#5B6B63] mb-6">
            Set up the competing teams, venue, and overs.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-[#E53935]/10 border border-[#E53935]/20 text-[#E53935] text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Team 1 (Home)
              </label>
              <select
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
                className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.teamName}>
                    {t.teamName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Team 2 (Away)
              </label>
              <select
                value={team2}
                onChange={(e) => setTeam2(e.target.value)}
                className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.teamName}>
                    {t.teamName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Venue
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Eden Gardens, Kolkata"
                className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                  Time
                </label>
                <input
                  type="text"
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  placeholder="7:30 PM"
                  className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Total Overs
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((ov) => (
                  <button
                    key={ov}
                    type="button"
                    onClick={() => setTotalOvers(ov)}
                    className={`py-2 rounded-xl text-xs font-extrabold transition-all border ${
                      totalOvers === ov
                        ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                        : 'bg-[#EFF3F0] text-[#13201B] border-transparent hover:border-[#B9C9C0]'
                    }`}
                  >
                    {ov} Overs
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#00C853] hover:bg-[#00A94D] text-white font-extrabold rounded-xl shadow-md transition-all text-sm mt-4 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating Match...' : 'SCHEDULE MATCH'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
