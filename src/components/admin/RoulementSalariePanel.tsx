"use client";

import type { AffectationRoulement, Roulement } from "@/lib/mock-data";
import RoulementSalarieSection from "@/components/admin/RoulementSalarieSection";

type RoulementSalariePanelProps = {
  nomComplet: string;
  roulements: Roulement[];
  affectations: AffectationRoulement[];
  dateReferenceISO: string;
  onAssigner: (donnees: Omit<AffectationRoulement, "id">) => void;
  onFermer: () => void;
};

export default function RoulementSalariePanel({
  nomComplet,
  roulements,
  affectations,
  dateReferenceISO,
  onAssigner,
  onFermer,
}: RoulementSalariePanelProps) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onFermer} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm border-l border-zinc-200 bg-white shadow-xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-800">Roulement — {nomComplet}</h2>
            <button onClick={onFermer} className="text-zinc-400 hover:text-zinc-600" aria-label="Fermer">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-auto px-4 py-4">
            <RoulementSalarieSection
              roulements={roulements}
              affectations={affectations}
              dateReferenceISO={dateReferenceISO}
              onAssigner={onAssigner}
            />
          </div>
        </div>
      </div>
    </>
  );
}
