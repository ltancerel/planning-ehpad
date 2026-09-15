"use client";

import { useState } from "react";
import { ANNEES_DEMO, type AnneePlanifiee } from "@/lib/mock-data";
import AnneesTable from "@/components/admin/AnneesTable";
import AnneeForm from "@/components/admin/AnneeForm";

let prochainId = ANNEES_DEMO.length + 1;

export default function AnneesAdminPage() {
  const [annees, setAnnees] = useState<AnneePlanifiee[]>(ANNEES_DEMO);
  const [panneau, setPanneau] = useState<"ferme" | "creation" | "edition">("ferme");
  const [anneeEnEdition, setAnneeEnEdition] = useState<AnneePlanifiee | undefined>(undefined);
  const [messageConfirmation, setMessageConfirmation] = useState<string | null>(null);

  function ouvrirCreation() {
    setAnneeEnEdition(undefined);
    setPanneau("creation");
  }

  function ouvrirEdition(annee: AnneePlanifiee) {
    setAnneeEnEdition(annee);
    setPanneau("edition");
  }

  function fermerPanneau() {
    setPanneau("ferme");
    setAnneeEnEdition(undefined);
  }

  function enregistrer(donnees: Omit<AnneePlanifiee, "id">) {
    if (anneeEnEdition) {
      setAnnees((prev) =>
        prev.map((a) => (a.id === anneeEnEdition.id ? { ...donnees, id: a.id } : a))
      );
      setMessageConfirmation(`Année ${donnees.annee} mise à jour.`);
    } else {
      const nouvelle: AnneePlanifiee = { ...donnees, id: `a${prochainId++}` };
      setAnnees((prev) => [...prev, nouvelle].sort((a, b) => a.annee - b.annee));
      setMessageConfirmation(`Année ${donnees.annee} planifiée.`);
    }
    fermerPanneau();
    setTimeout(() => setMessageConfirmation(null), 4000);
  }

  return (
    <div className="relative flex h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-800">Années</h1>
            <p className="text-xs text-zinc-500">
              Données non persistées (maquette) — {annees.length} année
              {annees.length > 1 ? "s" : ""} planifiée{annees.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={ouvrirCreation}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Planifier une année
          </button>
        </div>

        {messageConfirmation && (
          <div className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
            {messageConfirmation}
          </div>
        )}

        <div className="overflow-hidden rounded border border-zinc-200">
          <AnneesTable annees={annees} onModifier={ouvrirEdition} />
        </div>
      </div>

      {panneau !== "ferme" && (
        <>
          <div className="fixed inset-0 z-20 bg-black/20" onClick={fermerPanneau} />
          <div className="fixed right-0 top-0 z-30 h-full w-full max-w-md border-l border-zinc-200 bg-white shadow-xl">
            <AnneeForm
              valeurInitiale={anneeEnEdition}
              anneesExistantes={annees.map((a) => a.annee)}
              onValider={enregistrer}
              onAnnuler={fermerPanneau}
            />
          </div>
        </>
      )}
    </div>
  );
}
