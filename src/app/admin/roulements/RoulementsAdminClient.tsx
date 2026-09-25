"use client";

import { useState, useTransition } from "react";
import type { Roulement } from "@/lib/mock-data";
import type { HoraireCode } from "@/lib/horaire-codes";
import RoulementsTable from "@/components/admin/RoulementsTable";
import RoulementForm from "@/components/admin/RoulementForm";
import { creerRoulement, modifierRoulement, supprimerRoulement } from "./actions";

export default function RoulementsAdminClient({
  roulements,
  codesHoraires,
}: {
  roulements: Roulement[];
  codesHoraires: HoraireCode[];
}) {
  const [panneau, setPanneau] = useState<"ferme" | "creation" | "edition">("ferme");
  const [roulementEnEdition, setRoulementEnEdition] = useState<Roulement | undefined>(undefined);
  const [erreur, setErreur] = useState<string | null>(null);
  const [messageConfirmation, setMessageConfirmation] = useState<string | null>(null);
  const [pending, demarrer] = useTransition();

  function ouvrirCreation() {
    setRoulementEnEdition(undefined);
    setErreur(null);
    setPanneau("creation");
  }

  function ouvrirEdition(roulement: Roulement) {
    setRoulementEnEdition(roulement);
    setErreur(null);
    setPanneau("edition");
  }

  function fermerPanneau() {
    setPanneau("ferme");
    setRoulementEnEdition(undefined);
    setErreur(null);
  }

  function enregistrer(donnees: Omit<Roulement, "id">) {
    demarrer(async () => {
      if (roulementEnEdition) {
        const resultat = await modifierRoulement(roulementEnEdition.id, donnees.nom, donnees.nbSemaines, donnees.motif);
        if (resultat?.error) {
          setErreur(resultat.error);
          return;
        }
        setMessageConfirmation(`Roulement « ${donnees.nom} » mis à jour.`);
      } else {
        const resultat = await creerRoulement(donnees.nom, donnees.nbSemaines, donnees.motif);
        if (resultat.error) {
          setErreur(resultat.error);
          return;
        }
        setMessageConfirmation(`Roulement « ${donnees.nom} » créé.`);
      }
      fermerPanneau();
      setTimeout(() => setMessageConfirmation(null), 4000);
    });
  }

  function supprimer(roulement: Roulement) {
    if (!confirm(`Supprimer le roulement « ${roulement.nom} » ?`)) return;
    demarrer(async () => {
      const resultat = await supprimerRoulement(roulement.id);
      if (resultat?.error) alert(resultat.error);
    });
  }

  return (
    <div className="relative flex h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-800">Roulements</h1>
            <p className="text-xs text-zinc-500">
              {roulements.length} roulement{roulements.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={ouvrirCreation}
            disabled={codesHoraires.length === 0}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            title={codesHoraires.length === 0 ? "Créez d'abord un code horaire de travail (écran Codes horaires)" : undefined}
          >
            + Nouveau roulement
          </button>
        </div>

        {messageConfirmation && (
          <div className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
            {messageConfirmation}
          </div>
        )}
        {erreur && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {erreur}
          </div>
        )}
        {pending && <p className="mb-3 text-xs text-zinc-400">Enregistrement…</p>}

        <div className="overflow-hidden rounded border border-zinc-200">
          <RoulementsTable
            roulements={roulements}
            codesHoraires={codesHoraires}
            onModifier={ouvrirEdition}
            onSupprimer={supprimer}
          />
        </div>
      </div>

      {panneau !== "ferme" && (
        <>
          <div className="fixed inset-0 z-20 bg-black/20" onClick={fermerPanneau} />
          <div className="fixed right-0 top-0 z-30 h-full w-full max-w-2xl border-l border-zinc-200 bg-white shadow-xl">
            <RoulementForm
              valeurInitiale={roulementEnEdition}
              codesHoraires={codesHoraires}
              onValider={enregistrer}
              onAnnuler={fermerPanneau}
            />
          </div>
        </>
      )}
    </div>
  );
}
