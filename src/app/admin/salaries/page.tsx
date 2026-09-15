"use client";

import { useState } from "react";
import { FICHES_SALARIES_DEMO, type FicheSalarie } from "@/lib/mock-data";
import SalariesTable from "@/components/admin/SalariesTable";
import SalarieForm from "@/components/admin/SalarieForm";

let prochainId = FICHES_SALARIES_DEMO.length + 1;

export default function SalariesAdminPage() {
  const [salaries, setSalaries] = useState<FicheSalarie[]>(FICHES_SALARIES_DEMO);
  const [panneau, setPanneau] = useState<"ferme" | "creation" | "edition">("ferme");
  const [salarieEnEdition, setSalarieEnEdition] = useState<FicheSalarie | undefined>(undefined);
  const [messageConfirmation, setMessageConfirmation] = useState<string | null>(null);

  function ouvrirCreation() {
    setSalarieEnEdition(undefined);
    setPanneau("creation");
  }

  function ouvrirEdition(salarie: FicheSalarie) {
    setSalarieEnEdition(salarie);
    setPanneau("edition");
  }

  function fermerPanneau() {
    setPanneau("ferme");
    setSalarieEnEdition(undefined);
  }

  function enregistrer(donnees: Omit<FicheSalarie, "id">) {
    if (salarieEnEdition) {
      setSalaries((prev) =>
        prev.map((s) => (s.id === salarieEnEdition.id ? { ...donnees, id: s.id } : s))
      );
      setMessageConfirmation(`Salarié ${donnees.prenom} ${donnees.nom} mis à jour.`);
    } else {
      const nouveau: FicheSalarie = { ...donnees, id: `fs${prochainId++}` };
      setSalaries((prev) => [...prev, nouveau]);
      setMessageConfirmation(
        donnees.compteUtilisateur
          ? `Salarié créé — un email de consultation a été "envoyé" à ${donnees.email}.`
          : `Salarié ${donnees.prenom} ${donnees.nom} créé.`
      );
    }
    fermerPanneau();
    setTimeout(() => setMessageConfirmation(null), 4000);
  }

  function supprimer(salarie: FicheSalarie) {
    if (confirm(`Supprimer le salarié « ${salarie.prenom} ${salarie.nom} » ?`)) {
      setSalaries((prev) => prev.filter((s) => s.id !== salarie.id));
    }
  }

  return (
    <div className="relative flex h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-800">Salariés</h1>
            <p className="text-xs text-zinc-500">
              Données non persistées (maquette) — {salaries.length} salarié
              {salaries.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={ouvrirCreation}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nouveau salarié
          </button>
        </div>

        {messageConfirmation && (
          <div className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
            {messageConfirmation}
          </div>
        )}

        <div className="overflow-hidden rounded border border-zinc-200">
          <SalariesTable salaries={salaries} onModifier={ouvrirEdition} onSupprimer={supprimer} />
        </div>
      </div>

      {panneau !== "ferme" && (
        <>
          <div className="fixed inset-0 z-20 bg-black/20" onClick={fermerPanneau} />
          <div className="fixed right-0 top-0 z-30 h-full w-full max-w-md border-l border-zinc-200 bg-white shadow-xl">
            <SalarieForm
              valeurInitiale={salarieEnEdition}
              matriculesExistants={salaries.map((s) => s.matricule)}
              onValider={enregistrer}
              onAnnuler={fermerPanneau}
            />
          </div>
        </>
      )}
    </div>
  );
}
