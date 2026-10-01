import React from 'react';
import type { MatchModel } from '../../types';
import { InitialAvatar } from '../common/AppWidgets';
import { Trophy, Star, Sparkles, Edit, Award } from 'lucide-react';

interface PlayerOfTheMatchCardProps {
  match: MatchModel;
  onOpenSelector: () => void;
  canEdit?: boolean;
}

export const PlayerOfTheMatchCard: React.FC<PlayerOfTheMatchCardProps> = ({
  match,
  onOpenSelector,
  canEdit = false,
}) => {
  const potmName = match.playerOfTheMatchDetails?.name || match.playerOfTheMatch;
  const potmTeam = match.playerOfTheMatchDetails?.team || '';
  const potmSummary = match.playerOfTheMatchDetails?.performanceSummary || '';
  const potmCitation = match.playerOfTheMatchDetails?.citation || 'Player of the Match';

  // If no POTM is selected yet
  if (!potmName) {
    if (!canEdit) return null;

    return (
      <div className="bg-gradient-to-r from-[#1C1708] via-[#2E240B] to-[#1C1708] rounded-3xl p-4 text-white border border-[#FFB300]/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFB300]/20 text-[#FFD54F] flex items-center justify-center shrink-0 ring-2 ring-[#FFB300]/40">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#FFD54F]">
                Match Concluded
              </span>
              <Sparkles className="w-3 h-3 text-[#FFD54F]" />
            </div>
            <h4 className="font-black text-sm text-white">Player of the Match Pending</h4>
            <p className="text-[11px] text-white/70">
              Select and highlight the top match performer
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSelector}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#FFB300] to-[#FFA000] hover:from-[#FFA000] hover:to-[#FF8F00] text-[#06251C] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 shrink-0"
        >
          <Award className="w-4 h-4" />
          <span>Award POTM</span>
        </button>
      </div>
    );
  }

  // Broadcast-Grade Highlight Card
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#0B2E21] via-[#103D2E] to-[#1C1708] rounded-3xl p-4 sm:p-5 text-white border border-[#FFB300]/30 shadow-md">
      {/* Decorative ambient background flares */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#FFB300]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#00C853]/15 rounded-full blur-2xl pointer-events-none" />

      {/* Card Header Strip */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/15">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#FFB300] text-[#06251C] flex items-center justify-center shadow-xs">
            <Trophy className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-black tracking-widest uppercase text-[#FFD54F] flex items-center gap-1">
            <span>Player of the Match</span>
            <Star className="w-3 h-3 fill-current" />
          </span>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={onOpenSelector}
            className="px-2.5 py-1 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-white/20"
            title="Change Player of the Match"
          >
            <Edit className="w-3 h-3 text-[#FFD54F]" />
            <span>Change</span>
          </button>
        )}
      </div>

      {/* Performer Details Section */}
      <div className="flex items-center gap-3.5 sm:gap-4">
        <div className="relative shrink-0">
          <InitialAvatar
            text={potmName}
            size={56}
            className="ring-3 ring-[#FFB300] shadow-md"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FFB300] text-[#06251C] flex items-center justify-center shadow-xs">
            <Award className="w-3 h-3" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-black text-lg sm:text-xl text-white truncate leading-tight">
            {potmName}
          </h3>
          {potmTeam && (
            <span className="inline-block text-[11px] font-bold text-[#A5D6A7] bg-white/10 px-2 py-0.5 rounded-md mt-0.5">
              {potmTeam}
            </span>
          )}
        </div>
      </div>

      {/* Performance Figures Banner */}
      {potmSummary && (
        <div className="mt-3.5 bg-black/30 backdrop-blur-xs rounded-2xl p-2.5 sm:p-3 border border-white/10 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#FFD54F] block">
              Match Contribution
            </span>
            <span className="font-extrabold text-xs sm:text-sm text-white truncate block">
              {potmSummary}
            </span>
          </div>
          {potmCitation && (
            <span className="text-[10px] font-bold text-white/70 italic text-right shrink-0 max-w-[120px] sm:max-w-none truncate hidden sm:block">
              "{potmCitation}"
            </span>
          )}
        </div>
      )}
    </div>
  );
};
