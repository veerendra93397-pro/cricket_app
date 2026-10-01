import React, { useState, useMemo } from 'react';
import type { MatchModel, PlayerModel } from '../../types';
import { useCricket } from '../../context/CricketContext';
import { InitialAvatar } from '../common/AppWidgets';
import {
  Trophy,
  Award,
  Star,
  Sparkles,
  X,
  Check,
  Search,
  Flame,
  Trash2,
} from 'lucide-react';

interface PlayerCandidate {
  name: string;
  team: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets: number;
  overs: string;
  runsConceded: number;
  maidens: number;
  summary: string;
  impactScore: number;
}

interface PlayerOfTheMatchModalProps {
  match: MatchModel;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    details: {
      name: string;
      team: string;
      performanceSummary: string;
      citation?: string;
    }
  ) => Promise<void>;
  onRemove?: () => Promise<void>;
}

export const PlayerOfTheMatchModal: React.FC<PlayerOfTheMatchModalProps> = ({
  match,
  isOpen,
  onClose,
  onSave,
  onRemove,
}) => {
  const { players } = useCricket();

  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<'all' | 'team1' | 'team2'>('all');
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>(
    match.playerOfTheMatchDetails?.name || match.playerOfTheMatch || ''
  );
  const [customSummary, setCustomSummary] = useState<string>(
    match.playerOfTheMatchDetails?.performanceSummary || ''
  );
  const [customCitation, setCustomCitation] = useState<string>(
    match.playerOfTheMatchDetails?.citation || 'Match-winning performance'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const team1 = match.firstInningsTeam || match.team1;
  const team2 = match.secondInningsTeam || match.team2;

  // Build candidate performers from match scorecard + team rosters
  const candidates = useMemo(() => {
    const candidateMap = new Map<string, PlayerCandidate>();

    const getOrCreate = (name: string, team: string): PlayerCandidate => {
      const key = name.trim();
      if (!candidateMap.has(key)) {
        candidateMap.set(key, {
          name: key,
          team,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          wickets: 0,
          overs: '0.0',
          runsConceded: 0,
          maidens: 0,
          summary: '',
          impactScore: 0,
        });
      }
      return candidateMap.get(key)!;
    };

    // 1st Innings Batsmen (Team 1)
    (match.firstInningsBatsmen || match.currentBatsmen || []).forEach((b) => {
      if (!b.name) return;
      const c = getOrCreate(b.name, team1);
      c.runs += b.runs || 0;
      c.balls += b.balls || 0;
      c.fours += b.fours || 0;
      c.sixes += b.sixes || 0;
    });

    // 1st Innings Bowlers (Team 2 bowling to Team 1)
    (match.firstInningsBowlers || match.bowlersHistory || []).forEach((bw) => {
      if (!bw.name) return;
      const c = getOrCreate(bw.name, team2);
      c.wickets += bw.wickets || 0;
      c.overs = bw.overs || '0.0';
      c.runsConceded += bw.runs || 0;
      c.maidens += bw.maidens || 0;
    });

    // 2nd Innings Batsmen (Team 2)
    (match.secondInningsBatsmen || []).forEach((b) => {
      if (!b.name) return;
      const c = getOrCreate(b.name, team2);
      c.runs += b.runs || 0;
      c.balls += b.balls || 0;
      c.fours += b.fours || 0;
      c.sixes += b.sixes || 0;
    });

    // 2nd Innings Bowlers (Team 1 bowling to Team 2)
    (match.secondInningsBowlers || []).forEach((bw) => {
      if (!bw.name) return;
      const c = getOrCreate(bw.name, team1);
      c.wickets += bw.wickets || 0;
      c.overs = bw.overs || '0.0';
      c.runsConceded += bw.runs || 0;
      c.maidens += bw.maidens || 0;
    });

    // Include players registered under team1 or team2 who might not be in the scorecard
    players.forEach((p) => {
      if (p.teamName === team1 || p.teamName === team2) {
        if (!candidateMap.has(p.playerName.trim())) {
          getOrCreate(p.playerName.trim(), p.teamName);
        }
      }
    });

    // Compute summary strings and impact scores
    const list: PlayerCandidate[] = Array.from(candidateMap.values()).map((c) => {
      const parts: string[] = [];
      if (c.runs > 0 || c.balls > 0) {
        parts.push(`${c.runs} (${c.balls}b)`);
        if (c.fours > 0 || c.sixes > 0) {
          parts.push(`[${c.fours}x4, ${c.sixes}x6]`);
        }
      }
      if (c.wickets > 0 || c.runsConceded > 0) {
        parts.push(`${c.wickets}/${c.runsConceded} (${c.overs} ov)`);
      }

      const summary = parts.length > 0 ? parts.join(' & ') : 'Team Contributor';
      const impactScore = c.runs * 1.2 + c.wickets * 25 + c.sixes * 2 + (c.runs >= 50 ? 20 : 0);

      return {
        ...c,
        summary,
        impactScore,
      };
    });

    // Sort by impact score descending
    list.sort((a, b) => b.impactScore - a.impactScore);
    return list;
  }, [match, players, team1, team2]);

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchesTeam =
        selectedTeam === 'all'
          ? true
          : selectedTeam === 'team1'
          ? c.team === team1
          : c.team === team2;
      return matchesSearch && matchesTeam;
    });
  }, [candidates, search, selectedTeam, team1, team2]);

  if (!isOpen) return null;

  const handleSelectCandidate = (candidate: PlayerCandidate) => {
    setSelectedPlayerName(candidate.name);
    setCustomSummary(candidate.summary);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerName) return;

    const chosen = candidates.find((c) => c.name === selectedPlayerName);
    const team = chosen ? chosen.team : team1;

    setIsSubmitting(true);
    try {
      await onSave(selectedPlayerName, {
        name: selectedPlayerName,
        team,
        performanceSummary: customSummary || (chosen?.summary || 'All-Round Contribution'),
        citation: customCitation || 'Player of the Match',
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    setIsSubmitting(true);
    try {
      await onRemove();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#E4EAE6] animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EFF3F0] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FFB300]/20 text-[#FFB300] flex items-center justify-center ring-2 ring-[#FFB300]/30 shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[#13201B] uppercase tracking-wider flex items-center gap-1.5">
                <span>Award Player of the Match</span>
                <Sparkles className="w-3.5 h-3.5 text-[#FFB300]" />
              </h3>
              <span className="text-[11px] text-[#5B6B63] block">
                Official post-match player recognition
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#8A978F] hover:text-[#13201B] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* Filter Pills & Search */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8A978F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search performer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#EFF3F0] pl-9 pr-3 py-2 rounded-xl text-xs font-semibold text-[#13201B] placeholder-[#8A978F] border border-transparent focus:border-[#00C853] focus:bg-white outline-hidden transition-all"
              />
            </div>

            <div className="flex gap-1.5 text-xs bg-[#EFF3F0] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedTeam('all')}
                className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer truncate ${
                  selectedTeam === 'all'
                    ? 'bg-white text-[#0B3D2E] shadow-xs'
                    : 'text-[#5B6B63] hover:text-[#13201B]'
                }`}
              >
                All Players
              </button>
              <button
                type="button"
                onClick={() => setSelectedTeam('team1')}
                className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer truncate ${
                  selectedTeam === 'team1'
                    ? 'bg-white text-[#0B3D2E] shadow-xs'
                    : 'text-[#5B6B63] hover:text-[#13201B]'
                }`}
              >
                {team1}
              </button>
              <button
                type="button"
                onClick={() => setSelectedTeam('team2')}
                className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer truncate ${
                  selectedTeam === 'team2'
                    ? 'bg-white text-[#0B3D2E] shadow-xs'
                    : 'text-[#5B6B63] hover:text-[#13201B]'
                }`}
              >
                {team2}
              </button>
            </div>
          </div>

          {/* Performers Candidate Selector List */}
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#5B6B63] block">
              Match Performers ({filteredCandidates.length})
            </span>

            {filteredCandidates.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#8A978F] bg-[#F4F7F5] rounded-2xl">
                No matching performers found
              </div>
            ) : (
              filteredCandidates.map((c, idx) => {
                const isSelected = selectedPlayerName === c.name;
                const isTopCandidate = idx === 0 && c.impactScore > 0;

                return (
                  <div
                    key={c.name}
                    onClick={() => handleSelectCandidate(c)}
                    className={`p-2.5 rounded-2xl flex items-center justify-between gap-2.5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFB300]/10 border-[#FFB300] ring-2 ring-[#FFB300]/30 shadow-xs'
                        : 'bg-white border-[#E4EAE6] hover:bg-[#F4F7F5]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <InitialAvatar
                        text={c.name}
                        size={36}
                        className={isSelected ? 'ring-2 ring-[#FFB300]' : ''}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-[#13201B] truncate">
                            {c.name}
                          </span>
                          {isTopCandidate && (
                            <span className="bg-[#FFB300]/20 text-[#855D00] text-[9px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span>Top Impact</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#5B6B63] block truncate">
                          {c.team} • {c.summary}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#FFB300] text-[#06251C] flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-[#8A978F] bg-[#EFF3F0] px-2 py-0.5 rounded-lg">
                          Select
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Performance Summary Details Card */}
          {selectedPlayerName && (
            <div className="bg-[#F4F7F5] rounded-2xl p-3.5 border border-[#E4EAE6] space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#13201B] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#FFB300]" />
                  <span>Selected: <strong>{selectedPlayerName}</strong></span>
                </span>
                <span className="text-[10px] text-[#00A94D] font-black uppercase">
                  Verified Candidate
                </span>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-[#5B6B63] block mb-1">
                  Match Performance Figures
                </label>
                <input
                  type="text"
                  placeholder="e.g. 82 runs (48 balls, 8x4, 4x6) & 1 catch"
                  value={customSummary}
                  onChange={(e) => setCustomSummary(e.target.value)}
                  className="w-full bg-white px-3 py-2 rounded-xl text-xs font-semibold text-[#13201B] border border-[#E4EAE6] focus:border-[#FFB300] outline-hidden shadow-2xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-[#5B6B63] block mb-1">
                  Award Citation / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sensational match-winning innings in final overs"
                  value={customCitation}
                  onChange={(e) => setCustomCitation(e.target.value)}
                  className="w-full bg-white px-3 py-2 rounded-xl text-xs font-semibold text-[#13201B] border border-[#E4EAE6] focus:border-[#FFB300] outline-hidden shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            {match.playerOfTheMatch && onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isSubmitting}
                className="px-3 py-2.5 rounded-xl border border-[#E53935]/40 text-[#E53935] hover:bg-[#E53935]/10 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>
            )}

            <button
              type="submit"
              disabled={!selectedPlayerName || isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FFA000] hover:from-[#FFA000] hover:to-[#FF8F00] text-[#06251C] font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
            >
              <Trophy className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Saving Award...'
                  : match.playerOfTheMatch
                  ? 'Update Player of the Match'
                  : 'Confirm Player of the Match'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
