import React, { useState } from 'react';
import { useCricket } from '../../context/CricketContext';
import { Bell, BellRing, Clock } from '../Icons';
import { formatTimeUntilMatch } from '../../utils/reminderUtils';

interface RemindMeButtonProps {
  matchId: string;
  matchDate: string;
  matchTime?: string;
  className?: string;
  compact?: boolean;
}

export const RemindMeButton: React.FC<RemindMeButtonProps> = ({
  matchId,
  matchDate,
  matchTime,
  className = '',
  compact = false,
}) => {
  const { isReminderSet, toggleReminder, triggerMatchNotification, matches } = useCricket();
  const [loading, setLoading] = useState(false);
  const active = isReminderSet(matchId);
  const countdown = formatTimeUntilMatch(matchDate, matchTime);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await toggleReminder(matchId);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const target = matches.find((m) => m.id === matchId);
    if (target) {
      triggerMatchNotification(target, 15);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        title={active ? 'Reminder is set for 15m before start. Tap to turn off.' : 'Tap to set reminder for 15m before match'}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
          active
            ? 'bg-[#00C853]/15 text-[#00873D] border border-[#00C853]/35 shadow-sm hover:bg-[#00C853]/25'
            : 'bg-[#EFF3F0] text-[#556960] hover:bg-[#E4EAE6] hover:text-[#13201B] border border-transparent'
        } ${className}`}
      >
        {active ? (
          <>
            <BellRing className="w-3.5 h-3.5 text-[#00A94D] animate-pulse shrink-0" />
            <span>Reminded (15m)</span>
          </>
        ) : (
          <>
            <Bell className="w-3.5 h-3.5 text-[#8A978F] shrink-0" />
            <span>Remind me</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        title={active ? 'Reminder active! Will notify 15m prior. Click to cancel.' : 'Remind me 15 minutes before match starts'}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
          active
            ? 'bg-[#00C853]/15 text-[#00873D] border border-[#00C853]/40 shadow-sm hover:bg-[#00C853]/25'
            : 'bg-[#EFF3F0] text-[#4A5D54] hover:bg-[#E4EAE6] hover:text-[#13201B] border border-[#E4EAE6]'
        }`}
      >
        {active ? (
          <>
            <BellRing className="w-3.5 h-3.5 text-[#00A94D] animate-pulse shrink-0" />
            <span>Reminder Set (15m)</span>
          </>
        ) : (
          <>
            <Bell className="w-3.5 h-3.5 text-[#8A978F] shrink-0" />
            <span>Remind me</span>
          </>
        )}
      </button>

      {/* Countdown hint if starts soon */}
      {countdown && (
        <span className="text-[11px] font-medium text-[#8A978F] flex items-center gap-1 truncate hidden sm:inline-flex">
          <Clock className="w-3 h-3 text-[#8A978F] shrink-0" />
          <span>{countdown}</span>
        </span>
      )}
    </div>
  );
};
