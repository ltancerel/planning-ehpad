"use client";

import { useState } from "react";
import type { AffectationRoulement, Roulement, Salarie } from "@/lib/mock-data";
import { affectationActuelle, affectationsRecentesDabord } from "@/lib/mock-data";
import { lundiDeLaSemaine, formatDateISO, formatJourMois } from "@/lib/dates";

function formatDateAffichee(dateISO: string): string {
  return formatJourMois(new Date(dateISO));
}

type RoulementSalariePanelProps = {
  salarie: Salarie;
  roulements: Roulement[];
  affectations: AffectationRoulement[];
  dateReferenceISO: string;
  onAssigner: (donnees: Omit<AffectationRoulement, "id">) => void;
  onFermer: () => void;
};

export default function RoulementSalariePanel({
  salarie,
  roulements,
  affectations,
  dateReferenceISO,
  onAssigner,
  onFermer,
}: RoulementSalariePanelProps) {
  const [roulementChoisiId, setRoulementChoisiId] = useState(
    roulements.find((r) => r.parDefaut)?.id ?? roulements[0]?.id ?? ""
  );
  const [dateDebut, setDateDebut] = useState(formatDateISO(lundiDeLaSemaine(new Date(dateReferenceISO))));
  const [dateFin, setDateFin] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const actuelle = affectationActuelle(affectations, dateReferenceISO);
  const historique = affectationsRecentesDabord(affectations).filter((a) => a.id !== actuelle?.id);

  function nomRoulement(roulementId: string): string {
    return roulements.find((r) => r.id === roulementId)?.nom ?? roulementId;
  }

  function changerDateDebut(valeur: string) {
    if (!valeur) return;
    setDateDebut(formatDateISO(lundiDeLaSemaine(new Date(valeur))));
  }

  function assigner() {
    if (!roulementChoisiId) {
      setErreur("Choisissez un roulement.");
      return;
    }
    if (dateFin && dateFin < dateDebut) {
      setErreur("La date de fin doit être postérieure à la date de début.");
      return;
    }
    setErreur(null);
    onAssigner({ roulementId: roulementChoisiId, dateDebut, dateFin: dateFin || undefined });
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onFermer} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm border-l border-zinc-200 bg-white shadow-xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-800">
              Roulement — {salarie.nom} {salarie.prenom}
            </h2>
            <button onClick={onFermer} className="text-zinc-400 hover:text-zinc-600" aria-label="Fermer">
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-auto px-4 py-4">
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
                  Aucun roulement assigné actuellement.
                </p>
              )}
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-zinc-700">Historique</p>
              {historique.length > 0 ? (
                <ul className="space-y-1">
                  {historique.map((a) => (
                    <li
                      key={a.id}
                      className="rounded border border-zinc-200 px-2 py-1.5 text-xs text-zinc-600"
                    >
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
                          {r.parDefaut ? " (par défaut)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-[11px] font-medium text-zinc-600">
                        Date de début (lundi)
                      </label>
                      <input
                        type="date"
                        value={dateDebut}
                        onChange={(e) => changerDateDebut(e.target.value)}
                        className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-[11px] font-medium text-zinc-600">
                        Date de fin (optionnelle)
                      </label>
                      <input
                        type="date"
                        value={dateFin}
                        onChange={(e) => setDateFin(e.target.value)}
                        className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Laisser la date de fin vide si le roulement reste en cours. La date de début est
                    automatiquement ramenée au lundi de sa semaine.
                  </p>

                  {erreur && <p className="text-xs font-medium text-red-600">{erreur}</p>}

                  <button
                    onClick={assigner}
                    className="w-full rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Assigner et appliquer au planning
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
