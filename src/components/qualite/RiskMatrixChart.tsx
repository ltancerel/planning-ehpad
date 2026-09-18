"use client";

import { useMemo, useState } from "react";
import {
  RISQUES_DEMO,
  UNITES_TRAVAIL,
  categorie,
  niveauCriticite,
  LIBELLES_CRITICITE,
  type Niveau,
  type Risque,
} from "@/lib/qualite-mock-data";

const NIVEAUX: Niveau[] = [4, 3, 2, 1]; // gravité, affichée du haut (grave) vers le bas (bénin)
const FREQUENCES: Niveau[] = [1, 2, 3, 4];

const STYLES_CELLULE: Record<string, string> = {
  faible: "bg-emerald-50 border-emerald-200",
  moyen: "bg-amber-50 border-amber-300",
  eleve: "bg-red-50 border-red-300",
};

const STYLES_POINT: Record<string, string> = {
  faible: "text-emerald-600",
  moyen: "text-amber-600",
  eleve: "text-red-600",
};

const SEUIL_ICONES = 4; // au-delà, on bascule sur des croix pour rester lisible

function uniteNom(id: string): string {
  return UNITES_TRAVAIL.find((u) => u.id === id)?.nom ?? id;
}

export default function RiskMatrixChart() {
  const [vue, setVue] = useState<"residuel" | "brut">("residuel");

  const parCellule = useMemo(() => {
    const map = new Map<string, Risque[]>();
    for (const r of RISQUES_DEMO) {
      const cotation = vue === "residuel" ? r.residuel : r.brut;
      const cle = `${cotation.gravite}-${cotation.frequence}`;
      const liste = map.get(cle) ?? [];
      liste.push(r);
      map.set(cle, liste);
    }
    return map;
  }, [vue]);

  const compteParNiveau = useMemo(() => {
    const compte = { faible: 0, moyen: 0, eleve: 0 };
    for (const r of RISQUES_DEMO) {
      const cotation = vue === "residuel" ? r.residuel : r.brut;
      compte[niveauCriticite(cotation)]++;
    }
    return compte;
  }, [vue]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-800">
            Matrice Gravité × Fréquence — {vue === "residuel" ? "risque résiduel" : "risque brut"}
          </h3>
          <div className="flex rounded border border-zinc-300 text-xs">
            <button
              onClick={() => setVue("residuel")}
              className={`px-2 py-1 ${vue === "residuel" ? "bg-zinc-800 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
            >
              Résiduel
            </button>
            <button
              onClick={() => setVue("brut")}
              className={`px-2 py-1 ${vue === "brut" ? "bg-zinc-800 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
            >
              Brut
            </button>
          </div>
        </div>

        <div className="flex">
          <div className="mr-2 flex flex-col items-center justify-center">
            <span className="-rotate-90 whitespace-nowrap text-xs font-medium text-zinc-500">Gravité</span>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-4 gap-1.5">
              {NIVEAUX.map((g) =>
                FREQUENCES.map((f) => {
                  const cle = `${g}-${f}`;
                  const risques = parCellule.get(cle) ?? [];
                  const niveau = niveauCriticite({ gravite: g, frequence: f });
                  return (
                    <div
                      key={cle}
                      className={`flex min-h-[92px] flex-col items-center justify-center gap-1 rounded border p-1.5 ${STYLES_CELLULE[niveau]}`}
                      title={`Gravité ${g} × Fréquence ${f} = ${g * f} (${LIBELLES_CRITICITE[niveau]})`}
                    >
                      <span className="text-[10px] font-semibold text-zinc-400">{g * f}</span>
                      {risques.length === 0 ? null : risques.length <= SEUIL_ICONES ? (
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {risques.map((r) => (
                            // eslint-disable-next-line @next/next/no-img-element -- pictogrammes DUERP, images statiques du dossier public
                            <img
                              key={r.id}
                              src={categorie(r.categorie).icone}
                              alt={categorie(r.categorie).nom}
                              title={`${r.intitule} — ${uniteNom(r.uniteTravailId)}`}
                              className="h-5 w-5 object-contain"
                            />
                          ))}
                        </div>
                      ) : (
                        <div
                          className={`flex flex-wrap items-center justify-center gap-0.5 ${STYLES_POINT[niveau]}`}
                          title={risques.map((r) => r.intitule).join(", ")}
                        >
                          {risques.map((r) => (
                            <span key={r.id} className="text-xs font-bold leading-none">
                              ×
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="mt-1 grid grid-cols-4 gap-1.5 text-center text-[10px] text-zinc-500">
              {FREQUENCES.map((f) => (
                <span key={f}>F{f}</span>
              ))}
            </div>
            <p className="mt-1 text-center text-xs font-medium text-zinc-500">Fréquence d&apos;apparition</p>
          </div>
        </div>
      </div>

      <aside className="space-y-3">
        <div className="rounded border border-zinc-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Synthèse DUERP</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Risques élevés
              </span>
              <span className="font-semibold text-red-700">{compteParNiveau.eleve}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Risques moyens
              </span>
              <span className="font-semibold text-amber-700">{compteParNiveau.moyen}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Risques faibles
              </span>
              <span className="font-semibold text-emerald-700">{compteParNiveau.faible}</span>
            </li>
          </ul>
          <p className="mt-2 border-t border-zinc-100 pt-2 text-xs text-zinc-500">
            {RISQUES_DEMO.length} risques recensés au total (DUERP V3, en cours d&apos;élaboration).
          </p>
        </div>
      </aside>
    </div>
  );
}
