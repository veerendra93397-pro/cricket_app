import React, { useState } from 'react';
import type { MatchModel } from '../../types';
import { Share2 } from '../Icons';
import { ShareMatchModal } from './ShareMatchModal';

interface ShareMatchButtonProps {
  match: MatchModel;
  className?: string;
  variant?: 'icon' | 'pill' | 'button';
  iconSize?: number;
}

export const ShareMatchButton: React.FC<ShareMatchButtonProps> = ({
  match,
  className = '',
  variant = 'icon',
  iconSize = 15,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      {variant === 'icon' && (
        <button
          type="button"
          onClick={handleClick}
          title="Share Match & Scores"
          aria-label={`Share ${match.team1} vs ${match.team2}`}
          className={`p-1.5 rounded-lg text-[#8A978F] hover:text-[#0B3D2E] hover:bg-[#EFF3F0] transition-colors cursor-pointer shrink-0 ${className}`}
        >
          <Share2 size={iconSize} />
        </button>
      )}

      {variant === 'pill' && (
        <button
          type="button"
          onClick={handleClick}
          title="Share Match & Scores"
          aria-label={`Share ${match.team1} vs ${match.team2}`}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-[#556960] bg-[#EFF3F0] hover:bg-[#E4EAE6] hover:text-[#13201B] transition-all cursor-pointer select-none shrink-0 ${className}`}
        >
          <Share2 size={iconSize} className="text-[#8A978F]" />
          <span>Share</span>
        </button>
      )}

      {variant === 'button' && (
        <button
          type="button"
          onClick={handleClick}
          title="Share Match & Scores"
          aria-label={`Share ${match.team1} vs ${match.team2}`}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer shrink-0 ${className}`}
        >
          <Share2 size={iconSize} />
          <span>Share Match</span>
        </button>
      )}

      {isModalOpen && (
        <ShareMatchModal
          match={match}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
