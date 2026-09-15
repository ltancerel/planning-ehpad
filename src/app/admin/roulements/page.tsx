"use client";

import { useState } from "react";
import { ROULEMENTS_DEMO, type Roulement } from "@/lib/mock-data";
import RoulementsTable from "@/components/admin/RoulementsTable";
import RoulementForm from "@/components/admin/RoulementForm";

let prochainId = ROULEMENTS_DEMO.length + 1;

export default function RoulementsAdminPage() {
  const [roulements, setRoulements] = useState<Roulement[]>(ROULEMENTS_DEMO);
  const [panneau, setPanneau] = useState<"ferme" | "creation" | "edition">("ferme");
  const [roulementEnEdition, setRoulementEnEdition] = useState<Roulement | undefined>(undefined);
  const [messageConfirmation, setMessageConfirmation] = useState<string | null>(null);

  function ouvrirCreation() {
    setRoulementEnEdition(undefined);
    setPanneau("creation");
  }

  function ouvrirEdition(roulement: Roulement) {
    setRoulementEnEdition(roulement);
    setPanneau("edition");
  }

  function fermerPanneau() {
    setPanneau("ferme");
    setRoulementEnEdition(undefined);
  }

  function enregistrer(donnees: Omit<Roulement, "id">) {
    // Un seul roulement par défaut à la fois : en activer un désactive les autres.
    const retirerAutresDefauts = (liste: Roulement[]) =>
      donnees.parDefaut ? liste.map((r) => ({ ...r, parDefaut: false })) : liste;

    if (roulementEnEdition) {
      setRoulements((prev) =>
        retirerAutresDefauts(prev).map((r) =>
          r.id === roulementEnEdition.id ? { ...donnees, id: r.id } : r
        )
      );
      setMessageConfirmation(`Roulement « ${donnees.nom} » mis à jour.`);
    } else {
      const nouveau: Roulement = { ...donnees, id: `r${prochainId++}` };
      setRoulements((prev) => [...retirerAutresDefauts(prev), nouveau]);
      setMessageConfirmation(`Roulement « ${donnees.nom} » créé.`);
    }
    fermerPanneau();
    setTimeout(() => setMessageConfirmation(null), 4000);
  }

  function supprimer(roulement: Roulement) {
    if (confirm(`Supprimer le roulement « ${roulement.nom} » ?`)) {
      setRoulements((prev) => prev.filter((r) => r.id !== roulement.id));
    }
  }

  return (
    <div className="relative flex h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-800">Roulements</h1>
            <p className="text-xs text-zinc-500">
              Données non persistées (maquette) — {roulements.length} roulement
              {roulements.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={ouvrirCreation}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nouveau roulement
          </button>
        </div>

        {messageConfirmation && (
          <div className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
            {messageConfirmation}
          </div>
        )}

        <div className="overflow-hidden rounded border border-zinc-200">
          <RoulementsTable roulements={roulements} onModifier={ouvrirEdition} onSupprimer={supprimer} />
        </div>
      </div>

      {panneau !== "ferme" && (
        <>
          <div className="fixed inset-0 z-20 bg-black/20" onClick={fermerPanneau} />
          <div className="fixed right-0 top-0 z-30 h-full w-full max-w-2xl border-l border-zinc-200 bg-white shadow-xl">
            <RoulementForm valeurInitiale={roulementEnEdition} onValider={enregistrer} onAnnuler={fermerPanneau} />
          </div>
        </>
      )}
    </div>
  );
}
