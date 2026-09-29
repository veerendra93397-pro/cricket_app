import React from 'react';
import { CricTheme } from '../../utils/cricTheme';

export const StatusPill: React.FC<{
  label: string;
  color?: string;
  isLive?: boolean;
}> = ({ label, color, isLive }) => {
  const bgColor = color || (isLive ? CricTheme.liveRed : CricTheme.primary);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider text-white shadow-xs"
      style={{ backgroundColor: bgColor }}
    >
      {isLive && (
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
      )}
      {label.toUpperCase()}
    </span>
  );
};

export const InitialAvatar: React.FC<{
  text: string;
  size?: number;
  imageUrl?: string;
  className?: string;
}> = ({ text, size = 44, imageUrl, className = '' }) => {
  const initial = (text || 'T').trim().charAt(0).toUpperCase();

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={text}
        className={`rounded-full object-cover shadow-sm ${className}`}
        style={{ width: size, height: size }}
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  // Consistent background based on initial
  return (
    <div
      className={`rounded-full flex items-center justify-center font-black text-white shadow-sm shrink-0 bg-gradient-to-br from-[#0B3D2E] to-[#00A94D] ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.44),
      }}
    >
      {initial}
    </div>
  );
};

export const BallChip: React.FC<{
  ball: string;
  size?: number;
}> = ({ ball, size = 28 }) => {
  const bg = CricTheme.ballChipBg(ball);
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm"
      style={{
        backgroundColor: bg,
        width: size,
        height: size,
        fontSize: size <= 28 ? '11px' : '13px',
      }}
    >
      {ball}
    </div>
  );
};

export const AppCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(6,37,28,0.06)] border border-[#E4EAE6] ${
        onClick ? 'cursor-pointer hover:shadow-[0_6px_20px_rgba(6,37,28,0.1)] transition-all active:scale-[0.99]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const SectionHeader: React.FC<{
  title: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ title, actionText, onAction }) => {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <h2 className="text-[17px] font-extrabold text-[#13201B] tracking-tight">{title}</h2>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="text-xs font-bold text-[#00A94D] hover:text-[#0B3D2E] transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
