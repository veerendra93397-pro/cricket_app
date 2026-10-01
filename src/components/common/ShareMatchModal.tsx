import React, { useState } from 'react';
import type { MatchModel } from '../../types';
import { generateMatchShareData } from '../../utils/shareUtils';
import { X, Copy, Check, Share2, MessageSquare } from 'lucide-react';

interface ShareMatchModalProps {
  match: MatchModel;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareMatchModal: React.FC<ShareMatchModalProps> = ({ match, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const { title, text, url } = generateMatchShareData(match);
  const fullShareText = `${text}\n${url}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullShareText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = fullShareText;
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

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(fullShareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleTwitter = () => {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
  };

  const handleTelegram = () => {
    const encodedText = encodeURIComponent(fullShareText);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodedText}`, '_blank');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E4EAE6] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#EFF3F0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00C853]/15 text-[#00A94D] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="font-black text-sm text-[#13201B]">Share Match</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#8A978F] hover:text-[#13201B] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Match Preview Card */}
        <div className="my-4 p-3.5 bg-[#F4F7F5] rounded-2xl border border-[#E4EAE6] text-xs">
          <span className="font-extrabold text-[#0B3D2E] block">{match.team1} vs {match.team2}</span>
          {match.tournamentName && (
            <span className="text-[11px] text-[#5B6B63] block mt-0.5">{match.tournamentName}</span>
          )}
          <span className="text-[11px] text-[#00A94D] font-bold block mt-1">
            {match.status === 'live' ? '🔴 Live Now' : match.status === 'completed' ? '🏆 ' + (match.result || 'Finished') : `📅 ${match.matchDate} • ${match.matchTime || '7:30 PM'}`}
          </span>
        </div>

        {/* Share Destination Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
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

        {/* Copy Link Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
            copied
              ? 'bg-[#00C853] text-[#0B3D2E]'
              : 'bg-[#0B3D2E] hover:bg-[#06251C] text-white active:scale-98'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-[#0B3D2E] stroke-[3]" />
              <span>Link & Details Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Match Link & Scores</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
