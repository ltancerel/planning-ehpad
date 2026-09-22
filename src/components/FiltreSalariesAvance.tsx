"use client";

import { useEffect, useRef, useState } from "react";
import type { Manager } from "@/lib/mock-data";

// Filtre avancé de la vue Planning (retour client du 22/09) : remplace
// l'ancien sélecteur à choix unique (Tous / Présents / Contrat actif / ...)
// par des critères combinables indépendamment (ET entre critères, OU entre
// valeurs d'un même critère) — ex. Contrat actif ET Présent, ou Contrat actif
// ET (Présent OU Absent). Inspiré du panneau de filtres d'HelloWork : un
// bouton "Filtres" ouvre une fenêtre à sections, les filtres actifs
// s'affichent ensuite sous forme de jetons retirables individuellement.
export type Contrat = "actif" | "inactif";
export type Presence = "present" | "absent";
export type EtatPlanning = "avec" | "sans";

export type FiltresAvances = {
  contrat: Set<Contrat>;
  presence: Set<Presence>;
  manager: Set<Manager>;
  service: Set<string>;
  planning: Set<EtatPlanning>;
};

export function filtresVides(): FiltresAvances {
  return {
    contrat: new Set(),
    presence: new Set(),
    manager: new Set(),
    service: new Set(),
    planning: new Set(),
  };
}

export function nbFiltresActifs(filtres: FiltresAvances): number {
  return (
    filtres.contrat.size +
    filtres.presence.size +
    filtres.manager.size +
    filtres.service.size +
    filtres.planning.size
  );
}

const LIBELLES_CONTRAT: Record<Contrat, string> = { actif: "Contrat actif", inactif: "Contrat inactif" };
const LIBELLES_PRESENCE: Record<Presence, string> = { present: "Présent", absent: "Non présent" };
const LIBELLES_PLANNING: Record<EtatPlanning, string> = { avec: "Avec planning", sans: "Sans planning" };

function avecValeurBasculee<T>(ensemble: Set<T>, valeur: T): Set<T> {
  const copie = new Set(ensemble);
  if (copie.has(valeur)) copie.delete(valeur);
  else copie.add(valeur);
  return copie;
}

// Une puce = un critère actif, retirable individuellement sans rouvrir le
// panneau — cf. les filtres appliqués d'HelloWork sous la barre de recherche.
type Puce = { cle: string; libelle: string; retirer: () => void };

function pucesActives(
  filtres: FiltresAvances,
  onChange: (f: FiltresAvances) => void
): Puce[] {
  const puces: Puce[] = [];
  for (const v of filtres.contrat) {
    puces.push({
      cle: `contrat-${v}`,
      libelle: LIBELLES_CONTRAT[v],
      retirer: () => onChange({ ...filtres, contrat: avecValeurBasculee(filtres.contrat, v) }),
    });
  }
  for (const v of filtres.presence) {
    puces.push({
      cle: `presence-${v}`,
      libelle: LIBELLES_PRESENCE[v],
      retirer: () => onChange({ ...filtres, presence: avecValeurBasculee(filtres.presence, v) }),
    });
  }
  for (const v of filtres.manager) {
    puces.push({
      cle: `manager-${v}`,
      libelle: v === "Aucun" ? "Sans manager" : v,
      retirer: () => onChange({ ...filtres, manager: avecValeurBasculee(filtres.manager, v) }),
    });
  }
  for (const v of filtres.service) {
    puces.push({
      cle: `service-${v}`,
      libelle: v,
      retirer: () => onChange({ ...filtres, service: avecValeurBasculee(filtres.service, v) }),
    });
  }
  for (const v of filtres.planning) {
    puces.push({
      cle: `planning-${v}`,
      libelle: LIBELLES_PLANNING[v],
      retirer: () => onChange({ ...filtres, planning: avecValeurBasculee(filtres.planning, v) }),
    });
  }
  return puces;
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
  nbResultats,
}: {
  filtres: FiltresAvances;
  onChange: (f: FiltresAvances) => void;
  services: string[];
  managers: Manager[];
  nbResultats: number;
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
              titre="Contrat"
              options={["actif", "inactif"] as Contrat[]}
              libelle={(v) => LIBELLES_CONTRAT[v]}
              selection={filtres.contrat}
              onToggle={(v) => onChange({ ...filtres, contrat: avecValeurBasculee(filtres.contrat, v) })}
            />
            <SectionCaseACocher
              titre="Présence"
              options={["present", "absent"] as Presence[]}
              libelle={(v) => LIBELLES_PRESENCE[v]}
              selection={filtres.presence}
              onToggle={(v) => onChange({ ...filtres, presence: avecValeurBasculee(filtres.presence, v) })}
            />
            <SectionCaseACocher
              titre="Manager"
              options={managers}
              libelle={(v) => (v === "Aucun" ? "Sans manager" : v)}
              selection={filtres.manager}
              onToggle={(v) => onChange({ ...filtres, manager: avecValeurBasculee(filtres.manager, v) })}
            />
            <SectionCaseACocher
              titre="Service"
              options={services}
              libelle={(v) => v}
              selection={filtres.service}
              onToggle={(v) => onChange({ ...filtres, service: avecValeurBasculee(filtres.service, v) })}
            />
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

export function FiltresActifsChips({
  filtres,
  onChange,
}: {
  filtres: FiltresAvances;
  onChange: (f: FiltresAvances) => void;
}) {
  const puces = pucesActives(filtres, onChange);
  if (puces.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-100 bg-zinc-50 px-4 py-1.5">
      {puces.map((puce) => (
        <span
          key={puce.cle}
          className="flex items-center gap-1 rounded-full border border-zinc-300 bg-white py-0.5 pl-2.5 pr-1.5 text-xs text-zinc-700"
        >
          {puce.libelle}
          <button
            type="button"
            onClick={puce.retirer}
            aria-label={`Retirer le filtre ${puce.libelle}`}
            className="flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            ✕
          </button>
        </span>
      ))}
      {puces.length > 1 && (
        <button
          type="button"
          onClick={() => onChange(filtresVides())}
          className="text-xs font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-800"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
