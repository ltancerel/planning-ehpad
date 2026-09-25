"use client";

import { useActionState, useState } from "react";
import { creerEhpad } from "./actions";
import { evaluerRobustesse } from "@/lib/mot-de-passe";

const COULEUR_ROBUSTESSE: Record<string, string> = {
  faible: "bg-red-500",
  moyen: "bg-amber-500",
  fort: "bg-green-500",
};

const LABEL_ROBUSTESSE: Record<string, string> = {
  faible: "Trop faible",
  moyen: "Correct, mais pas encore suffisant",
  fort: "Robuste",
};

export default function CreerEhpadFormulaire() {
  const [state, action, pending] = useActionState(creerEhpad, undefined);
  const [motDePasse, setMotDePasse] = useState("");
  const robustesse = evaluerRobustesse(motDePasse);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="nom">
          Nouvel EHPAD
        </label>
        <input
          id="nom"
          name="nom"
          required
          placeholder="Ex : Les Jardins de Rambam"
          className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </div>

      <fieldset className="rounded border border-zinc-200 p-3">
        <legend className="px-1 text-xs font-medium text-zinc-700">Premier Administrateur de cet EHPAD</legend>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-zinc-600" htmlFor="admin_prenom">
              Prénom
            </label>
            <input
              id="admin_prenom"
              name="admin_prenom"
              required
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-600" htmlFor="admin_nom">
              Nom
            </label>
            <input
              id="admin_nom"
              name="admin_nom"
              required
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-600" htmlFor="admin_identifiant">
              Identifiant (3 lettres)
            </label>
            <input
              id="admin_identifiant"
              name="admin_identifiant"
              required
              maxLength={3}
              placeholder="Ex : CDU"
              className="w-24 rounded border border-zinc-300 px-2 py-1.5 text-sm font-semibold uppercase"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-600" htmlFor="admin_email">
              Email
            </label>
            <input
              id="admin_email"
              name="admin_email"
              type="email"
              required
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs text-zinc-600" htmlFor="admin_mot_de_passe">
              Mot de passe temporaire
            </label>
            <input
              id="admin_mot_de_passe"
              name="admin_mot_de_passe"
              type="password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
            {motDePasse.length > 0 && (
              <div className="mt-1">
                <div className="flex h-1.5 gap-1">
                  {(["faible", "moyen", "fort"] as const).map((niveau, index) => {
                    const seuils = { faible: 1, moyen: 2, fort: 3 };
                    const atteint = seuils[robustesse] >= index + 1;
                    return (
                      <div
                        key={niveau}
                        className={`flex-1 rounded ${atteint ? COULEUR_ROBUSTESSE[robustesse] : "bg-zinc-200"}`}
                      />
                    );
                  })}
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {LABEL_ROBUSTESSE[robustesse]} — 8 caractères min., au moins un caractère spécial, doit être
                  « robuste » pour valider.
                </p>
              </div>
            )}
          </div>
        </div>
      </fieldset>

      <button
        disabled={pending}
        type="submit"
        className="rounded bg-[#24543c] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1a3f2c] disabled:opacity-60"
      >
        {pending ? "Création…" : "Créer l'EHPAD et son Administrateur"}
      </button>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
