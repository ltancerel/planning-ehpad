"use client";

import { useState } from "react";
import { UTILISATEURS_DEMO, type Utilisateur } from "@/lib/mock-data";
import UtilisateursTable from "@/components/admin/UtilisateursTable";
import UtilisateurForm from "@/components/admin/UtilisateurForm";

let prochainId = UTILISATEURS_DEMO.length + 1;

export default function UtilisateursAdminPage() {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>(UTILISATEURS_DEMO);
  const [panneau, setPanneau] = useState<"ferme" | "creation" | "edition">("ferme");
  const [utilisateurEnEdition, setUtilisateurEnEdition] = useState<Utilisateur | undefined>(undefined);
  const [messageConfirmation, setMessageConfirmation] = useState<string | null>(null);

  function ouvrirCreation() {
    setUtilisateurEnEdition(undefined);
    setPanneau("creation");
  }

  function ouvrirEdition(utilisateur: Utilisateur) {
    setUtilisateurEnEdition(utilisateur);
    setPanneau("edition");
  }

  function fermerPanneau() {
    setPanneau("ferme");
    setUtilisateurEnEdition(undefined);
  }

  function enregistrer(donnees: Omit<Utilisateur, "id">) {
    if (utilisateurEnEdition) {
      setUtilisateurs((prev) =>
        prev.map((u) => (u.id === utilisateurEnEdition.id ? { ...donnees, id: u.id } : u))
      );
      setMessageConfirmation(`Utilisateur ${donnees.prenom} ${donnees.nom} mis à jour.`);
    } else {
      const nouvel: Utilisateur = { ...donnees, id: `u${prochainId++}` };
      setUtilisateurs((prev) => [...prev, nouvel]);
      setMessageConfirmation(
        `Utilisateur créé — un email de configuration du mot de passe a été "envoyé" à ${donnees.email}.`
      );
    }
    fermerPanneau();
    setTimeout(() => setMessageConfirmation(null), 4000);
  }

  function supprimer(utilisateur: Utilisateur) {
    if (confirm(`Supprimer l'utilisateur « ${utilisateur.prenom} ${utilisateur.nom} » ?`)) {
      setUtilisateurs((prev) => prev.filter((u) => u.id !== utilisateur.id));
    }
  }

  return (
    <div className="relative flex h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-800">Utilisateurs</h1>
            <p className="text-xs text-zinc-500">
              Données non persistées (maquette) — {utilisateurs.length} utilisateur
              {utilisateurs.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={ouvrirCreation}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nouvel utilisateur
          </button>
        </div>

        {messageConfirmation && (
          <div className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
            {messageConfirmation}
          </div>
        )}

        <div className="overflow-hidden rounded border border-zinc-200">
          <UtilisateursTable utilisateurs={utilisateurs} onModifier={ouvrirEdition} onSupprimer={supprimer} />
        </div>
      </div>

      {panneau !== "ferme" && (
        <>
          <div className="fixed inset-0 z-20 bg-black/20" onClick={fermerPanneau} />
          <div className="fixed right-0 top-0 z-30 h-full w-full max-w-md border-l border-zinc-200 bg-white shadow-xl">
            <UtilisateurForm
              valeurInitiale={utilisateurEnEdition}
              identifiantsExistants={utilisateurs.map((u) => u.identifiant)}
              onValider={enregistrer}
              onAnnuler={fermerPanneau}
            />
          </div>
        </>
      )}
    </div>
  );
}
