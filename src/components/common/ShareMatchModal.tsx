import React, { useState } from 'react';
import type { MatchModel } from '../../types';
import { getMatchShareContent, copyToClipboard } from '../../utils/shareUtils';
import { X, Copy, Check, Share2, Trophy, Clock, Tv } from '../Icons';

interface ShareMatchModalProps {
  match: MatchModel;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareMatchModal: React.FC<ShareMatchModalProps> = ({
  match,
  isOpen,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const { title, text, summary, url } = getMatchShareContent(match);

  const handleCopyLink = async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyText = async () => {
    const fullMessage = `${text}\n${url}`;
    const success = await copyToClipboard(fullMessage);
    if (success) {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: `${text}\n`,
          url,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  // Social share links
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n\n' + url)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=Cricket,BTGCricket`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;

  const isLive = match.status === 'live' || match.status === 'innings_break';
  const isCompleted = match.status === 'completed';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-[#E4EAE6] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0B3D2E] text-white p-5 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="absolute right-4 top-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#00C853]/20 flex items-center justify-center text-[#00C853]">
              <Share2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-[#00C853]">
              Share Match
            </span>
          </div>

          <h3 id="share-modal-title" className="text-lg font-black mt-2 leading-snug">
            {match.team1} vs {match.team2}
          </h3>

          {/* Quick status pill */}
          <div className="mt-2 flex items-center gap-2 text-xs">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E53935] text-white font-extrabold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                LIVE • {match.team1Score} vs {match.team2Score || '0/0'}
              </span>
            ) : isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2E7D32] text-white font-extrabold text-[11px]">
                <Trophy className="w-3 h-3 text-[#FFB300]" />
                FINAL RESULT
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF9100] text-white font-extrabold text-[11px]">
                <Clock className="w-3 h-3" />
                UPCOMING • {match.matchDate}
              </span>
            )}
            <span className="text-white/75 truncate text-[11px]">
              {match.venue || 'Stadium'}
            </span>
          </div>
        </div>

        {/* Body content */}
        <div className="p-5 space-y-5">
          {/* Match Summary snippet */}
          <div className="bg-[#F4F7F5] rounded-2xl p-3.5 border border-[#E4EAE6] text-xs">
            <span className="text-[10px] font-black uppercase text-[#8A978F] block mb-1">
              {isCompleted ? 'Final Match Score' : isLive ? 'Live Status' : 'Match Preview'}
            </span>
            <p className="font-bold text-[#13201B] leading-relaxed">
              {summary}
            </p>
          </div>

          {/* Direct Link Section */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-[#5B6B63] block mb-1.5">
              Direct Match Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={url}
                className="flex-1 bg-[#F4F7F5] border border-[#E4EAE6] rounded-xl px-3 py-2 text-xs font-mono text-[#13201B] truncate focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  copiedLink
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-[#00C853] hover:bg-[#00A94D] text-[#0B3D2E]'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share on Social Media */}
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-[#5B6B63] block mb-2.5">
              Share on Social Media
            </span>
            <div className="grid grid-cols-4 gap-2">
              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#075E54] transition-all hover:scale-105 active:scale-95 text-center group cursor-pointer"
                title="Share on WhatsApp"
              >
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs mb-1">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </div>
                <span className="text-[11px] font-extrabold">WhatsApp</span>
              </a>

              {/* Twitter / X */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-black/5 hover:bg-black/10 border border-black/10 text-black transition-all hover:scale-105 active:scale-95 text-center group cursor-pointer"
                title="Share on X (Twitter)"
              >
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-xs mb-1">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-[11px] font-extrabold">X (Twitter)</span>
              </a>

              {/* Telegram */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] transition-all hover:scale-105 active:scale-95 text-center group cursor-pointer"
                title="Share on Telegram"
              >
                <div className="w-8 h-8 rounded-full bg-[#0088cc] text-white flex items-center justify-center shadow-xs mb-1">
                  <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.197 1.006.128.828.942z"/>
                  </svg>
                </div>
                <span className="text-[11px] font-extrabold">Telegram</span>
              </a>

              {/* Facebook */}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2] transition-all hover:scale-105 active:scale-95 text-center group cursor-pointer"
                title="Share on Facebook"
              >
                <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-xs mb-1">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-[11px] font-extrabold">Facebook</span>
              </a>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                copiedText
                  ? 'border-[#2E7D32] bg-[#2E7D32]/10 text-[#2E7D32]'
                  : 'border-[#E4EAE6] text-[#13201B] hover:bg-[#EFF3F0]'
              }`}
            >
              {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedText ? 'Score Copied!' : 'Copy Score Text'}</span>
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="py-2.5 px-4 rounded-xl bg-[#0B3D2E] hover:bg-[#082D22] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Share2 className="w-4 h-4" />
                <span>More</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
