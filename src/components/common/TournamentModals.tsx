import React, { useState, useEffect } from 'react';
import type { TournamentModel, Team } from '../../types';
import { Trophy, X, Check, Trash2, Edit } from '../Icons';

interface EditTournamentModalProps {
  tournament: TournamentModel | null;
  allTeams: Team[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (tournamentId: string, updates: Partial<TournamentModel>) => Promise<void>;
}

export const EditTournamentModal: React.FC<EditTournamentModalProps> = ({
  tournament,
  allTeams,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !tournament) return null;

  const [name, setName] = useState(tournament.name);
  const [status, setStatus] = useState<TournamentModel['status']>(tournament.status);
  const [oversPerMatch, setOversPerMatch] = useState(tournament.oversPerMatch || 20);
  const [stage, setStage] = useState(tournament.stage || 'group');
  const [selectedTeams, setSelectedTeams] = useState<string[]>(tournament.teams || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tournament) {
      setName(tournament.name);
      setStatus(tournament.status);
      setOversPerMatch(tournament.oversPerMatch || 20);
      setStage(tournament.stage || 'group');
      setSelectedTeams(tournament.teams || []);
      setError(null);
    }
  }, [tournament]);

  const toggleTeam = (teamName: string) => {
    setSelectedTeams((prev) =>
      prev.includes(teamName) ? prev.filter((t) => t !== teamName) : [...prev, teamName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tournament name is required');
      return;
    }
    if (selectedTeams.length < 2) {
      setError('Please select at least 2 participating teams');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(tournament.id, {
        name: name.trim(),
        status,
        oversPerMatch: Number(oversPerMatch),
        stage,
        teams: selectedTeams,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update tournament');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-[#E4EAE6] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0B3D2E] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00C853]/20 flex items-center justify-center text-[#00C853] border border-[#00C853]/30">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#00C853] block">
                Admin Management
              </span>
              <h3 className="text-base font-black leading-tight">Edit Tournament</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-[#E53935]/10 border border-[#E53935]/25 rounded-xl text-xs font-bold text-[#E53935]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1">
              Tournament Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BTG Premier League 2026"
              className="w-full px-3.5 py-2.5 bg-[#F4F7F5] border border-[#E4EAE6] rounded-xl text-xs font-bold text-[#13201B] focus:bg-white focus:border-[#00C853] outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1">
                Tournament Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-[#F4F7F5] border border-[#E4EAE6] rounded-xl text-xs font-bold text-[#13201B] focus:bg-white focus:border-[#00C853] outline-hidden cursor-pointer"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing (Live)</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1">
                Overs Per Match
              </label>
              <select
                value={oversPerMatch}
                onChange={(e) => setOversPerMatch(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#F4F7F5] border border-[#E4EAE6] rounded-xl text-xs font-bold text-[#13201B] focus:bg-white focus:border-[#00C853] outline-hidden cursor-pointer"
              >
                <option value={5}>5 Overs (Blitz)</option>
                <option value={10}>10 Overs (T10)</option>
                <option value={15}>15 Overs</option>
                <option value={20}>20 Overs (T20)</option>
                <option value={50}>50 Overs (ODI)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#13201B] uppercase tracking-wider mb-1">
              Tournament Stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F4F7F5] border border-[#E4EAE6] rounded-xl text-xs font-bold text-[#13201B] focus:bg-white focus:border-[#00C853] outline-hidden cursor-pointer"
            >
              <option value="group">Group Stage / Round Robin</option>
              <option value="playoffs">Playoffs / Semi-Finals</option>
              <option value="final">Championship Final</option>
            </select>
          </div>

          {/* Participating Teams Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#13201B] uppercase tracking-wider">
                Participating Teams ({selectedTeams.length} Selected)
              </label>
              <span className="text-[11px] text-[#8A978F]">Min 2 teams required</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 bg-[#F4F7F5] border border-[#E4EAE6] rounded-xl">
              {allTeams.map((t) => {
                const isSelected = selectedTeams.includes(t.teamName);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTeam(t.teamName)}
                    className={`p-2 rounded-lg text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00C853]/15 text-[#00873D] border border-[#00C853]/40'
                        : 'bg-white text-[#13201B] border border-[#E4EAE6] hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate pr-1">{t.teamName}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#00A94D] shrink-0 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#E4EAE6] text-xs font-bold text-[#5B6B63] hover:bg-[#EFF3F0] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-[#00C853] hover:bg-[#00A94D] text-[#0B3D2E] text-xs font-black transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteTournamentModalProps {
  tournament: TournamentModel | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tournamentId: string) => Promise<void>;
}

export const DeleteTournamentModal: React.FC<DeleteTournamentModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !tournament) return null;

  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm(tournament.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E4EAE6] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-[#E53935]/15 text-[#E53935] flex items-center justify-center mb-3">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="font-black text-lg text-[#13201B]">Delete Tournament?</h3>
        <p className="text-xs text-[#5B6B63] mt-2 leading-relaxed">
          Are you sure you want to permanently delete <span className="font-bold text-[#13201B]">"{tournament.name}"</span>?
        </p>

        <div className="my-3 p-3 bg-[#EFF3F0] rounded-2xl border border-[#E4EAE6] text-xs space-y-1">
          <div className="flex justify-between text-[#5B6B63]">
            <span>Participating Teams:</span>
            <span className="font-black text-[#13201B]">{tournament.teams.length} teams</span>
          </div>
          <div className="flex justify-between text-[#5B6B63]">
            <span>Scheduled Matches:</span>
            <span className="font-black text-[#13201B]">{tournament.totalMatches} matches</span>
          </div>
          <div className="flex justify-between text-[#5B6B63]">
            <span>Overs Format:</span>
            <span className="font-black text-[#13201B]">{tournament.oversPerMatch} overs</span>
          </div>
        </div>

        <p className="text-[11px] text-[#E53935] font-semibold">
          ⚠️ Warning: All standings, points table data, and match fixtures linked to this tournament will be permanently removed.
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-[#E4EAE6] text-xs font-bold text-[#13201B] hover:bg-[#EFF3F0] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-[#E53935] hover:bg-[#D32F2F] text-xs font-bold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Confirm & Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
