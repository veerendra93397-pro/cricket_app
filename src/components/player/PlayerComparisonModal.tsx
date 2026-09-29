import React, { useState, useMemo } from 'react';
import type { PlayerModel } from '../../types';
import { InitialAvatar } from '../common/AppWidgets';
import {
  X,
  Search,
  ArrowRightLeft,
  Trophy,
  Check,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface PlayerComparisonModalProps {
  currentPlayer: PlayerModel;
  allPlayers: PlayerModel[];
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerComparisonModal: React.FC<PlayerComparisonModalProps> = ({
  currentPlayer,
  allPlayers,
  isOpen,
  onClose,
}) => {
  // Available other players (excluding current)
  const otherPlayers = useMemo(
    () => allPlayers.filter((p) => p.uid !== currentPlayer.uid),
    [allPlayers, currentPlayer.uid]
  );

  // Selected player to compare with
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerModel | null>(() => {
    // Default to a star player from another team or first available
    return otherPlayers.find((p) => p.teamName !== currentPlayer.teamName) || otherPlayers[0] || null;
  });

  const [isSelectingPlayer, setIsSelectingPlayer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  if (!isOpen) return null;

  // Filtered players list when searching for a comparison target
  const filteredPlayers = otherPlayers.filter((p) => {
    const matchesSearch =
      p.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.teamName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate strike rates
  const p1StrikeRate =
    (currentPlayer.totalBalls || 0) > 0
      ? Number((((currentPlayer.totalRuns || 0) / (currentPlayer.totalBalls || 1)) * 100).toFixed(1))
      : 0;

  const p2StrikeRate =
    selectedPlayer && (selectedPlayer.totalBalls || 0) > 0
      ? Number((((selectedPlayer.totalRuns || 0) / (selectedPlayer.totalBalls || 1)) * 100).toFixed(1))
      : 0;

  // Comparison metrics data for Recharts
  const comparisonChartData = selectedPlayer
    ? [
        {
          metric: 'Total Runs',
          [currentPlayer.playerName]: currentPlayer.totalRuns || 0,
          [selectedPlayer.playerName]: selectedPlayer.totalRuns || 0,
        },
        {
          metric: 'High Score',
          [currentPlayer.playerName]: currentPlayer.highScore || 0,
          [selectedPlayer.playerName]: selectedPlayer.highScore || 0,
        },
        {
          metric: 'Wickets (x10)',
          [currentPlayer.playerName]: (currentPlayer.totalWickets || 0) * 10,
          [selectedPlayer.playerName]: (selectedPlayer.totalWickets || 0) * 10,
        },
        {
          metric: 'Strike Rate',
          [currentPlayer.playerName]: Math.min(p1StrikeRate, 200),
          [selectedPlayer.playerName]: Math.min(p2StrikeRate, 200),
        },
      ]
    : [];

  const handleSelectOpponent = (player: PlayerModel) => {
    setSelectedPlayer(player);
    setIsSelectingPlayer(false);
  };

  const handleSwapPlayers = () => {
    // Allows swapping perspective
    if (selectedPlayer) {
      // Just toggle visually if needed
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E4EAE6] animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0B3D2E] text-white px-5 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-[#00C853]">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base tracking-wide">PLAYER HEAD-TO-HEAD</h2>
              <span className="text-[11px] text-white/70 block">Side-by-side performance comparison</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* PLAYER SELECTION DRAWER / VIEW */}
          {isSelectingPlayer ? (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#13201B] uppercase tracking-wider">
                  Select Player to Compare With {currentPlayer.playerName}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSelectingPlayer(false)}
                  className="text-xs font-bold text-[#8A978F] hover:text-[#13201B] cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search player or team name..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#EFF3F0] rounded-xl text-xs font-medium focus:bg-white focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 outline-none"
                />
                <Search className="w-4 h-4 text-[#8A978F] absolute left-3 top-3" />
              </div>

              {/* Role filter pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                {['All', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      roleFilter === role
                        ? 'bg-[#0B3D2E] text-white'
                        : 'bg-[#EFF3F0] text-[#5B6B63] hover:text-[#13201B]'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {/* Players Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-1">
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map((p) => (
                    <button
                      key={p.uid}
                      type="button"
                      onClick={() => handleSelectOpponent(p)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedPlayer?.uid === p.uid
                          ? 'border-[#00C853] bg-[#00C853]/10 ring-2 ring-[#00C853]/20'
                          : 'border-[#E4EAE6] bg-[#F4F7F5] hover:bg-white hover:border-[#00C853]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <InitialAvatar text={p.playerName} size={36} />
                        <div className="min-w-0">
                          <span className="font-extrabold text-xs text-[#13201B] truncate block">
                            {p.playerName}
                          </span>
                          <span className="text-[10px] text-[#5B6B63] block truncate">
                            {p.teamName} • {p.role}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-[#00A94D] shrink-0">
                        {p.totalRuns || 0}r
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center text-xs text-[#8A978F]">
                    No players found matching your search.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* HEAD-TO-HEAD BANNERS (PLAYER 1 VS PLAYER 2) */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 relative">
                {/* VS Badge in Center */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#13201B] border-2 border-white text-white flex items-center justify-center font-black text-[11px] shadow-lg">
                  VS
                </div>

                {/* Player 1 Card */}
                <div className="bg-gradient-to-br from-[#06251C] to-[#0B3D2E] text-white p-3.5 sm:p-4 rounded-2xl relative shadow-md">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#00C853] block mb-2">
                    Current Player
                  </span>
                  <div className="flex items-center gap-2.5">
                    <InitialAvatar text={currentPlayer.playerName} size={44} className="ring-2 ring-white/20" />
                    <div className="min-w-0">
                      <h4 className="font-black text-sm truncate">{currentPlayer.playerName}</h4>
                      <p className="text-[11px] text-white/80 truncate">{currentPlayer.teamName}</p>
                      <span className="text-[10px] text-[#00C853] font-bold block">{currentPlayer.role}</span>
                    </div>
                  </div>
                </div>

                {/* Player 2 Card */}
                {selectedPlayer ? (
                  <div className="bg-gradient-to-br from-[#1A2634] to-[#2C3E50] text-white p-3.5 sm:p-4 rounded-2xl relative shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#38BDF8] block">
                        Comparing With
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSelectingPlayer(true)}
                        className="text-[10px] font-bold text-sky-300 hover:text-white underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <InitialAvatar text={selectedPlayer.playerName} size={44} className="ring-2 ring-white/20" />
                      <div className="min-w-0">
                        <h4 className="font-black text-sm truncate">{selectedPlayer.playerName}</h4>
                        <p className="text-[11px] text-white/80 truncate">{selectedPlayer.teamName}</p>
                        <span className="text-[10px] text-sky-400 font-bold block">{selectedPlayer.role}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsSelectingPlayer(true)}
                    className="border-2 border-dashed border-[#B9C9C0] rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#00C853] transition-colors"
                  >
                    <UserCheck className="w-6 h-6 text-[#8A978F] mb-1" />
                    <span className="text-xs font-bold text-[#13201B]">Select Opponent</span>
                    <span className="text-[10px] text-[#8A978F]">Click to pick a player</span>
                  </div>
                )}
              </div>

              {selectedPlayer && (
                <>
                  {/* STATS COMPARISON TABLE */}
                  <div className="bg-[#F4F7F5] rounded-3xl p-4 border border-[#E4EAE6] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E4EAE6]">
                      <span className="text-xs font-black text-[#13201B] uppercase tracking-wider">
                        Performance Metrics
                      </span>
                      <span className="text-[10px] font-bold text-[#00A94D] bg-[#00C853]/15 px-2 py-0.5 rounded-full">
                        Leader Highlighted
                      </span>
                    </div>

                    {/* Comparison Row Helper */}
                    <div className="space-y-1.5 text-xs">
                      {/* Metric 1: Total Runs */}
                      <ComparisonRow
                        label="Total Runs"
                        val1={currentPlayer.totalRuns || 0}
                        val2={selectedPlayer.totalRuns || 0}
                        suffix="runs"
                        formatValue={(v) => v.toLocaleString()}
                      />

                      {/* Metric 2: High Score */}
                      <ComparisonRow
                        label="Highest Score"
                        val1={currentPlayer.highScore || 0}
                        val2={selectedPlayer.highScore || 0}
                        suffix="runs"
                      />

                      {/* Metric 3: Strike Rate */}
                      <ComparisonRow
                        label="Batting Strike Rate"
                        val1={p1StrikeRate}
                        val2={p2StrikeRate}
                        suffix="SR"
                        formatValue={(v) => `${v}%`}
                      />

                      {/* Metric 4: Balls Faced */}
                      <ComparisonRow
                        label="Balls Faced"
                        val1={currentPlayer.totalBalls || 0}
                        val2={selectedPlayer.totalBalls || 0}
                        suffix="balls"
                      />

                      {/* Metric 5: Total Wickets */}
                      <ComparisonRow
                        label="Total Wickets"
                        val1={currentPlayer.totalWickets || 0}
                        val2={selectedPlayer.totalWickets || 0}
                        suffix="wkts"
                      />

                      {/* Metric 6: Overs Bowled */}
                      <ComparisonRow
                        label="Overs Bowled"
                        val1={currentPlayer.oversBowled || 0}
                        val2={selectedPlayer.oversBowled || 0}
                        suffix="overs"
                      />

                      {/* Metric 7: Age */}
                      <ComparisonRow
                        label="Player Age"
                        val1={currentPlayer.age || 24}
                        val2={selectedPlayer.age || 24}
                        suffix="yrs"
                        invertLeader // Younger is often highlighted or neutral
                      />
                    </div>
                  </div>

                  {/* RECHARTS COMPARISON CHART */}
                  <div className="bg-white rounded-3xl p-4 border border-[#E4EAE6] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#13201B]">
                      <Trophy className="w-4 h-4 text-[#FFB300]" />
                      <span>Visual Benchmark Comparison</span>
                    </div>

                    <div className="w-full h-56 pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={comparisonChartData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFF3F0" />
                          <XAxis
                            dataKey="metric"
                            tickLine={false}
                            stroke="#8A978F"
                            fontSize={11}
                            fontWeight={600}
                          />
                          <YAxis
                            tickLine={false}
                            stroke="#8A978F"
                            fontSize={11}
                            fontWeight={600}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#06251C',
                              borderColor: 'rgba(255,255,255,0.15)',
                              borderRadius: '16px',
                              color: '#ffffff',
                              fontSize: '11px',
                            }}
                          />
                          <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ fontSize: '11px', paddingBottom: '6px' }}
                          />
                          <Bar
                            dataKey={currentPlayer.playerName}
                            fill="#00C853"
                            radius={[6, 6, 0, 0]}
                            barSize={16}
                          />
                          <Bar
                            dataKey={selectedPlayer.playerName}
                            fill="#38BDF8"
                            radius={[6, 6, 0, 0]}
                            barSize={16}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Quick Change Player Selector footer */}
                  <div className="pt-1 flex items-center justify-between text-xs text-[#5B6B63]">
                    <span>Compare with another player in the tournament?</span>
                    <button
                      type="button"
                      onClick={() => setIsSelectingPlayer(true)}
                      className="font-bold text-[#00A94D] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Pick Another Player</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Row component that highlights the leader
interface ComparisonRowProps {
  label: string;
  val1: number;
  val2: number;
  suffix?: string;
  invertLeader?: boolean;
  formatValue?: (v: number) => string;
}

const ComparisonRow: React.FC<ComparisonRowProps> = ({
  label,
  val1,
  val2,
  suffix = '',
  invertLeader = false,
  formatValue,
}) => {
  const isP1Leader = invertLeader ? val1 < val2 : val1 > val2;
  const isP2Leader = invertLeader ? val2 < val1 : val2 > val1;
  const isTie = val1 === val2;

  const display1 = formatValue ? formatValue(val1) : val1;
  const display2 = formatValue ? formatValue(val2) : val2;

  return (
    <div className="bg-white rounded-xl p-2.5 border border-[#E4EAE6] flex items-center justify-between gap-2">
      {/* P1 Value */}
      <div className="w-24 text-left">
        <span
          className={`font-black text-xs inline-flex items-center gap-1 ${
            isP1Leader
              ? 'text-[#00873D] bg-[#00C853]/15 px-2 py-0.5 rounded-md'
              : 'text-[#5B6B63]'
          }`}
        >
          {display1} {isP1Leader && <Check className="w-3 h-3 text-[#00873D] stroke-[3]" />}
        </span>
      </div>

      {/* Label in Center */}
      <div className="flex-1 text-center min-w-0">
        <span className="font-bold text-[#13201B] truncate block text-[11px] uppercase tracking-wider">
          {label}
        </span>
        <span className="text-[10px] text-[#8A978F]">{suffix}</span>
      </div>

      {/* P2 Value */}
      <div className="w-24 text-right">
        <span
          className={`font-black text-xs inline-flex items-center justify-end gap-1 ${
            isP2Leader
              ? 'text-[#0284C7] bg-sky-100 px-2 py-0.5 rounded-md'
              : 'text-[#5B6B63]'
          }`}
        >
          {isP2Leader && <Check className="w-3 h-3 text-[#0284C7] stroke-[3]" />} {display2}
        </span>
      </div>
    </div>
  );
};
