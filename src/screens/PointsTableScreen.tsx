import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Header } from '../components/common/Header';
import { TableProperties } from 'lucide-react';

export const PointsTableScreen: React.FC = () => {
  const { tournaments, goBack } = useCricket();
  const [selectedTournId, setSelectedTournId] = useState<string>(
    tournaments[0]?.id || ''
  );

  const activeTourn =
    tournaments.find((t) => t.id === selectedTournId) || tournaments[0];

  const pointsEntries = Object.entries(activeTourn?.pointsTable || {}).map(([team, stats]) => ({
    team,
    ...stats,
  }));

  pointsEntries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.nrr - a.nrr;
  });

  return (
    <div className="min-h-screen bg-[#F4F7F5] pb-20">
      <Header title="POINTS TABLE" showBack onBack={goBack} />

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Tournament Picker */}
        {tournaments.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tournaments.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTournId(t.id)}
                className={`py-2 px-3.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  (activeTourn?.id === t.id)
                    ? 'bg-[#0B3D2E] text-white shadow-xs'
                    : 'bg-white text-[#5B6B63] border border-[#E4EAE6]'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        {/* Points Table Card */}
        {activeTourn ? (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E4EAE6]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#EFF3F0]">
              <div className="flex items-center gap-2">
                <TableProperties className="w-5 h-5 text-[#00C853]" />
                <h3 className="font-extrabold text-sm text-[#13201B]">
                  {activeTourn.name} Standings
                </h3>
              </div>
              <span className="text-xs font-bold text-[#00A94D] bg-[#E7F7EE] px-2.5 py-1 rounded-full">
                {activeTourn.status.toUpperCase()}
              </span>
            </div>

            {/* Header row with CricTheme dark background styling */}
            <div className="bg-[#06251C] text-white rounded-xl p-3 flex items-center text-xs font-extrabold mb-2">
              <span className="w-8 pl-1 text-[#B9C9C0]">#</span>
              <span className="flex-1">Team</span>
              <span className="w-10 text-center text-[#B9C9C0]">M</span>
              <span className="w-10 text-center text-[#00C853]">W</span>
              <span className="w-10 text-center text-[#E53935]">L</span>
              <span className="w-16 text-center text-[#B9C9C0]">NRR</span>
              <span className="w-12 text-right pr-1 text-[#FFB300]">PTS</span>
            </div>

            {/* Table Rows */}
            <div className="space-y-1.5">
              {pointsEntries.map((row, idx) => {
                const isQualifying = idx < 4;
                return (
                  <div
                    key={row.team}
                    className={`bg-[#F4F7F5] rounded-xl p-3 flex items-center text-xs transition-colors hover:bg-[#EFF3F0] ${
                      isQualifying ? 'border-l-4 border-l-[#00C853]' : ''
                    }`}
                  >
                    <span
                      className={`w-8 pl-1 font-black ${
                        isQualifying ? 'text-[#00A94D]' : 'text-[#8A978F]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1 font-extrabold text-[#13201B] truncate">
                      {row.team}
                    </span>
                    <span className="w-10 text-center font-medium text-[#5B6B63]">{row.played}</span>
                    <span className="w-10 text-center font-bold text-[#2E7D32]">{row.won}</span>
                    <span className="w-10 text-center font-bold text-[#E53935]">{row.lost}</span>
                    <span className="w-16 text-center font-mono text-[#5B6B63]">
                      {row.nrr > 0 ? `+${row.nrr.toFixed(2)}` : row.nrr.toFixed(2)}
                    </span>
                    <span className="w-12 text-right pr-1 font-black text-sm text-[#0B3D2E]">
                      {row.points}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-[#EFF3F0] flex items-center justify-between text-[11px] text-[#8A978F]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00C853]" />
                Top 4 Teams Qualify for Playoff Stage
              </span>
              <span>Win = 2 Pts | Tie = 1 Pt</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center text-xs text-[#8A978F]">
            No tournaments found.
          </div>
        )}
      </main>
    </div>
  );
};
