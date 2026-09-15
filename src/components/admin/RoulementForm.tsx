"use client";

import { useState } from "react";
import type { Roulement } from "@/lib/mock-data";
import { HORAIRE_CODES_PAR_CODE } from "@/lib/horaire-codes";
import HoraireCodeSelector, { type PositionSelecteur } from "@/components/HoraireCodeSelector";

const JOURS = ["L", "Ma", "M", "J", "V", "S", "D"];
const NB_SEMAINES_MIN = 1;
const NB_SEMAINES_MAX = 8;

function semaineVide(): string[] {
  return new Array(7).fill("");
}

type RoulementFormProps = {
  valeurInitiale?: Roulement;
  onValider: (roulement: Omit<Roulement, "id">) => void;
  onAnnuler: () => void;
};

export default function RoulementForm({ valeurInitiale, onValider, onAnnuler }: RoulementFormProps) {
  const modeEdition = Boolean(valeurInitiale);
  const [nom, setNom] = useState(valeurInitiale?.nom ?? "");
  const [motif, setMotif] = useState<string[][]>(
    valeurInitiale?.motif.map((semaine) => [...semaine]) ?? [semaineVide()]
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [celluleEnEdition, setCelluleEnEdition] = useState<{ s: number; j: number } | null>(null);
  const [positionEdition, setPositionEdition] = useState<PositionSelecteur | null>(null);

  function changerNbSemaines(nb: number) {
    const borne = Math.min(NB_SEMAINES_MAX, Math.max(NB_SEMAINES_MIN, nb));
    setMotif((prev) => {
      if (borne === prev.length) return prev;
      if (borne > prev.length) {
        return [...prev, ...Array.from({ length: borne - prev.length }, semaineVide)];
      }
      return prev.slice(0, borne);
    });
  }

  function changerCellule(semaineIndex: number, jourIndex: number, valeur: string) {
    setMotif((prev) =>
      prev.map((semaine, s) =>
        s === semaineIndex ? semaine.map((c, j) => (j === jourIndex ? valeur : c)) : semaine
      )
    );
  }

  function ouvrirSelecteur(s: number, j: number, cellule: HTMLElement) {
    const rect = cellule.getBoundingClientRect();
    setPositionEdition({ top: rect.bottom + 2, left: rect.left, width: Math.max(rect.width, 220) });
    setCelluleEnEdition({ s, j });
  }

  function fermerSelecteur() {
    setCelluleEnEdition(null);
    setPositionEdition(null);
  }

  function choisirCode(code: string | null) {
    if (celluleEnEdition) {
      changerCellule(celluleEnEdition.s, celluleEnEdition.j, code ?? "");
    }
    fermerSelecteur();
  }

  function valider() {
    if (!nom.trim()) {
      setErreur("Le nom du roulement est obligatoire.");
      return;
    }
    setErreur(null);
    onValider({ nom: nom.trim(), nbSemaines: motif.length, motif });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-800">
          {modeEdition ? "Modifier le roulement" : "Nouveau roulement"}
        </h2>
        <button onClick={onAnnuler} className="text-zinc-400 hover:text-zinc-600" aria-label="Fermer">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-auto px-4 py-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Nom du roulement</label>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            placeholder="Ex : ASH matin/soir (2 semaines)"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Nombre de semaines</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changerNbSemaines(motif.length - 1)}
              className="rounded border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-50"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-medium">{motif.length}</span>
            <button
              type="button"
              onClick={() => changerNbSemaines(motif.length + 1)}
              className="rounded border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-50"
            >
              +
            </button>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            Chaque semaine du motif est un bloc complet Lundi → Dimanche (roulement aligné sur la
            semaine).
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Répartition des horaires</label>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-16 border border-zinc-200 bg-zinc-50 py-1 text-left text-[11px] font-medium text-zinc-500">
                  Semaine
                </th>
                {JOURS.map((j) => (
                  <th
                    key={j}
                    className="border border-zinc-200 bg-zinc-50 py-1 text-center text-[11px] font-medium text-zinc-500"
                  >
                    {j}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {motif.map((semaine, semaineIndex) => (
                <tr key={semaineIndex}>
                  <td className="border border-zinc-200 px-1.5 py-1 text-[11px] font-medium text-zinc-600">
                    S{semaineIndex + 1}
                  </td>
                  {semaine.map((code, jourIndex) => {
                    const horaire = code ? HORAIRE_CODES_PAR_CODE[code] : undefined;
                    return (
                      <td key={jourIndex} className="border border-zinc-200 p-0">
                        <button
                          type="button"
                          onClick={(e) => ouvrirSelecteur(semaineIndex, jourIndex, e.currentTarget)}
                          className="w-full px-1 py-1.5 text-center text-[11px] font-semibold"
                          style={{
                            backgroundColor: horaire?.couleurFond ?? "#ffffff",
                            color: horaire?.couleurTexte ?? "#a1a1aa",
                          }}
                        >
                          {code || "—"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {erreur && <p className="text-xs font-medium text-red-600">{erreur}</p>}
      </div>

      <div className="flex justify-end gap-2 border-t border-zinc-200 px-4 py-3">
        <button
          onClick={onAnnuler}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Annuler
        </button>
        <button
          onClick={valider}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {modeEdition ? "Enregistrer" : "Créer"}
        </button>
      </div>

      {celluleEnEdition && positionEdition && (
        <>
          <div className="fixed inset-0 z-40" onClick={fermerSelecteur} />
          <HoraireCodeSelector
            position={positionEdition}
            aUneValeur={Boolean(motif[celluleEnEdition.s][celluleEnEdition.j])}
            masquerEvenementiels
            onChoisir={choisirCode}
            onFermer={fermerSelecteur}
          />
        </>
      )}
    </div>
  );
}
