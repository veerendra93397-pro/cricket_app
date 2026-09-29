import React, { useEffect, useState } from 'react';
import { useCricket } from '../context/CricketContext';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { currentUser } = useCricket();
  const [stars, setStars] = useState<{ x: number; y: number; size: number; opacity: number }[]>([]);

  useEffect(() => {
    // Generate random stars like the Flutter SingleTickerProviderStateMixin
    const list = [];
    for (let i = 0; i < 28; i++) {
      list.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }
    setStars(list);

    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#06120E] via-[#0B3D2E] to-[#0F5238] flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Stadium lights */}
      <div className="absolute top-6 left-6 w-14 h-14 rounded-2xl bg-white shadow-[0_0_50px_18px_rgba(255,255,255,0.7),0_0_80px_30px_rgba(20,118,78,0.5)]" />
      <div className="absolute top-6 right-6 w-14 h-14 rounded-2xl bg-white shadow-[0_0_50px_18px_rgba(255,255,255,0.7),0_0_80px_30px_rgba(20,118,78,0.5)]" />

      {/* Floating starry sky */}
      {stars.map((star, idx) => (
        <div
          key={idx}
          className="absolute rounded-full bg-[#FFB300]"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            boxShadow: `0 0 ${star.size * 2}px #FFB300`,
          }}
        />
      ))}

      {/* Central Emblem */}
      <div className="relative flex flex-col items-center animate-in zoom-in-90 duration-700">
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-[#FFD54F] via-[#FFB300] to-[#FF8F00] flex flex-col items-center justify-center shadow-[0_0_70px_18px_rgba(255,179,0,0.55)] border-4 border-white/20 relative">
          {/* Cricket Bat & Ball graphic */}
          <div className="relative w-20 h-10 mb-1 flex items-center justify-center">
            {/* Ball */}
            <div className="absolute top-0 right-4 w-6 h-6 rounded-full bg-white shadow-md border-2 border-[#E53935]" />
            {/* Bat */}
            <div className="w-16 h-3 rounded-full bg-white shadow-md transform -rotate-25" />
          </div>

          <span className="text-4xl font-black text-white tracking-[3px] drop-shadow-md">
            BTG
          </span>
          <span className="text-xs font-bold text-white tracking-[4px] uppercase opacity-95">
            CRICKET
          </span>
        </div>

        {/* Loading Spinner */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-transparent border-t-[#FFB300] animate-spin" />
          <span className="text-white/80 text-xs font-bold tracking-[2px] uppercase">
            Loading Live Pitch...
          </span>
        </div>

        {/* Quick skip button */}
        <button
          onClick={onComplete}
          className="mt-6 text-white/50 hover:text-white text-xs underline cursor-pointer"
        >
          Skip intro
        </button>
      </div>
    </div>
  );
};
