"use client";

import { useEffect, useRef, useState } from "react";
import type { GroupeRoulement, TypePaie } from "@/lib/mock-data";

// Filtre avancé de la vue Planning (retour client du 22/09) : remplace
// l'ancien sélecteur à choix unique (Tous / Présents / Contrat actif / ...)
// par des critères combinables indépendamment (ET entre critères, OU entre
// valeurs d'un même critère) — ex. Type de paie 25/M ET Présent, ou Type de
// paie 25/M ET (Présent OU Absent). Un bouton "Filtres" ouvre une fenêtre à
// sections ; le badge bleu sur ce bouton (nombre de critères actifs) est le
// seul rappel affiché sur l'écran — pas de bandeau listant les filtres
// actifs sous l'en-tête (retour client du 13/11 : à l'utilisateur de savoir
// ce qu'il a filtré, les éléments filtrés ne doivent pas rester visibles).
export type Presence = "present" | "absent";
export type EtatPlanning = "avec" | "sans";

export type FiltresAvances = {
  typePaie: Set<TypePaie>;
  presence: Set<Presence>;
  groupeRoulement: Set<GroupeRoulement>;
  service: Set<string>;
  planning: Set<EtatPlanning>;
};

export function filtresVides(): FiltresAvances {
  return {
    typePaie: new Set(),
    presence: new Set(),
    groupeRoulement: new Set(),
    service: new Set(),
    planning: new Set(),
  };
}

export function nbFiltresActifs(filtres: FiltresAvances): number {
  return (
    filtres.typePaie.size +
    filtres.presence.size +
    filtres.groupeRoulement.size +
    filtres.service.size +
    filtres.planning.size
  );
}

const LIBELLES_TYPE_PAIE: Record<TypePaie, string> = { "25/M": "25/M", "30/M": "30/M", Aucun: "Aucun" };
const LIBELLES_PRESENCE: Record<Presence, string> = { present: "Présent", absent: "Non présent" };
const LIBELLES_PLANNING: Record<EtatPlanning, string> = { avec: "Avec planning", sans: "Sans planning" };

function avecValeurBasculee<T>(ensemble: Set<T>, valeur: T): Set<T> {
  const copie = new Set(ensemble);
  if (copie.has(valeur)) copie.delete(valeur);
  else copie.add(valeur);
  return copie;
}

function FunnelIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M1.5 2.5h13l-4.75 5.75v4.25l-3.5 1.5V8.25L1.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SectionCaseACocher<T extends string>({
  titre,
  options,
  libelle,
  selection,
  onToggle,
}: {
  titre: string;
  options: T[];
  libelle: (v: T) => string;
  selection: Set<T>;
  onToggle: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{titre}</p>
      <div className="flex flex-col gap-1">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-1.5 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={selection.has(option)}
              onChange={() => onToggle(option)}
              className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            {libelle(option)}
          </label>
        ))}
      </div>
    </div>
  );
}

export function FiltreSalariesBouton({
  filtres,
  onChange,
  services,
  managers,
  groupesRoulement,
  nbResultats,
  mesServices,
}: {
  filtres: FiltresAvances;
  onChange: (f: FiltresAvances) => void;
  services: string[];
  // Comptes responsables d'au moins un service (service.responsable_id),
  // avec la liste des services dont chacun est responsable — alimente le
  // raccourci "Filtrer par manager" ci-dessous (retour client du 12/11,
  // rétablit l'ancien filtre Manager, cette fois dérivé du service plutôt
  // qu'un champ salarié.manager déconnecté de tout compte réel).
  managers: { id: string; nom: string; services: string[] }[];
  groupesRoulement: GroupeRoulement[];
  nbResultats: number;
  // Services dont le compte connecté est responsable (retour client du
  // 29/10) — alimente le raccourci "Mes services" ci-dessous, absent
  // (undefined) si le compte n'en gère aucun.
  mesServices?: string[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const actifs = nbFiltresActifs(filtres);

  // Ferme au clic extérieur (cohérent avec le reste des popovers de l'écran
  // Planning, ex. le sélecteur de période).
  useEffect(() => {
    if (!ouvert) return;
    function surClicExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) setOuvert(false);
    }
    document.addEventListener("mousedown", surClicExterieur);
    return () => document.removeEventListener("mousedown", surClicExterieur);
  }, [ouvert]);

  return (
    <div ref={conteneurRef} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium ${
          actifs > 0
            ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
            : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
        }`}
      >
        <FunnelIcon />
        Filtres
        {actifs > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
            {actifs}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute right-0 top-full z-40 mt-1.5 w-[360px] rounded border border-zinc-200 bg-white p-3.5 shadow-lg">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <SectionCaseACocher
              titre="Type de paie"
              options={["25/M", "30/M", "Aucun"] as TypePaie[]}
              libelle={(v) => LIBELLES_TYPE_PAIE[v]}
              selection={filtres.typePaie}
              onToggle={(v) => onChange({ ...filtres, typePaie: avecValeurBasculee(filtres.typePaie, v) })}
            />
            <SectionCaseACocher
              titre="Présence"
              options={["present", "absent"] as Presence[]}
              libelle={(v) => LIBELLES_PRESENCE[v]}
              selection={filtres.presence}
              onToggle={(v) => onChange({ ...filtres, presence: avecValeurBasculee(filtres.presence, v) })}
            />
            <SectionCaseACocher
              titre="Alignement roulement"
              options={groupesRoulement}
              libelle={(v) => v}
              selection={filtres.groupeRoulement}
              onToggle={(v) => onChange({ ...filtres, groupeRoulement: avecValeurBasculee(filtres.groupeRoulement, v) })}
            />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Service</p>
                {mesServices && mesServices.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...filtres, service: new Set(mesServices) })}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800"
                  >
                    Mes services
                  </button>
                )}
              </div>
              {managers.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    const manager = managers.find((m) => m.id === e.target.value);
                    if (manager) onChange({ ...filtres, service: new Set(manager.services) });
                  }}
                  className="mb-1.5 w-full rounded border border-zinc-300 px-1.5 py-1 text-xs text-zinc-600"
                >
                  <option value="">Filtrer par manager…</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nom}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex flex-col gap-1">
                {services.map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-1.5 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={filtres.service.has(option)}
                      onChange={() => onChange({ ...filtres, service: avecValeurBasculee(filtres.service, option) })}
                      className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-zinc-100 pt-3">
            <SectionCaseACocher
              titre="Planning (période affichée)"
              options={["avec", "sans"] as EtatPlanning[]}
              libelle={(v) => LIBELLES_PLANNING[v]}
              selection={filtres.planning}
              onToggle={(v) => onChange({ ...filtres, planning: avecValeurBasculee(filtres.planning, v) })}
            />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
            <button
              type="button"
              onClick={() => onChange(filtresVides())}
              disabled={actifs === 0}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-800 disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              Réinitialiser
            </button>
            <span className="text-xs text-zinc-500">
              {nbResultats} salarié{nbResultats > 1 ? "s" : ""} affiché{nbResultats > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

