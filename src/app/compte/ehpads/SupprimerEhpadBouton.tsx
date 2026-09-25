"use client";

import { useState, useTransition } from "react";
import { supprimerEhpad } from "./actions";

// Suppression définitive (pas une désactivation) : cascade sur tout ce qui
// dépend de l'EHPAD — comptes, salariés, planning, historique (cf. FK "on
// delete cascade" du modèle de données). Confirmation par saisie du nom,
// vu l'ampleur et l'absence de sauvegarde/restauration pour l'instant
// (EPIC DEV/STAGING/sauvegarde, issue #38, pas encore fait).
export default function SupprimerEhpadBouton({ id, nom }: { id: string; nom: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="text-xs font-medium text-red-600 hover:underline"
      >
        Supprimer
      </button>
    );
  }

  return (
    <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs">
      <p className="mb-1 text-red-800">
        Suppression définitive et irréversible de « {nom} » et de tout ce qui en dépend
        (comptes, salariés, planning, historique). Tape le nom pour confirmer :
      </p>
      <input
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
        className="mb-2 w-full rounded border border-red-300 px-2 py-1"
        placeholder={nom}
      />
      {erreur && <p className="mb-2 text-red-700">{erreur}</p>}
      <div className="flex gap-2">
        <button
          disabled={saisie !== nom || enCours}
          onClick={() =>
            demarrer(async () => {
              const resultat = await supprimerEhpad(id);
              if (resultat.error) {
                setErreur(resultat.error);
              }
            })
          }
          className="rounded bg-red-600 px-2 py-1 font-medium text-white disabled:opacity-40"
        >
          {enCours ? "Suppression…" : "Confirmer la suppression"}
        </button>
        <button
          onClick={() => {
            setOuvert(false);
            setSaisie("");
            setErreur(null);
          }}
          className="rounded border border-zinc-300 px-2 py-1 hover:bg-white"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
