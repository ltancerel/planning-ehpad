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

const SEUIL_ICONES = 3; // au-delà, on bascule sur des croix pour rester lisible dans une cellule compacte

function uniteNom(id: string): string {
  return UNITES_TRAVAIL.find((u) => u.id === id)?.nom ?? id;
}

function compterParNiveau(vue: "brut" | "residuel"): Record<"eleve" | "moyen" | "faible", number> {
  const compte = { faible: 0, moyen: 0, eleve: 0 };
  for (const r of RISQUES_DEMO) {
    compte[niveauCriticite(vue === "residuel" ? r.residuel : r.brut)]++;
  }
  return compte;
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

  const compteBrut = useMemo(() => compterParNiveau("brut"), []);
  const compteResiduel = useMemo(() => compterParNiveau("residuel"), []);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-700">
            Matrice G × F — {vue === "residuel" ? "résiduel" : "brut"}
          </h3>
          <div className="flex shrink-0 rounded border border-zinc-300 text-xs">
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
            <div className="grid grid-cols-4 gap-2">
              {NIVEAUX.map((g) =>
                FREQUENCES.map((f) => {
                  const cle = `${g}-${f}`;
                  const risques = parCellule.get(cle) ?? [];
                  const niveau = niveauCriticite({ gravite: g, frequence: f });
                  return (
                    <div
                      key={cle}
                      className={`flex min-h-[92px] flex-col items-center justify-center gap-1 rounded border p-2 ${STYLES_CELLULE[niveau]}`}
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
            <div className="mt-1 grid grid-cols-4 gap-2 text-center text-[10px] text-zinc-500">
              {FREQUENCES.map((f) => (
                <span key={f}>F{f}</span>
              ))}
            </div>
            <p className="mt-1 text-center text-xs font-medium text-zinc-500">Fréquence d&apos;apparition</p>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-zinc-700">Risque brut vs. risque résiduel</p>
        <div className="overflow-hidden rounded border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2">Niveau de criticité</th>
                <th className="px-3 py-2 text-center">Risque brut</th>
                <th className="px-3 py-2 text-center">Risque résiduel</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-zinc-100">
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Risques élevés
                  </span>
                </td>
                <td className="px-3 py-2 text-center font-semibold text-red-700">{compteBrut.eleve}</td>
                <td className="px-3 py-2 text-center font-semibold text-red-700">{compteResiduel.eleve}</td>
              </tr>
              <tr className="border-t border-zinc-100">
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Risques moyens
                  </span>
                </td>
                <td className="px-3 py-2 text-center font-semibold text-amber-700">{compteBrut.moyen}</td>
                <td className="px-3 py-2 text-center font-semibold text-amber-700">{compteResiduel.moyen}</td>
              </tr>
              <tr className="border-t border-zinc-100">
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Risques faibles
                  </span>
                </td>
                <td className="px-3 py-2 text-center font-semibold text-emerald-700">{compteBrut.faible}</td>
                <td className="px-3 py-2 text-center font-semibold text-emerald-700">{compteResiduel.faible}</td>
              </tr>
              <tr className="border-t border-zinc-200 bg-zinc-50">
                <td className="px-3 py-2 font-medium text-zinc-700">Total recensé</td>
                <td className="px-3 py-2 text-center font-semibold text-zinc-700">{RISQUES_DEMO.length}</td>
                <td className="px-3 py-2 text-center font-semibold text-zinc-700">{RISQUES_DEMO.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {RISQUES_DEMO.length} risques recensés (DUERP V3, en cours d&apos;élaboration). L&apos;écart entre les
          deux colonnes mesure l&apos;effet des mesures de prévention déjà en place.
        </p>
      </div>
    </div>
  );
}
