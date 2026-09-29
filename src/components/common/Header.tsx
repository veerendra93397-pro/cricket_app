import React, { useState } from 'react';
import { useCricket } from '../../context/CricketContext';
import {
  Menu,
  Bell,
  ShieldAlert,
  Users,
  User,
  Trophy,
  Activity,
  LogOut,
  Calendar,
  X,
  PlusCircle,
  TableProperties,
} from 'lucide-react';
import { InitialAvatar } from './AppWidgets';

export const Header: React.FC<{
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}> = ({ title = 'BTG CRICKET', showBack = false, onBack, actions }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { currentUser, isAdmin, playerProfile, navigateTo, signOut, loginAsDemo } = useCricket();

  const handleNav = (screen: string) => {
    setDrawerOpen(false);
    navigateTo(screen);
  };

  const displayName = isAdmin
    ? (currentUser?.displayName && currentUser.displayName !== 'Rohit Sharma' && currentUser.displayName !== 'Player'
        ? currentUser.displayName
        : 'Tournament Admin')
    : (currentUser?.displayName || playerProfile?.playerName || 'Player');
  const displayEmail = currentUser?.email || 'guest@btg.com';

  return (
    <>
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#06251C] to-[#0F5238] text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack ? (
              <button
                onClick={onBack}
                className="p-1.5 -ml-1 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
                aria-label="Back"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white select-none">
                {title}
              </span>
              {isAdmin && (
                <span className="bg-[#FFB300] text-[#06251C] text-[10px] font-black px-1.5 py-0.5 rounded-sm shadow-xs uppercase tracking-wide">
                  ADMIN
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {actions}

            <button
              onClick={() => handleNav('matches')}
              className="p-2 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00C853]" />
            </button>

            {currentUser ? (
              <button
                onClick={() => handleNav('profile')}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#00C853] transition-all"
                title="My Profile"
              >
                <InitialAvatar text={displayName} size={32} />
              </button>
            ) : (
              <button
                onClick={() => handleNav('auth')}
                className="text-xs font-bold bg-[#00C853] text-white px-3 py-1.5 rounded-lg hover:bg-[#00A94D] transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Slide-over Drawer Menu */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer container */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Header profile area */}
            <div className="bg-gradient-to-br from-[#06251C] via-[#0B3D2E] to-[#0F5238] p-5 text-white">
              <div className="flex items-center justify-between mb-4">
                <InitialAvatar text={displayName} size={56} className="ring-2 ring-[#FFB300]" />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h3 className="font-extrabold text-lg text-white truncate">{displayName}</h3>
              <p className="text-xs text-[#B9C9C0] truncate">{displayEmail}</p>

              {/* User Session Role Badge */}
              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-white/10">
                {isAdmin ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FFB300] text-[#06251C]">
                    ★ Tournament Administrator
                  </span>
                ) : currentUser ? (
                  <span className="text-[11px] font-medium text-white/80">
                    Verified Player Account
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleNav('auth')}
                    className="text-[11px] font-bold px-2.5 py-1 rounded bg-[#00C853] text-[#0B3D2E] hover:bg-[#00A94D] transition-colors cursor-pointer"
                  >
                    Sign In to Account
                  </button>
                )}
              </div>
            </div>

            {/* Menu items */}
            <div className="flex-1 overflow-y-auto py-2">
              <nav className="space-y-0.5 px-2">
                <button
                  onClick={() => handleNav('home')}
                  className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold text-[#13201B] hover:bg-[#EFF3F0] transition-colors"
                >
                  <Activity className="w-5 h-5 text-[#0B3D2E]" />
                  Home
                </button>

                <button
                  onClick={() => handleNav('matches')}
                  className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold text-[#13201B] hover:bg-[#EFF3F0] transition-colors"
                >
                  <Calendar className="w-5 h-5 text-[#0B3D2E]" />
                  Matches & Schedule
                </button>

                <button
                  onClick={() => handleNav('teams')}
                  className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold text-[#13201B] hover:bg-[#EFF3F0] transition-colors"
                >
                  <Users className="w-5 h-5 text-[#0B3D2E]" />
                  Teams
                </button>

                <button
                  onClick={() => handleNav('players')}
                  className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold text-[#13201B] hover:bg-[#EFF3F0] transition-colors"
                >
                  <User className="w-5 h-5 text-[#0B3D2E]" />
                  Players
                </button>

                <button
                  onClick={() => handleNav('tournaments')}
                  className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold text-[#13201B] hover:bg-[#EFF3F0] transition-colors"
                >
                  <Trophy className="w-5 h-5 text-[#FFB300]" />
                  Tournaments
                </button>

                <button
                  onClick={() => handleNav('points-table')}
                  className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold text-[#13201B] hover:bg-[#EFF3F0] transition-colors"
                >
                  <TableProperties className="w-5 h-5 text-[#0B3D2E]" />
                  Points Table
                </button>

                <button
                  onClick={() => handleNav('profile')}
                  className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold text-[#13201B] hover:bg-[#EFF3F0] transition-colors"
                >
                  <User className="w-5 h-5 text-[#0B3D2E]" />
                  My Profile
                </button>

                {isAdmin && (
                  <>
                    <div className="pt-2 pb-1 px-3">
                      <span className="text-[11px] font-bold text-[#8A978F] uppercase tracking-wider">
                        Admin Actions
                      </span>
                    </div>
                    <button
                      onClick={() => handleNav('add-match')}
                      className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#13201B] hover:bg-[#EFF3F0] transition-colors"
                    >
                      <PlusCircle className="w-5 h-5 text-[#00A94D]" />
                      Add New Match
                    </button>
                    <button
                      onClick={() => handleNav('create-tournament')}
                      className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#13201B] hover:bg-[#EFF3F0] transition-colors"
                    >
                      <Trophy className="w-5 h-5 text-[#00A94D]" />
                      Create Tournament
                    </button>
                  </>
                )}
              </nav>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#E4EAE6]">
              {currentUser ? (
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-[#E53935] hover:bg-[#E53935]/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => handleNav('auth')}
                  className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#00C853] text-white hover:bg-[#00A94D] transition-colors"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
