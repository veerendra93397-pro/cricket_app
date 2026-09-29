import React, { useEffect } from 'react';
import { useCricket } from '../../context/CricketContext';
import { Bell, BellRing, X, ArrowLeft, Play, Sparkles } from '../Icons';

export const ReminderNotificationToast: React.FC = () => {
  const { reminderToast, dismissReminderToast, navigateTo, notificationPermission, requestNotificationPermission } = useCricket();

  useEffect(() => {
    if (!reminderToast) return;
    const timer = setTimeout(() => {
      dismissReminderToast();
    }, 7000);
    return () => clearTimeout(timer);
  }, [reminderToast, dismissReminderToast]);

  if (!reminderToast) return null;

  return (
    <aside aria-label="Match Alerts" className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-[#0B3D2E] text-white p-4 rounded-2xl shadow-2xl border border-[#00C853]/40 flex items-start gap-3 backdrop-blur-md">
        <div className="w-10 h-10 rounded-xl bg-[#00C853]/20 flex items-center justify-center shrink-0 border border-[#00C853]/30">
          <BellRing className="w-5 h-5 text-[#00C853] animate-bounce" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#00C853] bg-[#00C853]/20 px-2 py-0.5 rounded-full">
              15m Match Alert
            </span>
          </div>
          <h4 className="font-extrabold text-sm text-white mt-1 leading-snug truncate">
            {reminderToast.title}
          </h4>
          <p className="text-xs text-[#E4EAE6]/90 mt-0.5 line-clamp-2 leading-relaxed">
            {reminderToast.body}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            {reminderToast.matchId && (
              <button
                type="button"
                onClick={() => {
                  dismissReminderToast();
                  navigateTo('user-live-match', { matchId: reminderToast.matchId });
                }}
                className="text-xs font-black bg-[#00C853] hover:bg-[#00A94D] text-[#0B3D2E] px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                View Match
              </button>
            )}

            {notificationPermission === 'default' && (
              <button
                type="button"
                onClick={async () => {
                  await requestNotificationPermission();
                }}
                className="text-xs font-bold bg-white/15 hover:bg-white/25 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Enable Desktop Alerts
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={dismissReminderToast}
          className="text-[#8A978F] hover:text-white p-1 rounded-lg transition-colors shrink-0 cursor-pointer"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
