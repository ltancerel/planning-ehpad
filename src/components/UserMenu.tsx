"use client";

import { useState } from "react";
import { UTILISATEUR_CONNECTE } from "@/lib/mock-data";
import { logout } from "@/app/compte/actions";

type UtilisateurMenu = {
  nom: string;
  prenom: string;
  typeUtilisateur: string;
  service?: string;
  poste?: string;
};

function initiales({ nom, prenom }: { nom: string; prenom: string }): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

// `utilisateur` fourni = session réelle (zone branchée sur le backend,
// cf. story #34) : affiche l'identité réelle et une vraie déconnexion.
// Non fourni = repli mock (zones pas encore branchées, ex. PlanningGrid).
export default function UserMenu({ utilisateur: utilisateurProp }: { utilisateur?: UtilisateurMenu }) {
  const [ouvert, setOuvert] = useState(false);
  const reel = Boolean(utilisateurProp);
  const utilisateur = utilisateurProp ?? UTILISATEUR_CONNECTE;

  return (
    <div className="relative">
      <button
        onClick={() => setOuvert((v) => !v)}
        className="flex items-center gap-2 rounded border border-zinc-300 py-1 pl-1 pr-2 text-xs hover:bg-zinc-50"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-semibold text-white">
          {initiales(utilisateur)}
        </span>
        <span className="font-medium text-zinc-700">
          {utilisateur.prenom} {utilisateur.nom}
        </span>
        <span className="text-zinc-400">▾</span>
      </button>

      {ouvert && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOuvert(false)} />
          <div className="absolute right-0 top-full z-40 mt-1 w-64 rounded border border-zinc-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-white">
                {initiales(utilisateur)}
              </span>
              <div>
                <div className="text-sm font-semibold text-zinc-800">
                  {utilisateur.prenom} {utilisateur.nom}
                </div>
                <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800">
                  {utilisateur.typeUtilisateur}
                </span>
              </div>
            </div>

            <dl className="space-y-1.5 border-t border-zinc-100 pt-3 text-xs">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Service</dt>
                <dd className="font-medium text-zinc-700">{utilisateur.service || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Poste</dt>
                <dd className="font-medium text-zinc-700">{utilisateur.poste || "—"}</dd>
              </div>
            </dl>

            {reel ? (
              <form action={logout} className="mt-3 border-t border-zinc-100 pt-2">
                <button type="submit" className="text-xs font-medium text-zinc-600 hover:underline">
                  Se déconnecter
                </button>
              </form>
            ) : (
              <p className="mt-3 border-t border-zinc-100 pt-2 text-[11px] text-zinc-400">
                Profil en lecture seule (maquette)
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
