import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Header } from '../components/common/Header';
import { AppCard, InitialAvatar } from '../components/common/AppWidgets';
import {
  Trophy,
  Plus,
  Calendar,
  Award,
  ChevronRight,
  Edit,
  Trash2,
  Share2,
} from '../components/Icons';
import { EditTournamentModal, DeleteTournamentModal } from '../components/common/TournamentModals';
import { ShareTournamentModal } from '../components/tournament/ShareTournamentModal';
import type { TournamentModel } from '../types';

export const TournamentsScreen: React.FC = () => {
  const { tournaments, teams, isAdmin, navigateTo, goBack, updateTournament, deleteTournament } = useCricket();

  const [editingTournament, setEditingTournament] = useState<TournamentModel | null>(null);
  const [deleteConfirmTournament, setDeleteConfirmTournament] = useState<TournamentModel | null>(null);

  const handleSaveTournament = async (id: string, updates: Partial<TournamentModel>) => {
    await updateTournament(id, updates);
  };

  const handleDeleteTournament = async (id: string) => {
    await deleteTournament(id);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-20">
      <Header
        title="TOURNAMENTS"
        showBack
        onBack={goBack}
        actions={
          isAdmin && (
            <button
              onClick={() => navigateTo('create-tournament')}
              className="p-1.5 bg-[#00C853] hover:bg-[#00A94D] text-white rounded-lg flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Cup
            </button>
          )
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {tournaments.length > 0 ? (
          tournaments.map((t) => (
            <AppCard
              key={t.id}
              onClick={() => navigateTo('tournament-details', { tournamentId: t.id })}
              className="relative overflow-hidden hover:border-[#FFB300]/40 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FFD54F]/25 text-[#FFB300] flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-[#FF8F00]" />
                  </div>
                  <h3 className="font-extrabold text-base text-[#13201B]">{t.name}</h3>
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    t.status === 'ongoing'
                      ? 'bg-[#00C853] text-white'
                      : t.status === 'completed'
                      ? 'bg-[#2E7D32] text-white'
                      : 'bg-[#FF9100] text-white'
                  }`}
                >
                  {t.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 text-xs">
                <div className="bg-[#EFF3F0] p-2 rounded-xl text-center">
                  <span className="text-[11px] text-[#5B6B63] block">Teams</span>
                  <span className="font-black text-[#0B3D2E] text-sm">{t.teams.length}</span>
                </div>
                <div className="bg-[#EFF3F0] p-2 rounded-xl text-center">
                  <span className="text-[11px] text-[#5B6B63] block">Completed</span>
                  <span className="font-black text-[#0B3D2E] text-sm">
                    {t.completedMatches} / {t.totalMatches}
                  </span>
                </div>
                <div className="bg-[#EFF3F0] p-2 rounded-xl text-center">
                  <span className="text-[11px] text-[#5B6B63] block">Overs</span>
                  <span className="font-black text-[#0B3D2E] text-sm">{t.oversPerMatch} ov</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-[#EFF3F0] flex items-center justify-between text-xs">
                <div className="text-[#00A94D] font-bold flex items-center gap-1">
                  <span>View Standings & Fixtures</span>
                  <ChevronRight className="w-4 h-4" />
                </div>

                {/* Admin Quick Action Controls */}
                {isAdmin && (
                  <div
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTournament(t);
                      }}
                      className="px-2.5 py-1 bg-[#00C853]/15 hover:bg-[#00C853]/25 text-[#00873D] border border-[#00C853]/30 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Edit Tournament"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmTournament(t);
                      }}
                      className="p-1.5 text-[#E53935] hover:bg-[#E53935]/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete Tournament"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </AppCard>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border border-[#E4EAE6]">
            <Trophy className="w-12 h-12 text-[#FFB300] mx-auto mb-2" />
            <h4 className="font-extrabold text-[#13201B]">No tournaments currently active</h4>
            {isAdmin && (
              <button
                onClick={() => navigateTo('create-tournament')}
                className="mt-3 text-xs font-bold bg-[#00C853] text-white px-4 py-2 rounded-xl"
              >
                Create Tournament
              </button>
            )}
          </div>
        )}
      </main>

      {/* Edit Tournament Modal */}
      {editingTournament && (
        <EditTournamentModal
          tournament={editingTournament}
          allTeams={teams}
          isOpen={Boolean(editingTournament)}
          onClose={() => setEditingTournament(null)}
          onSave={handleSaveTournament}
        />
      )}

      {/* Delete Tournament Modal */}
      {deleteConfirmTournament && (
        <DeleteTournamentModal
          tournament={deleteConfirmTournament}
          isOpen={Boolean(deleteConfirmTournament)}
          onClose={() => setDeleteConfirmTournament(null)}
          onConfirm={handleDeleteTournament}
        />
      )}
    </div>
  );
};

export const TournamentDetailsScreen: React.FC = () => {
  const {
    tournaments,
    teams,
    matches,
    players,
    screenParams,
    navigateTo,
    goBack,
    isAdmin,
    updateTournament,
    deleteTournament,
  } = useCricket();

  const tournamentId = screenParams?.tournamentId;
  const tournament = tournaments.find((t) => t.id === tournamentId);

  const [activeTab, setActiveTab] = useState<'points' | 'matches' | 'runs' | 'wickets'>('points');
  const [editingTournament, setEditingTournament] = useState<TournamentModel | null>(null);
  const [deleteConfirmTournament, setDeleteConfirmTournament] = useState<TournamentModel | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex flex-col">
        <Header title="TOURNAMENT DETAILS" showBack onBack={goBack} />
        <div className="p-8 text-center text-sm text-[#8A978F]">Tournament not found</div>
      </div>
    );
  }

  const handleSaveTournament = async (id: string, updates: Partial<TournamentModel>) => {
    await updateTournament(id, updates);
  };

  const handleDeleteTournament = async (id: string) => {
    await deleteTournament(id);
    navigateTo('tournaments');
  };

  // Sorted Points Table
  const pointsEntries = Object.entries(tournament.pointsTable || {}).map(([team, stats]) => ({
    team,
    ...stats,
  }));

  pointsEntries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.nrr - a.nrr;
  });

  // Tournament matches
  const tournamentMatches = matches.filter((m) => m.tournamentId === tournament.id);

  // Tournament leaderboards
  const teamNames = tournament.teams || [];
  const tournamentPlayers = players.filter((p) => teamNames.includes(p.teamName));

  const mostRuns = [...tournamentPlayers].sort(
    (a, b) => (b.totalRuns || 0) - (a.totalRuns || 0)
  );
  const mostWickets = [...tournamentPlayers].sort(
    (a, b) => (b.totalWickets || 0) - (a.totalWickets || 0)
  );

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-16">
      <Header
        title={tournament.name.toUpperCase()}
        showBack
        onBack={goBack}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-2.5 py-1.5 bg-[#00C853] hover:bg-[#00A94D] text-[#0B3D2E] rounded-xl flex items-center gap-1.5 text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95"
              title="Share Tournament Standings"
            >
              <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Share</span>
            </button>
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setEditingTournament(tournament)}
                  className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  title="Edit Tournament Settings"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Cup</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTournament(tournament)}
                  className="px-2.5 py-1.5 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  title="Delete Tournament"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Admin Management Strip - Strictly for Authorized Tournament Administrators */}
      {isAdmin && (
        <div className="bg-[#0B3D2E] text-white border-b border-[#00C853]/30 px-4 py-2.5 shadow-inner">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFB300] animate-pulse shrink-0" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FFB300] block">
                  ★ Authorized Admin Mode
                </span>
                <span className="text-xs text-white/80 font-medium">
                  {tournament.status.toUpperCase()} • {tournament.teams.length} Teams • {tournament.oversPerMatch} Overs
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingTournament(tournament)}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-[#00C853]" />
                <span>Edit Tournament</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmTournament(tournament)}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-[#E53935]/90 hover:bg-[#E53935] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Cup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-[#E4EAE6] sticky top-15 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto px-2 flex justify-between">
          {[
            { id: 'points', label: 'POINTS' },
            { id: 'matches', label: 'MATCHES' },
            { id: 'runs', label: 'MOST RUNS' },
            { id: 'wickets', label: 'MOST WICKETS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-xs font-black text-center border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#00C853] text-[#0B3D2E]'
                  : 'border-transparent text-[#5B6B63] hover:text-[#13201B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* TAB 1: POINTS */}
        {activeTab === 'points' && (
          <div className="space-y-3">
            {/* Standings Header with Quick Share */}
            <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-[#E4EAE6] shadow-xs">
              <div>
                <h3 className="font-black text-xs sm:text-sm text-[#13201B] uppercase tracking-wider">
                  League Standings Table
                </h3>
                <span className="text-[11px] text-[#5B6B63] block">
                  Top 4 teams advance to the knockout playoffs
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="px-3 py-1.5 bg-[#00C853]/15 hover:bg-[#00C853]/25 text-[#00873D] rounded-xl flex items-center gap-1.5 text-xs font-black transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Table</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#E4EAE6] overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#8A978F] font-black border-b border-[#EFF3F0]">
                    <th className="pb-3 text-left pl-2"># Team</th>
                    <th className="pb-3 text-center">P</th>
                    <th className="pb-3 text-center">W</th>
                    <th className="pb-3 text-center">L</th>
                    <th className="pb-3 text-center">NRR</th>
                    <th className="pb-3 text-right pr-2">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFF3F0]">
                  {pointsEntries.map((row, idx) => {
                    const isQualifying = idx < 4;
                    return (
                      <tr
                        key={row.team}
                        className={`hover:bg-[#F4F7F5] ${
                          isQualifying ? 'border-l-4 border-l-[#00C853]' : ''
                        }`}
                      >
                        <td className="py-3 font-extrabold text-[#13201B] pl-2 flex items-center gap-2">
                          <span className="text-[11px] text-[#8A978F]">{idx + 1}</span>
                          <span className="truncate max-w-[130px] sm:max-w-none">{row.team}</span>
                        </td>
                        <td className="py-3 text-center text-[#5B6B63] font-medium">{row.played}</td>
                        <td className="py-3 text-center text-[#2E7D32] font-bold">{row.won}</td>
                        <td className="py-3 text-center text-[#E53935] font-bold">{row.lost}</td>
                        <td className="py-3 text-center text-[#5B6B63] font-mono">
                          {row.nrr > 0 ? `+${row.nrr.toFixed(2)}` : row.nrr.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-black text-[#0B3D2E] pr-2 text-sm">
                          {row.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-3 pt-3 border-t border-[#EFF3F0] flex items-center justify-between text-[11px] text-[#8A978F]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00C853]" />
                  Top 4 Teams Qualify for Playoffs
                </span>
                <span>2 Pts for Win</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MATCHES */}
        {activeTab === 'matches' && (
          <div className="space-y-3">
            {tournamentMatches.length > 0 ? (
              tournamentMatches.map((m) => (
                <AppCard
                  key={m.id}
                  onClick={() => navigateTo('user-live-match', { matchId: m.id })}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-[#8A978F] mb-1">
                      <span className="font-bold text-[#0B3D2E]">{m.matchDate}</span>
                      <span>•</span>
                      <span>{m.status.toUpperCase()}</span>
                    </div>
                    <h4 className="font-black text-sm text-[#13201B]">
                      {m.team1} vs {m.team2}
                    </h4>
                    {m.status !== 'upcoming' && (
                      <p className="text-xs font-bold text-[#00A94D] mt-0.5">
                        {m.result || `${m.team1Score} vs ${m.team2Score}`}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8A978F]" />
                </AppCard>
              ))
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center text-xs text-[#8A978F]">
                No fixtures scheduled for this tournament yet.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MOST RUNS */}
        {activeTab === 'runs' && (
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#E4EAE6] space-y-2">
            <h4 className="font-black text-xs text-[#13201B] uppercase tracking-wider mb-2">
              Orange Cap Leaders (Runs)
            </h4>
            {mostRuns.slice(0, 10).map((player, idx) => (
              <div
                key={player.uid}
                onClick={() => navigateTo('player-details', { playerId: player.uid })}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F7F5] transition-colors cursor-pointer border-b border-[#EFF3F0] last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="font-black text-xs text-[#8A978F] w-4">{idx + 1}</span>
                  <InitialAvatar text={player.playerName} size={36} />
                  <div>
                    <span className="font-extrabold text-xs text-[#13201B] block">
                      {player.playerName}
                    </span>
                    <span className="text-[11px] text-[#5B6B63]">{player.teamName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-[#0B3D2E] block">
                    {player.totalRuns || 0}
                  </span>
                  <span className="text-[10px] text-[#8A978F]">Runs</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: MOST WICKETS */}
        {activeTab === 'wickets' && (
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#E4EAE6] space-y-2">
            <h4 className="font-black text-xs text-[#13201B] uppercase tracking-wider mb-2">
              Purple Cap Leaders (Wickets)
            </h4>
            {mostWickets.slice(0, 10).map((player, idx) => (
              <div
                key={player.uid}
                onClick={() => navigateTo('player-details', { playerId: player.uid })}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F7F5] transition-colors cursor-pointer border-b border-[#EFF3F0] last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="font-black text-xs text-[#8A978F] w-4">{idx + 1}</span>
                  <InitialAvatar text={player.playerName} size={36} />
                  <div>
                    <span className="font-extrabold text-xs text-[#13201B] block">
                      {player.playerName}
                    </span>
                    <span className="text-[11px] text-[#5B6B63]">{player.teamName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-[#E53935] block">
                    {player.totalWickets || 0}
                  </span>
                  <span className="text-[10px] text-[#8A978F]">Wickets</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Tournament Modal */}
      {editingTournament && (
        <EditTournamentModal
          tournament={editingTournament}
          allTeams={teams}
          isOpen={Boolean(editingTournament)}
          onClose={() => setEditingTournament(null)}
          onSave={handleSaveTournament}
        />
      )}

      {/* Delete Tournament Modal */}
      {deleteConfirmTournament && (
        <DeleteTournamentModal
          tournament={deleteConfirmTournament}
          isOpen={Boolean(deleteConfirmTournament)}
          onClose={() => setDeleteConfirmTournament(null)}
          onConfirm={handleDeleteTournament}
        />
      )}

      {/* Share Tournament Standings Modal */}
      <ShareTournamentModal
        tournament={tournament}
        pointsEntries={pointsEntries}
        topBatsman={mostRuns[0]}
        topBowler={mostWickets[0]}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};
