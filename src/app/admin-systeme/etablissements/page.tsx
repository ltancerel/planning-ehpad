"use client";

import { useState } from "react";
import {
  ADMINISTRATEURS_DEMO,
  ETABLISSEMENTS_DEMO,
  type AdministrateurEtablissement,
  type Etablissement,
} from "@/lib/admin-systeme-mock-data";
import EtablissementsTable from "@/components/admin-systeme/EtablissementsTable";
import EtablissementForm from "@/components/admin-systeme/EtablissementForm";

let prochainIdEtablissement = ETABLISSEMENTS_DEMO.length + 1;
let prochainIdAdmin = ADMINISTRATEURS_DEMO.length + 1;

export default function EtablissementsAdminSystemePage() {
  const [etablissements, setEtablissements] = useState<Etablissement[]>(ETABLISSEMENTS_DEMO);
  const [administrateurs, setAdministrateurs] = useState<AdministrateurEtablissement[]>(ADMINISTRATEURS_DEMO);
  const [panneau, setPanneau] = useState<"ferme" | "creation" | "edition">("ferme");
  const [etablissementEnEdition, setEtablissementEnEdition] = useState<Etablissement | undefined>(undefined);
  const [messageConfirmation, setMessageConfirmation] = useState<string | null>(null);

  function ouvrirCreation() {
    setEtablissementEnEdition(undefined);
    setPanneau("creation");
  }

  function ouvrirEdition(etablissement: Etablissement) {
    setEtablissementEnEdition(etablissement);
    setPanneau("edition");
  }

  function fermerPanneau() {
    setPanneau("ferme");
    setEtablissementEnEdition(undefined);
  }

  function enregistrer(donnees: Omit<Etablissement, "id">) {
    if (etablissementEnEdition) {
      setEtablissements((prev) =>
        prev.map((e) => (e.id === etablissementEnEdition.id ? { ...donnees, id: e.id } : e))
      );
      setMessageConfirmation(`Établissement ${donnees.nom} mis à jour.`);
      fermerPanneau();
    } else {
      const nouveau: Etablissement = { ...donnees, id: `et${prochainIdEtablissement++}` };
      setEtablissements((prev) => [...prev, nouveau]);
      setMessageConfirmation(`Établissement ${donnees.nom} créé.`);
      fermerPanneau();
    }
    setTimeout(() => setMessageConfirmation(null), 4000);
  }

  function ajouterAdministrateur(donnees: Omit<AdministrateurEtablissement, "id" | "etablissementId">) {
    if (!etablissementEnEdition) return;
    const nouvel: AdministrateurEtablissement = {
      ...donnees,
      id: `ad${prochainIdAdmin++}`,
      etablissementId: etablissementEnEdition.id,
    };
    setAdministrateurs((prev) => [...prev, nouvel]);
  }

  return (
    <div className="relative flex h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-800">Établissements</h1>
            <p className="text-xs text-zinc-500">
              Données non persistées (maquette) — {etablissements.length} établissement
              {etablissements.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={ouvrirCreation}
            className="rounded bg-[#0F3A35] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2F5B43]"
          >
            + Nouvel établissement
          </button>
        </div>

        {messageConfirmation && (
          <div className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
            {messageConfirmation}
          </div>
        )}

        <div className="overflow-hidden rounded border border-zinc-200">
          <EtablissementsTable etablissements={etablissements} onModifier={ouvrirEdition} />
        </div>
      </div>

      {panneau !== "ferme" && (
        <>
          <div className="fixed inset-0 z-20 bg-black/20" onClick={fermerPanneau} />
          <div className="fixed right-0 top-0 z-30 h-full w-full max-w-md border-l border-zinc-200 bg-white shadow-xl">
            <EtablissementForm
              valeurInitiale={etablissementEnEdition}
              administrateurs={administrateurs.filter((a) => a.etablissementId === etablissementEnEdition?.id)}
              onValider={enregistrer}
              onAjouterAdministrateur={ajouterAdministrateur}
              onAnnuler={fermerPanneau}
            />
          </div>
        </>
      )}
    </div>
  );
}
