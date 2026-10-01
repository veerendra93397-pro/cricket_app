import React, { useState } from 'react';
import type { MatchModel } from '../../types';
import { shareMatch } from '../../utils/shareUtils';
import { ShareMatchModal } from './ShareMatchModal';
import { Share2 } from 'lucide-react';

interface ShareMatchButtonProps {
  match: MatchModel;
  variant?: 'button' | 'pill' | 'icon';
  className?: string;
}

export const ShareMatchButton: React.FC<ShareMatchButtonProps> = ({
  match,
  variant = 'icon',
  className = '',
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const result = await shareMatch(match);
    if (result === 'modal') {
      setModalOpen(true);
    }
  };

  return (
    <>
      {variant === 'icon' && (
        <button
          type="button"
          onClick={handleClick}
          className={`p-1.5 text-[#8A978F] hover:text-[#00A94D] hover:bg-[#00C853]/10 rounded-xl transition-all cursor-pointer ${className}`}
          title="Share Match"
          aria-label="Share Match"
        >
          <Share2 className="w-4 h-4" />
        </button>
      )}

      {variant === 'pill' && (
        <button
          type="button"
          onClick={handleClick}
          className={`flex items-center gap-1 text-[11px] font-bold text-[#8A978F] hover:text-[#00A94D] bg-[#EFF3F0] hover:bg-[#00C853]/10 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${className}`}
          title="Share Match"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
      )}

      {variant === 'button' && (
        <button
          type="button"
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer active:scale-95 ${className}`}
          title="Share Match"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
      )}

      <ShareMatchModal
        match={match}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};
