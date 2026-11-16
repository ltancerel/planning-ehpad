"use client";

import { useState } from "react";
import type { AffectationRoulement, Roulement } from "@/lib/mock-data";
import { affectationActuelle, affectationsRecentesDabord } from "@/lib/mock-data";
import { formatJourMois, parseDateISO } from "@/lib/dates";

function formatDateAffichee(dateISO: string): string {
  return formatJourMois(parseDateISO(dateISO));
}

export type AssignationRoulement = { roulementId: string };

type RoulementSalarieSectionProps = {
  roulements: Roulement[];
  affectations: AffectationRoulement[];
  dateReferenceISO: string;
  onAssigner: (donnees: AssignationRoulement) => void;
};

export default function RoulementSalarieSection({
  roulements,
  affectations,
  dateReferenceISO,
  onAssigner,
}: RoulementSalarieSectionProps) {
  const [roulementChoisiId, setRoulementChoisiId] = useState(roulements[0]?.id ?? "");
  const [erreur, setErreur] = useState<string | null>(null);

  const actuelle = affectationActuelle(affectations, dateReferenceISO);
  const historique = affectationsRecentesDabord(affectations).filter((a) => a.id !== actuelle?.id);

  function nomRoulement(roulementId: string): string {
    return roulements.find((r) => r.id === roulementId)?.nom ?? roulementId;
  }

  function assigner() {
    if (!roulementChoisiId) {
      setErreur("Choisissez un roulement.");
      return;
    }
    setErreur(null);
    onAssigner({ roulementId: roulementChoisiId });
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-xs font-medium text-zinc-700">Roulement en cours</p>
        {actuelle ? (
          <div className="rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs">
            <p className="font-semibold text-blue-800">{nomRoulement(actuelle.roulementId)}</p>
            <p className="text-blue-600">
              Depuis le {formatDateAffichee(actuelle.dateDebut)}
              {actuelle.dateFin ? ` jusqu'au ${formatDateAffichee(actuelle.dateFin)}` : ""}
            </p>
          </div>
        ) : (
          <p className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-400">
            Aucun roulement assigné (défaut pour un nouveau salarié).
          </p>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-zinc-700">Historique</p>
        {historique.length > 0 ? (
          <ul className="space-y-1">
            {historique.map((a) => (
              <li key={a.id} className="rounded border border-zinc-200 px-2 py-1.5 text-xs text-zinc-600">
                <span className="font-medium text-zinc-700">{nomRoulement(a.roulementId)}</span>
                <br />
                Du {formatDateAffichee(a.dateDebut)}
                {a.dateFin ? ` au ${formatDateAffichee(a.dateFin)}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-zinc-400">Aucun autre roulement dans l&apos;historique.</p>
        )}
      </div>

      <div className="border-t border-zinc-200 pt-3">
        <p className="mb-2 text-xs font-medium text-zinc-700">Assigner un nouveau roulement</p>

        {roulements.length === 0 ? (
          <p className="text-[11px] text-zinc-400">
            Aucun roulement créé pour l&apos;instant (voir Administration &gt; Roulements).
          </p>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600">Roulement</label>
              <select
                value={roulementChoisiId}
                onChange={(e) => setRoulementChoisiId(e.target.value)}
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs"
              >
                {roulements.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nom}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-zinc-400">
              Prend effet immédiatement (à partir d&apos;aujourd&apos;hui). La semaine à partir de
              laquelle le motif est réellement écrit sur le planning se choisit ensuite depuis
              l&apos;écran Planning, en cliquant sur la semaine voulue.
            </p>

            {erreur && <p className="text-xs font-medium text-red-600">{erreur}</p>}

            <button
              type="button"
              onClick={assigner}
              className="w-full rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Assigner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
