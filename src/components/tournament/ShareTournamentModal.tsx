import React, { useState } from 'react';
import type { TournamentModel, PlayerModel } from '../../types';
import { X, Copy, Check, Share2, Trophy, Award, Users } from 'lucide-react';

interface ShareTournamentModalProps {
  tournament: TournamentModel;
  pointsEntries: Array<{
    team: string;
    played: number;
    won: number;
    lost: number;
    nrr: number;
    points: number;
  }>;
  topBatsman?: PlayerModel;
  topBowler?: PlayerModel;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareTournamentModal: React.FC<ShareTournamentModalProps> = ({
  tournament,
  pointsEntries,
  topBatsman,
  topBowler,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const url = typeof window !== 'undefined' ? window.location.href : '';

  // Generate plain-text summary suitable for messaging apps
  const generateShareSummary = () => {
    let summary = `🏆 *${tournament.name}* - League Standings\n`;
    summary += `📋 Status: ${tournament.status.toUpperCase()} | Format: ${tournament.oversPerMatch} Overs | ${tournament.teams?.length || 0} Teams\n\n`;
    summary += `📊 *Points Table Standings:*\n`;

    pointsEntries.forEach((entry, idx) => {
      const medal = idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : `${idx + 1}. `;
      const nrrFormatted = (entry.nrr > 0 ? `+${entry.nrr}` : `${entry.nrr}`);
      summary += `${medal}${entry.team}: ${entry.points} pts (P:${entry.played} W:${entry.won} NRR: ${nrrFormatted})\n`;
    });

    if (topBatsman && (topBatsman.totalRuns || 0) > 0) {
      summary += `\n🏏 *Top Run Scorer:* ${topBatsman.playerName} (${topBatsman.teamName}) - ${topBatsman.totalRuns} runs`;
    }

    if (topBowler && (topBowler.totalWickets || 0) > 0) {
      summary += `\n🎯 *Top Wicket Taker:* ${topBowler.playerName} (${topBowler.teamName}) - ${topBowler.totalWickets} wkts`;
    }

    summary += `\n\n⚡ Follow live matches, ball-by-ball updates and full standings on BTG Cricket:\n${url}`;
    return summary;
  };

  const shareText = generateShareSummary();

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `🏆 ${tournament.name} - League Standings`,
          text: shareText,
          url,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleTwitter = () => {
    const tweetText = `🏆 ${tournament.name} - League Standings\n\nCheck out the points table & live scores on BTG Cricket!`;
    const encodedText = encodeURIComponent(tweetText);
    const encodedUrl = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
  };

  const handleTelegram = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodedText}`, '_blank');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#E4EAE6] animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EFF3F0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00C853]/15 text-[#00A94D] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[#13201B]">Share Tournament Standings</h3>
              <span className="text-[11px] text-[#5B6B63] block">League summary card & link</span>
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

        {/* Visual Shareable League Summary Card */}
        <div className="my-4 bg-gradient-to-br from-[#06251C] via-[#0B3D2E] to-[#14764E] text-white rounded-2xl p-4 shadow-md border border-white/10 relative overflow-hidden">
          {/* Subtle Decorative Backdrop */}
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          {/* Card Title & Meta */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy className="w-4 h-4 text-[#FFD54F]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FFD54F]">
                  Official League Standings
                </span>
              </div>
              <h4 className="font-black text-base text-white leading-tight">
                {tournament.name}
              </h4>
            </div>
            <span className="bg-white/20 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shrink-0 uppercase">
              {tournament.status}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-white/80 mb-3 pb-2.5 border-b border-white/15">
            <span>{tournament.oversPerMatch} Overs / Match</span>
            <span>•</span>
            <span>{tournament.teams?.length || 0} Teams</span>
            <span>•</span>
            <span>{pointsEntries.length} Listed</span>
          </div>

          {/* Mini Points Table Preview */}
          <div className="space-y-1.5 mb-3">
            <div className="grid grid-cols-12 text-[10px] font-bold text-white/60 px-1 pb-1">
              <span className="col-span-1">#</span>
              <span className="col-span-5">TEAM</span>
              <span className="col-span-2 text-center">PLD</span>
              <span className="col-span-2 text-center">NRR</span>
              <span className="col-span-2 text-right">PTS</span>
            </div>

            {pointsEntries.slice(0, 5).map((entry, idx) => {
              const isLeader = idx === 0;
              return (
                <div
                  key={entry.team}
                  className={`grid grid-cols-12 items-center text-xs py-1.5 px-2 rounded-xl transition-all ${
                    isLeader
                      ? 'bg-white/15 font-black text-white ring-1 ring-[#FFD54F]/40'
                      : 'bg-black/20 text-white/90 font-medium'
                  }`}
                >
                  <span className="col-span-1 font-bold text-[11px] text-white/80">
                    {idx + 1}
                  </span>
                  <span className="col-span-5 font-bold truncate pr-1">
                    {entry.team}
                  </span>
                  <span className="col-span-2 text-center text-white/70 text-[11px]">
                    {entry.played}
                  </span>
                  <span className="col-span-2 text-center text-[10px] text-white/70">
                    {entry.nrr > 0 ? `+${entry.nrr}` : entry.nrr}
                  </span>
                  <span className={`col-span-2 text-right font-black ${isLeader ? 'text-[#FFD54F]' : 'text-white'}`}>
                    {entry.points}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Leaders summary snippet */}
          {(topBatsman || topBowler) && (
            <div className="pt-2 border-t border-white/15 grid grid-cols-2 gap-2 text-[11px]">
              {topBatsman && (topBatsman.totalRuns || 0) > 0 && (
                <div className="bg-black/20 rounded-lg p-1.5 flex items-center gap-1.5 truncate">
                  <span className="text-[#FFD54F]">🏏</span>
                  <div className="min-w-0">
                    <span className="text-[9px] text-white/60 block uppercase font-bold">Most Runs</span>
                    <span className="font-bold text-white truncate block text-[10px]">
                      {topBatsman.playerName} ({topBatsman.totalRuns})
                    </span>
                  </div>
                </div>
              )}
              {topBowler && (topBowler.totalWickets || 0) > 0 && (
                <div className="bg-black/20 rounded-lg p-1.5 flex items-center gap-1.5 truncate">
                  <span className="text-sky-300">🎯</span>
                  <div className="min-w-0">
                    <span className="text-[9px] text-white/60 block uppercase font-bold">Most Wickets</span>
                    <span className="font-bold text-white truncate block text-[10px]">
                      {topBowler.playerName} ({topBowler.totalWickets})
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-3 text-right">
            <span className="text-[9px] text-white/50 tracking-wider font-semibold">
              BTG CRICKET TOURNAMENT HUB
            </span>
          </div>
        </div>

        {/* Share Destination Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] transition-colors cursor-pointer"
          >
            <span className="text-xl mb-1">💬</span>
            <span className="text-[11px] font-black">WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleTwitter}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#E1F5FE] hover:bg-[#B3E5FC] text-[#0288D1] transition-colors cursor-pointer"
          >
            <span className="text-xl mb-1">𝕏</span>
            <span className="text-[11px] font-black">X / Twitter</span>
          </button>

          <button
            type="button"
            onClick={handleTelegram}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#EDE7F6] hover:bg-[#D1C4E9] text-[#512DA8] transition-colors cursor-pointer"
          >
            <span className="text-xl mb-1">✈️</span>
            <span className="text-[11px] font-black">Telegram</span>
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2">
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00A94D] text-[#0B3D2E] transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
              <span>Share Via Device Apps</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
              copied
                ? 'bg-[#00C853] text-[#0B3D2E]'
                : 'bg-[#0B3D2E] hover:bg-[#06251C] text-white active:scale-98'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#0B3D2E] stroke-[3]" />
                <span>Standings Summary & Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Standings Summary & Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
