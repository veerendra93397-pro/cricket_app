import React, { useState, useMemo, useEffect } from 'react';
import { useCricket } from '../context/CricketContext';
import { Header } from '../components/common/Header';
import {
  StatusPill,
  InitialAvatar,
  AppCard,
} from '../components/common/AppWidgets';
import { RemindMeButton } from '../components/common/RemindMeButton';
import { ShareMatchButton } from '../components/common/ShareMatchButton';
import {
  Calendar,
  Tv,
  CheckCircle,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Trophy,
  Search,
  X,
  Filter,
  Layers,
  RotateCcw,
} from '../components/Icons';
import type { MatchStatus } from '../types';

type FilterStatus = 'all' | 'upcoming' | 'live' | 'completed';

export const MatchesScreen: React.FC = () => {
  const { matches, teams, isAdmin, deleteMatch, navigateTo, goBack, screenParams } = useCricket();

  // Initialize status from screenParams if navigated from elsewhere
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>(() => {
    const param = screenParams?.tab || screenParams?.status;
    if (param === 'upcoming' || param === 'live' || param === 'completed' || param === 'all') {
      return param;
    }
    return 'all';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>(() => screenParams?.team || 'all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sync state if screenParams updates
  useEffect(() => {
    const param = screenParams?.tab || screenParams?.status;
    if (param === 'upcoming' || param === 'live' || param === 'completed' || param === 'all') {
      setSelectedStatus(param);
    }
    if (screenParams?.team) {
      setSelectedTeam(screenParams.team);
    }
  }, [screenParams]);

  // Status counts for badge indicators
  const counts = useMemo(() => {
    const liveCount = matches.filter((m) => m.status === 'live' || m.status === 'innings_break').length;
    const upcomingCount = matches.filter((m) => m.status === 'upcoming').length;
    const completedCount = matches.filter((m) => m.status === 'completed').length;
    return {
      all: matches.length,
      live: liveCount,
      upcoming: upcomingCount,
      completed: completedCount,
    };
  }, [matches]);

  // Unique list of all teams involved in matches
  const availableTeams = useMemo(() => {
    const teamSet = new Set<string>();
    matches.forEach((m) => {
      if (m.team1) teamSet.add(m.team1);
      if (m.team2) teamSet.add(m.team2);
    });
    // Also include any teams registered in context
    teams.forEach((t) => teamSet.add(t.name));
    return Array.from(teamSet).sort();
  }, [matches, teams]);

  // Main filtered matches computation
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // 1. Status Filter
      if (selectedStatus === 'live') {
        if (m.status !== 'live' && m.status !== 'innings_break') return false;
      } else if (selectedStatus === 'upcoming') {
        if (m.status !== 'upcoming') return false;
      } else if (selectedStatus === 'completed') {
        if (m.status !== 'completed') return false;
      }

      // 2. Team Filter
      if (selectedTeam !== 'all') {
        const matchesTeam =
          m.team1.toLowerCase() === selectedTeam.toLowerCase() ||
          m.team2.toLowerCase() === selectedTeam.toLowerCase();
        if (!matchesTeam) return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesQuery =
          m.team1.toLowerCase().includes(query) ||
          m.team2.toLowerCase().includes(query) ||
          (m.venue && m.venue.toLowerCase().includes(query)) ||
          (m.result && m.result.toLowerCase().includes(query)) ||
          m.status.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [matches, selectedStatus, selectedTeam, searchQuery]);

  const hasActiveFilters = selectedStatus !== 'all' || selectedTeam !== 'all' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedStatus('all');
    setSelectedTeam('all');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-24">
      <Header
        title="MATCHES & FIXTURES"
        showBack
        onBack={goBack}
        actions={
          isAdmin && (
            <button
              onClick={() => navigateTo('add-match')}
              className="p-1.5 bg-[#00C853] hover:bg-[#00A94D] text-white rounded-lg flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Match
            </button>
          )
        }
      />

      {/* Sticky Filter Header */}
      <div className="bg-white border-b border-[#E4EAE6] sticky top-15 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-2.5">
          {/* Main Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F4F7F5] rounded-2xl border border-[#E4EAE6]">
            {/* All Matches */}
            <button
              type="button"
              onClick={() => setSelectedStatus('all')}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedStatus === 'all'
                  ? 'bg-white text-[#0B3D2E] shadow-sm border border-[#E4EAE6]'
                  : 'text-[#5B6B63] hover:text-[#13201B] hover:bg-white/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>All</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedStatus === 'all'
                    ? 'bg-[#0B3D2E]/10 text-[#0B3D2E]'
                    : 'bg-[#E4EAE6] text-[#5B6B63]'
                }`}
              >
                {counts.all}
              </span>
            </button>

            {/* Live Matches */}
            <button
              type="button"
              onClick={() => setSelectedStatus('live')}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedStatus === 'live'
                  ? 'bg-[#E53935] text-white shadow-sm'
                  : 'text-[#5B6B63] hover:text-[#13201B] hover:bg-white/50'
              }`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                {counts.live > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    selectedStatus === 'live' ? 'bg-white' : 'bg-[#E53935]'
                  }`}
                />
              </span>
              <span>Live</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedStatus === 'live'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#E53935]/15 text-[#E53935]'
                }`}
              >
                {counts.live}
              </span>
            </button>

            {/* Upcoming Matches */}
            <button
              type="button"
              onClick={() => setSelectedStatus('upcoming')}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedStatus === 'upcoming'
                  ? 'bg-[#0B3D2E] text-white shadow-sm'
                  : 'text-[#5B6B63] hover:text-[#13201B] hover:bg-white/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Upcoming</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedStatus === 'upcoming'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#E4EAE6] text-[#5B6B63]'
                }`}
              >
                {counts.upcoming}
              </span>
            </button>

            {/* Completed Matches */}
            <button
              type="button"
              onClick={() => setSelectedStatus('completed')}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedStatus === 'completed'
                  ? 'bg-[#2E7D32] text-white shadow-sm'
                  : 'text-[#5B6B63] hover:text-[#13201B] hover:bg-white/50'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Completed</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedStatus === 'completed'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#E4EAE6] text-[#5B6B63]'
                }`}
              >
                {counts.completed}
              </span>
            </button>
          </div>

          {/* Search Bar & Team Filter Controls */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8A978F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team, venue, city..."
                className="w-full bg-[#F4F7F5] border border-[#E4EAE6] rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-[#13201B] placeholder-[#8A978F] focus:outline-hidden focus:border-[#00C853] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A978F] hover:text-[#13201B] p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Team Dropdown Filter */}
            <div className="relative shrink-0">
              <select
                aria-label="Filter matches by team"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className={`bg-[#F4F7F5] border text-xs font-bold rounded-xl px-3 py-2 text-[#13201B] focus:outline-hidden focus:border-[#00C853] cursor-pointer transition-colors ${
                  selectedTeam !== 'all'
                    ? 'border-[#00C853] bg-[#00C853]/10 text-[#00873D]'
                    : 'border-[#E4EAE6]'
                }`}
              >
                <option value="all">All Teams</option>
                {availableTeams.map((teamName) => (
                  <option key={teamName} value={teamName}>
                    {teamName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Chips & Summary */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[#8A978F] font-medium">Active:</span>

                {selectedStatus !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-[#EFF3F0] text-[#13201B] font-bold px-2 py-0.5 rounded-md border border-[#E4EAE6]">
                    Status: {selectedStatus.toUpperCase()}
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('all')}
                      className="hover:text-[#E53935] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedTeam !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-[#00C853]/15 text-[#00873D] font-bold px-2 py-0.5 rounded-md border border-[#00C853]/30">
                    Team: {selectedTeam}
                    <button
                      type="button"
                      onClick={() => setSelectedTeam('all')}
                      className="hover:text-[#E53935] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 bg-[#EFF3F0] text-[#13201B] font-bold px-2 py-0.5 rounded-md border border-[#E4EAE6]">
                    "{searchQuery}"
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-[#E53935] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-[#E53935] hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-2"
              >
                <RotateCcw className="w-3 h-3" />
                Reset all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Matches List */}
      <main className="max-w-4xl mx-auto px-4 py-4 space-y-3">
        {/* Results Count Header */}
        <div className="flex items-center justify-between text-xs text-[#8A978F] px-1">
          <span className="font-bold text-[#5B6B63]">
            {filteredMatches.length === 1
              ? 'Showing 1 match'
              : `Showing ${filteredMatches.length} matches`}
            {selectedStatus !== 'all' && ` in ${selectedStatus}`}
          </span>
          {selectedStatus === 'upcoming' && (
            <span className="text-[11px] text-[#00A94D] font-bold flex items-center gap-1">
              <span>💡 Tap "Remind me" for 15m alerts</span>
            </span>
          )}
        </div>

        {filteredMatches.length > 0 ? (
          filteredMatches.map((m) => {
            const isWinner1 = m.winner === m.team1;
            const isWinner2 = m.winner === m.team2;

            return (
              <AppCard
                key={m.id}
                onClick={() => {
                  if (m.status === 'upcoming') {
                    if (isAdmin) {
                      navigateTo('match-setup', { matchId: m.id });
                    } else {
                      navigateTo('user-live-match', { matchId: m.id });
                    }
                  } else if (m.status === 'live' || m.status === 'innings_break') {
                    if (isAdmin) {
                      navigateTo('live-scorer', { matchId: m.id });
                    } else {
                      navigateTo('user-live-match', { matchId: m.id });
                    }
                  } else {
                    navigateTo('user-live-match', { matchId: m.id });
                  }
                }}
                className="relative overflow-hidden hover:border-[#00C853]/40 transition-all cursor-pointer"
              >
                {/* Header status bar */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StatusPill
                      label={m.status === 'innings_break' ? 'INNINGS BREAK' : m.status}
                      color={
                        m.status === 'live' || m.status === 'innings_break'
                          ? '#E53935'
                          : m.status === 'completed'
                          ? '#2E7D32'
                          : '#FF9100'
                      }
                      isLive={m.status === 'live'}
                    />
                    {m.status === 'upcoming' && (
                      <RemindMeButton
                        matchId={m.id}
                        matchDate={m.matchDate}
                        matchTime={m.matchTime}
                        compact
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#8A978F]">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {m.matchTime || '7:30 PM'}
                    </span>
                    <span>•</span>
                    <span className="font-medium">{m.matchDate}</span>
                  </div>
                </div>

                {/* Match Result Banner if completed */}
                {m.status === 'completed' && m.result && (
                  <div className="mb-3 p-2.5 bg-[#2E7D32]/10 border border-[#2E7D32]/25 rounded-xl flex items-center gap-2 text-xs font-bold text-[#2E7D32]">
                    <Trophy className="w-4 h-4 text-[#FFB300] shrink-0" />
                    <span>{m.result}</span>
                  </div>
                )}

                {/* Teams VS Layout */}
                <div className="grid grid-cols-5 items-center py-2">
                  {/* Team 1 */}
                  <div className="col-span-2 flex flex-col items-center text-center">
                    <InitialAvatar text={m.team1} size={46} />
                    <span
                      className={`font-black text-sm mt-1.5 line-clamp-1 ${
                        isWinner1 ? 'text-[#2E7D32]' : 'text-[#13201B]'
                      }`}
                    >
                      {m.team1}
                    </span>
                    {m.status !== 'upcoming' && (
                      <span className="font-extrabold text-base text-[#0B3D2E] mt-0.5">
                        {m.team1Score}
                        {m.team1Overs && m.team1Overs !== '0.0' && (
                          <span className="text-xs text-[#8A978F] font-normal ml-1">
                            ({m.team1Overs})
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* VS */}
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    <span className="text-xs font-black text-[#8A978F] bg-[#EFF3F0] px-2 py-1 rounded-md">
                      VS
                    </span>
                  </div>

                  {/* Team 2 */}
                  <div className="col-span-2 flex flex-col items-center text-center">
                    <InitialAvatar text={m.team2} size={46} />
                    <span
                      className={`font-black text-sm mt-1.5 line-clamp-1 ${
                        isWinner2 ? 'text-[#2E7D32]' : 'text-[#13201B]'
                      }`}
                    >
                      {m.team2}
                    </span>
                    {m.status !== 'upcoming' && (
                      <span className="font-extrabold text-base text-[#0B3D2E] mt-0.5">
                        {m.team2Score || (m.status === 'live' ? 'Yet to bat' : '0/0')}
                        {m.team2Overs && m.team2Overs !== '0.0' && (
                          <span className="text-xs text-[#8A978F] font-normal ml-1">
                            ({m.team2Overs})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer bar */}
                <div className="mt-3 pt-2.5 border-t border-[#E4EAE6] flex items-center justify-between text-xs text-[#8A978F]">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#8A978F]" />
                    <span className="truncate">{m.venue || 'Stadium'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ShareMatchButton match={m} variant="pill" />

                    {m.status === 'upcoming' && isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo('match-setup', { matchId: m.id });
                        }}
                        className="text-xs font-bold text-[#00A94D] bg-[#00A94D]/10 hover:bg-[#00A94D]/20 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        Start Setup
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(m.id);
                        }}
                        className="p-1 text-[#E53935] hover:bg-[#E53935]/10 rounded-md transition-colors cursor-pointer"
                        title="Delete Match"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </AppCard>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border border-[#E4EAE6] shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#EFF3F0] flex items-center justify-center text-3xl mx-auto mb-3">
              🏏
            </div>
            <h3 className="font-extrabold text-[#13201B]">
              No {selectedStatus !== 'all' ? selectedStatus : ''} matches match your filter
            </h3>
            <p className="text-xs text-[#8A978F] mt-1 max-w-xs mx-auto">
              {hasActiveFilters
                ? 'Try resetting your status, team, or search filters to view more matches.'
                : 'No matches are currently scheduled in this category.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-[#0B3D2E] hover:bg-[#082D22] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-black text-lg text-[#13201B]">Delete Match?</h3>
            <p className="text-xs text-[#5B6B63] mt-2">
              Are you sure you want to delete this match record? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E4EAE6] text-xs font-bold text-[#13201B] hover:bg-[#EFF3F0] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMatch(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#E53935] hover:bg-[#D32F2F] text-xs font-bold text-white shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
