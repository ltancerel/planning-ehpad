"use client";

import { useState } from "react";
import Link from "next/link";

type ApplicationId = "planning" | "qualite";

type ApplicationDef = {
  id: ApplicationId;
  nom: string;
  description: string;
  href: string;
  couleur: string;
  initiale: string;
};

const APPLICATIONS: ApplicationDef[] = [
  {
    id: "planning",
    nom: "Planning",
    description: "Grille de planning, roulements, émargement",
    href: "/",
    couleur: "bg-zinc-700",
    initiale: "P",
  },
  {
    id: "qualite",
    nom: "Qualité",
    description: "DUERP & référentiel qualité HAS",
    href: "/qualite",
    couleur: "bg-teal-700",
    initiale: "Q",
  },
];

export default function AppSwitcher({ applicationActive }: { applicationActive: ApplicationId }) {
  const [ouvert, setOuvert] = useState(false);
  const actuelle = APPLICATIONS.find((a) => a.id === applicationActive) ?? APPLICATIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOuvert((v) => !v)}
        className="flex items-center gap-1 rounded-lg p-1 hover:bg-zinc-100"
        aria-label="Changer d'application"
        aria-expanded={ouvert}
        title="Changer d'application"
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${actuelle.couleur} text-sm font-bold text-white`}
        >
          {actuelle.initiale}
        </span>
        <span className="text-[10px] text-zinc-400">▾</span>
      </button>

      {ouvert && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOuvert(false)} />
          <div className="absolute left-0 top-full z-40 mt-1 w-72 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
            <p className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Applications
            </p>
            <ul className="space-y-0.5">
              {APPLICATIONS.map((app) => {
                const active = app.id === applicationActive;
                return (
                  <li key={app.id}>
                    <Link
                      href={app.href}
                      onClick={() => setOuvert(false)}
                      className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm ${
                        active ? "bg-zinc-50" : "hover:bg-zinc-50"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${app.couleur} text-sm font-bold text-white`}
                      >
                        {app.initiale}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="font-medium text-zinc-800">{app.nom}</span>
                          {active && (
                            <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                              actuelle
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-zinc-500">{app.description}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
