import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Header } from '../components/common/Header';

export const CreateTournamentScreen: React.FC = () => {
  const { teams, createTournament, navigateTo, goBack } = useCricket();
  const [name, setName] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>(
    teams.slice(0, 4).map((t) => t.teamName)
  );
  const [overs, setOvers] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleTeam = (tName: string) => {
    if (selectedTeams.includes(tName)) {
      if (selectedTeams.length <= 2) {
        setError('At least 2 teams are required for a tournament');
        return;
      }
      setSelectedTeams(selectedTeams.filter((n) => n !== tName));
    } else {
      setError('');
      setSelectedTeams([...selectedTeams, tName]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide tournament name');
      return;
    }
    if (selectedTeams.length < 2) {
      setError('Select at least 2 teams');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createTournament(name.trim(), selectedTeams, overs);
      navigateTo('tournaments');
    } catch (err: any) {
      setError(err?.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  const totalMatches = Math.floor((selectedTeams.length * (selectedTeams.length - 1)) / 2);

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-16">
      <Header title="CREATE TOURNAMENT" showBack onBack={goBack} />

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E4EAE6]">
          <h2 className="text-lg font-black text-[#13201B] mb-1">New Cricket League</h2>
          <p className="text-xs text-[#5B6B63] mb-6">
            Creates a round-robin schedule and initializes the official points table with NRR tracking.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-[#E53935]/10 text-[#E53935] text-xs font-semibold rounded-xl border border-[#E53935]/20">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Tournament Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. BTG Super League 2026"
                className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider">
                  Participating Teams
                </label>
                <span className="text-xs text-[#00A94D] font-bold">
                  {selectedTeams.length} selected ({totalMatches} matches)
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {teams.map((t) => {
                  const isChecked = selectedTeams.includes(t.teamName);
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleTeam(t.teamName)}
                      className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-colors ${
                        isChecked
                          ? 'bg-[#E7F7EE] border-[#00A94D] text-[#0B3D2E]'
                          : 'bg-[#EFF3F0] border-transparent text-[#13201B]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="w-4 h-4 text-[#00C853] rounded"
                        />
                        <span className="text-xs font-bold">{t.teamName}</span>
                      </div>
                      {isChecked && (
                        <span className="text-[10px] font-black text-[#00A94D] uppercase">
                          Added
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Overs Per Match
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((ov) => (
                  <button
                    key={ov}
                    type="button"
                    onClick={() => setOvers(ov)}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                      overs === ov
                        ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                        : 'bg-[#EFF3F0] text-[#13201B] border-transparent'
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
              className="w-full py-3.5 bg-[#00C853] hover:bg-[#00A94D] text-white font-black rounded-xl shadow-md transition-all text-sm mt-4 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Generating Fixtures...' : 'GENERATE TOURNAMENT & FIXTURES'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
