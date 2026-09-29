import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Header } from '../components/common/Header';
import { InitialAvatar, AppCard } from '../components/common/AppWidgets';
import { Plus, Users, ChevronRight, Trophy } from 'lucide-react';

export const TeamsScreen: React.FC = () => {
  const { teams, players, isAdmin, navigateTo, goBack } = useCricket();

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-20">
      <Header
        title="TEAMS"
        showBack
        onBack={goBack}
        actions={
          isAdmin && (
            <button
              onClick={() => navigateTo('add-team')}
              className="p-1.5 bg-[#00C853] hover:bg-[#00A94D] text-white rounded-lg flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Team
            </button>
          )
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {teams.length > 0 ? (
          teams.map((team) => {
            const teamPlayers = players.filter((p) => p.teamName === team.teamName);
            const count = teamPlayers.length || team.playerCount || 0;

            return (
              <AppCard
                key={team.id}
                onClick={() => navigateTo('team-details', { teamId: team.id })}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <InitialAvatar
                    text={team.teamName}
                    size={52}
                    imageUrl={team.logoUrl}
                  />
                  <div>
                    <h3 className="font-extrabold text-base text-[#13201B]">
                      {team.teamName}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[#5B6B63] mt-0.5">
                      <span>Captain: <strong className="text-[#0B3D2E]">{team.captain || 'TBD'}</strong></span>
                      <span>•</span>
                      <span>{count} Players</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-[#8A978F]" />
              </AppCard>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border border-[#E4EAE6]">
            <Users className="w-12 h-12 text-[#8A978F] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#5B6B63]">No teams registered</p>
          </div>
        )}
      </main>
    </div>
  );
};

export const TeamDetailsScreen: React.FC = () => {
  const { teams, players, screenParams, navigateTo, goBack } = useCricket();
  const teamId = screenParams?.teamId;
  const team = teams.find((t) => t.id === teamId);

  if (!team) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex flex-col">
        <Header title="TEAM DETAILS" showBack onBack={goBack} />
        <div className="p-8 text-center text-sm text-[#8A978F]">Team not found</div>
      </div>
    );
  }

  const teamPlayers = players.filter((p) => p.teamName === team.teamName);

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-16">
      <Header title={team.teamName.toUpperCase()} showBack onBack={goBack} />

      {/* Hero header */}
      <div className="bg-gradient-to-r from-[#06251C] to-[#14764E] text-white py-8 px-4 text-center shadow-md">
        <InitialAvatar
          text={team.teamName}
          size={72}
          imageUrl={team.logoUrl}
          className="mx-auto mb-3 shadow-lg ring-4 ring-white/20"
        />
        <h2 className="text-2xl font-black">{team.teamName}</h2>
        <p className="text-xs text-white/80 mt-1">Captain: {team.captain || 'TBD'}</p>
        <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-white mt-2">
          {teamPlayers.length} Squad Members
        </span>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        <h3 className="font-black text-sm text-[#13201B] uppercase tracking-wider px-1">
          Squad Roster
        </h3>

        {teamPlayers.length > 0 ? (
          teamPlayers.map((player) => (
            <AppCard
              key={player.uid}
              onClick={() => navigateTo('player-details', { playerId: player.uid })}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <InitialAvatar text={player.playerName} size={42} />
                <div>
                  <h4 className="font-extrabold text-sm text-[#13201B]">
                    {player.playerName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#5B6B63] mt-0.5">
                    <span className="text-[#00A94D] font-bold">{player.role}</span>
                    <span>•</span>
                    <span>#{player.jerseyNumber || 0}</span>
                  </div>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="font-extrabold text-[#0B3D2E] block">
                  {player.totalRuns || 0} Runs
                </span>
                <span className="text-[#8A978F] text-[11px]">
                  {player.totalWickets || 0} Wickets
                </span>
              </div>
            </AppCard>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center text-xs text-[#8A978F] border border-[#E4EAE6]">
            No players assigned to this team yet.
          </div>
        )}
      </main>
    </div>
  );
};

export const AddTeamScreen: React.FC = () => {
  const { addTeam, navigateTo, goBack } = useCricket();
  const [teamName, setTeamName] = useState('');
  const [captain, setCaptain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setError('Please provide team name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addTeam({
        teamName: teamName.trim(),
        captain: captain.trim() || 'Captain',
        logoUrl: logoUrl.trim() || undefined,
        playerCount: 0,
      });
      navigateTo('teams');
    } catch (err: any) {
      setError(err?.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-16">
      <Header title="ADD NEW TEAM" showBack onBack={goBack} />

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E4EAE6]">
          <h2 className="text-lg font-black text-[#13201B] mb-1">Create Team</h2>
          <p className="text-xs text-[#5B6B63] mb-6">
            Add a new franchise to compete in BTG Cricket leagues.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-[#E53935]/10 text-[#E53935] text-xs font-semibold rounded-xl border border-[#E53935]/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Gujarat Titans"
                className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Captain
              </label>
              <input
                type="text"
                value={captain}
                onChange={(e) => setCaptain(e.target.value)}
                placeholder="e.g. Shubman Gill"
                className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Logo Image URL (Optional)
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#00C853] hover:bg-[#00A94D] text-white font-black rounded-xl shadow-md transition-all text-sm mt-4 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating Team...' : 'SAVE TEAM'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
