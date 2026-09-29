import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Header } from '../components/common/Header';
import { InitialAvatar, AppCard } from '../components/common/AppWidgets';
import { Plus, Search, ChevronRight, Edit3 } from 'lucide-react';
import type { PlayerRole } from '../types';
import { PlayerPerformanceTrend } from '../components/player/PlayerPerformanceTrend';

export const PlayersScreen: React.FC = () => {
  const { players, isAdmin, navigateTo, goBack } = useCricket();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.playerName.toLowerCase().includes(search.toLowerCase()) ||
      p.teamName.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-20">
      <Header
        title="PLAYERS"
        showBack
        onBack={goBack}
        actions={
          isAdmin && (
            <button
              onClick={() => navigateTo('add-player')}
              className="p-1.5 bg-[#00C853] hover:bg-[#00A94D] text-white rounded-lg flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Player
            </button>
          )
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {/* Search & Role Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8A978F] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by player or team..."
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-[#E4EAE6] text-xs font-medium focus:ring-2 focus:ring-[#00C853] outline-none shadow-xs"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {['All', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  roleFilter === role
                    ? 'bg-[#0B3D2E] text-white shadow-xs'
                    : 'bg-white text-[#5B6B63] border border-[#E4EAE6] hover:bg-[#EFF3F0]'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Players List */}
        <div className="space-y-2.5">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <AppCard
                key={player.uid}
                onClick={() => navigateTo('player-details', { playerId: player.uid })}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <InitialAvatar text={player.playerName} size={46} />
                  <div>
                    <h3 className="font-extrabold text-sm text-[#13201B]">
                      {player.playerName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      <span className="text-[#00A94D] font-bold">{player.role}</span>
                      <span className="text-[#8A978F]">•</span>
                      <span className="text-[#5B6B63] font-medium">{player.teamName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <span className="font-black text-[#0B3D2E] block">
                      {player.totalRuns || 0} Runs
                    </span>
                    <span className="text-[11px] text-[#8A978F]">
                      {player.totalWickets || 0} Wkts
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8A978F]" />
                </div>
              </AppCard>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center text-xs text-[#8A978F] border border-[#E4EAE6]">
              No players found matching criteria.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export const PlayerDetailsScreen: React.FC = () => {
  const { players, screenParams, goBack } = useCricket();
  const playerId = screenParams?.playerId;
  const player = players.find((p) => p.uid === playerId);

  if (!player) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex flex-col">
        <Header title="PLAYER DETAILS" showBack onBack={goBack} />
        <div className="p-8 text-center text-sm text-[#8A978F]">Player not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-16">
      <Header title="PLAYER PROFILE" showBack onBack={goBack} />

      {/* Hero profile card */}
      <div className="bg-gradient-to-r from-[#06251C] to-[#14764E] text-white py-8 px-4 text-center shadow-md">
        <InitialAvatar
          text={player.playerName}
          size={76}
          className="mx-auto mb-3 shadow-lg ring-4 ring-white/20"
        />
        <h2 className="text-2xl font-black">{player.playerName}</h2>
        <p className="text-xs text-[#00C853] font-black uppercase tracking-wider mt-1">
          {player.role} • Jersey #{player.jerseyNumber || 0}
        </p>
        <span className="inline-block bg-white/15 px-3 py-1 rounded-full text-xs font-bold text-white mt-2">
          {player.teamName}
        </span>
      </div>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {/* Key Stats Grid */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E4EAE6]">
          <h3 className="font-black text-sm text-[#13201B] uppercase tracking-wider mb-4">
            Career Statistics
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#EFF3F0] p-3.5 rounded-2xl text-center">
              <span className="text-xs text-[#5B6B63] font-bold block mb-1">Total Runs</span>
              <span className="text-2xl font-black text-[#0B3D2E]">{player.totalRuns || 0}</span>
            </div>
            <div className="bg-[#EFF3F0] p-3.5 rounded-2xl text-center">
              <span className="text-xs text-[#5B6B63] font-bold block mb-1">Total Wickets</span>
              <span className="text-2xl font-black text-[#E53935]">{player.totalWickets || 0}</span>
            </div>
            <div className="bg-[#EFF3F0] p-3.5 rounded-2xl text-center">
              <span className="text-xs text-[#5B6B63] font-bold block mb-1">High Score</span>
              <span className="text-2xl font-black text-[#FFB300]">{player.highScore || 0}</span>
            </div>
            <div className="bg-[#EFF3F0] p-3.5 rounded-2xl text-center">
              <span className="text-xs text-[#5B6B63] font-bold block mb-1">Overs Bowled</span>
              <span className="text-2xl font-black text-[#13201B]">{player.oversBowled || 0}</span>
            </div>
          </div>
        </div>

        {/* Recharts Performance Trends (Batting Avg, Strike Rate, Bowling SR) */}
        <PlayerPerformanceTrend player={player} />

        {/* Bio info card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E4EAE6] space-y-3 text-xs">
          <h3 className="font-black text-sm text-[#13201B] uppercase tracking-wider mb-2">
            Personal Information
          </h3>
          <div className="flex justify-between py-2 border-b border-[#EFF3F0]">
            <span className="text-[#8A978F] font-bold">Age</span>
            <span className="font-extrabold text-[#13201B]">{player.age || 'N/A'} years</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#EFF3F0]">
            <span className="text-[#8A978F] font-bold">Email</span>
            <span className="font-extrabold text-[#13201B]">{player.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[#8A978F] font-bold">Franchise</span>
            <span className="font-extrabold text-[#0B3D2E]">{player.teamName}</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export const AddPlayerScreen: React.FC = () => {
  const { teams, addPlayer, navigateTo, goBack } = useCricket();
  const [playerName, setPlayerName] = useState('');
  const [age, setAge] = useState<number>(24);
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);
  const [role, setRole] = useState<PlayerRole>('Batsman');
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.teamName || 'BTG Warriors');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles: PlayerRole[] = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please provide player name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addPlayer({
        playerName: playerName.trim(),
        email: `${playerName.toLowerCase().replace(/\s+/g, '')}@btg.com`,
        age,
        jerseyNumber,
        role,
        teamName: selectedTeam,
        totalRuns: 0,
        totalBalls: 0,
        totalWickets: 0,
        oversBowled: 0,
      });
      navigateTo('players');
    } catch (err: any) {
      setError(err?.message || 'Failed to add player');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-16">
      <Header title="ADD NEW PLAYER" showBack onBack={goBack} />

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E4EAE6]">
          <h2 className="text-lg font-black text-[#13201B] mb-1">Register Player</h2>
          <p className="text-xs text-[#5B6B63] mb-6">
            Add a player to a franchise roster.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-[#E53935]/10 text-[#E53935] text-xs font-semibold rounded-xl border border-[#E53935]/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Player Full Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Jasprit Bumrah"
                className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none"
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
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                  Jersey #
                </label>
                <input
                  type="number"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Playing Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as PlayerRole)}
                className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1.5">
                Assign Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-4 py-3 bg-[#EFF3F0] rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#00C853] outline-none"
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
              className="w-full py-3.5 bg-[#00C853] hover:bg-[#00A94D] text-white font-black rounded-xl shadow-md transition-all text-sm mt-4 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Adding Player...' : 'ADD TO ROSTER'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export const MyProfileScreen: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    playerProfile,
    savePlayerProfile,
    updateAdminProfile,
    teams,
    tournaments,
    matches,
    players,
    signOut,
    goBack,
    navigateTo,
  } = useCricket();

  const [isEditing, setIsEditing] = useState(false);
  const [adminName, setAdminName] = useState(currentUser?.displayName || 'Tournament Admin');
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || 'admin@gmail.com');

  const [name, setName] = useState(playerProfile?.playerName || currentUser?.displayName || 'Player');
  const [age, setAge] = useState(playerProfile?.age || 26);
  const [jersey, setJersey] = useState(playerProfile?.jerseyNumber || 10);
  const [role, setRole] = useState<PlayerRole>(playerProfile?.role || 'Batsman');
  const [team, setTeam] = useState(playerProfile?.teamName || teams[0]?.teamName || 'BTG Warriors');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin) {
      await updateAdminProfile(adminName, adminEmail);
    } else {
      await savePlayerProfile({
        playerName: name,
        age: Number(age),
        jerseyNumber: Number(jersey),
        role,
        teamName: team,
      });
    }
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  if (isAdmin) {
    const currentAdminName = currentUser?.displayName || 'Tournament Admin';
    const currentAdminEmail = currentUser?.email || 'admin@gmail.com';

    return (
      <div className="min-h-screen bg-[#F4F7F5] pb-20">
        <Header
          title="ADMIN PROFILE"
          showBack
          onBack={goBack}
          actions={
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              {isEditing ? 'Cancel' : 'Edit Admin'}
            </button>
          }
        />

        <div className="bg-gradient-to-r from-[#06251C] to-[#14764E] text-white py-8 px-4 text-center shadow-md">
          <InitialAvatar
            text={currentAdminName}
            size={76}
            className="mx-auto mb-3 shadow-lg ring-4 ring-[#FFB300]"
          />
          <h2 className="text-2xl font-black">{currentAdminName}</h2>
          <p className="text-xs text-[#FFB300] font-black uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
            <span>★ TOURNAMENT ADMINISTRATOR & SCORER</span>
          </p>
          <span className="inline-block bg-white/15 px-3 py-1 rounded-full text-xs font-bold text-white mt-2">
            {currentAdminEmail}
          </span>
        </div>

        <main className="max-w-md mx-auto px-4 py-5 space-y-4">
          {savedSuccess && (
            <div className="p-3 bg-[#E7F7EE] text-[#00A94D] text-xs font-bold rounded-2xl border border-[#00A94D]/30 text-center">
              Admin profile updated successfully!
            </div>
          )}

          {isEditing ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E4EAE6]">
              <h3 className="font-black text-sm text-[#13201B] mb-4">Edit Admin Information</h3>
              <form onSubmit={handleSave} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#5B6B63] mb-1">
                    Admin Display Name
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Tournament Admin"
                    className="w-full p-2.5 rounded-xl bg-[#EFF3F0] text-xs font-bold outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5B6B63] mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@gmail.com"
                    className="w-full p-2.5 rounded-xl bg-[#EFF3F0] text-xs font-bold outline-none"
                    required
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#E4EAE6] text-xs font-bold text-[#5B6B63] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#00C853] hover:bg-[#00A94D] text-white text-xs font-bold cursor-pointer shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E4EAE6] space-y-4 text-xs">
              <h3 className="font-black text-sm text-[#13201B] uppercase tracking-wider">
                Tournament Organization Summary
              </h3>

              <div className="grid grid-cols-2 gap-2.5 text-center">
                <div className="bg-[#F4F7F5] p-3 rounded-2xl border border-[#E4EAE6]">
                  <span className="text-[11px] text-[#8A978F] font-bold block">Tournaments</span>
                  <span className="text-xl font-black text-[#0B3D2E]">{tournaments.length}</span>
                </div>
                <div className="bg-[#F4F7F5] p-3 rounded-2xl border border-[#E4EAE6]">
                  <span className="text-[11px] text-[#8A978F] font-bold block">Total Matches</span>
                  <span className="text-xl font-black text-[#0B3D2E]">{matches.length}</span>
                </div>
                <div className="bg-[#F4F7F5] p-3 rounded-2xl border border-[#E4EAE6]">
                  <span className="text-[11px] text-[#8A978F] font-bold block">Franchise Teams</span>
                  <span className="text-xl font-black text-[#0B3D2E]">{teams.length}</span>
                </div>
                <div className="bg-[#F4F7F5] p-3 rounded-2xl border border-[#E4EAE6]">
                  <span className="text-[11px] text-[#8A978F] font-bold block">Registered Players</span>
                  <span className="text-xl font-black text-[#0B3D2E]">{players.length}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#EFF3F0] space-y-2">
                <button
                  type="button"
                  onClick={() => navigateTo('create-tournament')}
                  className="w-full py-2.5 px-3 bg-[#0B3D2E] hover:bg-[#082D22] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>+ Create New Tournament</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('add-match')}
                  className="w-full py-2.5 px-3 bg-[#00C853] hover:bg-[#00A94D] text-[#0B3D2E] font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>+ Add Match Fixture</span>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={signOut}
            className="w-full py-3 bg-[#E53935]/10 hover:bg-[#E53935]/20 text-[#E53935] font-black rounded-xl text-xs transition-colors cursor-pointer"
          >
            LOG OUT FROM ADMIN ACCOUNT
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-16">
      <Header
        title="MY PROFILE"
        showBack
        onBack={goBack}
        actions={
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        }
      />

      <div className="bg-gradient-to-r from-[#06251C] to-[#14764E] text-white py-8 px-4 text-center shadow-md">
        <InitialAvatar
          text={name}
          size={76}
          className="mx-auto mb-3 shadow-lg ring-4 ring-white/20"
        />
        <h2 className="text-2xl font-black">{name}</h2>
        <p className="text-xs text-[#00C853] font-black uppercase tracking-wider mt-1">
          {role} • #{jersey}
        </p>
        <span className="inline-block bg-white/15 px-3 py-1 rounded-full text-xs font-bold text-white mt-2">
          {team}
        </span>
      </div>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {savedSuccess && (
          <div className="p-3 bg-[#E7F7EE] text-[#00A94D] text-xs font-bold rounded-2xl border border-[#00A94D]/30 text-center">
            Profile updated successfully!
          </div>
        )}

        {isEditing ? (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E4EAE6]">
            <h3 className="font-black text-sm text-[#13201B] mb-4">Edit Profile</h3>
            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#5B6B63] mb-1">Player Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#EFF3F0] text-xs font-bold outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#5B6B63] mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#EFF3F0] text-xs font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5B6B63] mb-1">Jersey #</label>
                  <input
                    type="number"
                    value={jersey}
                    onChange={(e) => setJersey(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#EFF3F0] text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B6B63] mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as PlayerRole)}
                  className="w-full p-2.5 rounded-xl bg-[#EFF3F0] text-xs font-bold outline-none"
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicket-Keeper">Wicket-Keeper</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B6B63] mb-1">Team</label>
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#EFF3F0] text-xs font-bold outline-none"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.teamName}>
                      {t.teamName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E4EAE6] text-xs font-bold text-[#5B6B63]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#00C853] hover:bg-[#00A94D] text-white text-xs font-bold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E4EAE6] space-y-3 text-xs">
            <h3 className="font-black text-sm text-[#13201B] uppercase tracking-wider mb-2">
              Profile Summary
            </h3>
            <div className="flex justify-between py-2 border-b border-[#EFF3F0]">
              <span className="text-[#8A978F] font-bold">Email</span>
              <span className="font-extrabold text-[#13201B]">{currentUser?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#EFF3F0]">
              <span className="text-[#8A978F] font-bold">Team</span>
              <span className="font-extrabold text-[#0B3D2E]">{team}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#EFF3F0]">
              <span className="text-[#8A978F] font-bold">Jersey Number</span>
              <span className="font-extrabold text-[#13201B]">#{jersey}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[#8A978F] font-bold">Role</span>
              <span className="font-extrabold text-[#00A94D]">{role}</span>
            </div>
          </div>
        )}

        <button
          onClick={signOut}
          className="w-full py-3 bg-[#E53935]/10 hover:bg-[#E53935]/20 text-[#E53935] font-black rounded-xl text-xs transition-colors cursor-pointer"
        >
          LOG OUT FROM BTG CRICKET
        </button>
      </main>
    </div>
  );
};
