import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Header } from '../components/common/Header';
import type { PlayerRole } from '../types';

export const PlayerRegistrationScreen: React.FC = () => {
  const { teams, savePlayerProfile, navigateTo } = useCricket();
  const [playerName, setPlayerName] = useState('');
  const [age, setAge] = useState<number | ''>(24);
  const [jerseyNumber, setJerseyNumber] = useState<number | ''>(10);
  const [role, setRole] = useState<PlayerRole>('All-Rounder');
  const [selectedTeam, setSelectedTeam] = useState<string>(
    teams[0]?.teamName || 'BTG Warriors'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles: PlayerRole[] = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter player name');
      return;
    }
    if (!age || age < 10) {
      setError('Please enter a valid age');
      return;
    }

    setLoading(true);
    try {
      await savePlayerProfile({
        playerName: playerName.trim(),
        age: Number(age),
        jerseyNumber: Number(jerseyNumber || 0),
        role,
        teamName: selectedTeam,
      });
      navigateTo('home');
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex flex-col">
      <Header title="PLAYER REGISTRATION" />

      <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E4EAE6]">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0B3D2E] to-[#00A94D] text-white flex items-center justify-center font-black text-2xl mx-auto mb-3 shadow-md">
              🏏
            </div>
            <h2 className="text-xl font-black text-[#13201B]">Complete Your Profile</h2>
            <p className="text-xs text-[#5B6B63] mt-1">
              Join a team roster and track your match performance
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#E53935]/10 text-[#E53935] text-xs font-semibold rounded-xl border border-[#E53935]/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Virat Kohli"
                className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="24"
                  className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                  Jersey Number
                </label>
                <input
                  type="number"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="18"
                  className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Primary Playing Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      role === r
                        ? 'bg-[#0B3D2E] text-white border-[#0B3D2E] shadow-xs'
                        : 'bg-[#EFF3F0] text-[#13201B] border-transparent hover:border-[#B9C9C0]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Select Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none transition-all"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.teamName}>
                    {t.teamName}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#00C853] hover:bg-[#00A94D] text-white font-extrabold rounded-xl shadow-md transition-all text-sm mt-4 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving Profile...' : 'COMPLETE REGISTRATION'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
