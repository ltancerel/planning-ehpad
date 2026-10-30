"use client";

import { useState, useTransition } from "react";
import type { Utilisateur } from "@/lib/mock-data";
import UtilisateursTable from "@/components/admin/UtilisateursTable";
import UtilisateurForm from "@/components/admin/UtilisateurForm";
import {
  creerService,
  creerUtilisateur,
  modifierService,
  modifierUtilisateur,
  supprimerService,
  supprimerUtilisateur,
} from "./actions";

export default function UtilisateursAdminClient({
  utilisateurs,
  services,
}: {
  utilisateurs: Utilisateur[];
  services: { id: string; nom: string }[];
}) {
  const [panneau, setPanneau] = useState<"ferme" | "creation" | "edition">("ferme");
  const [utilisateurEnEdition, setUtilisateurEnEdition] = useState<Utilisateur | undefined>(undefined);
  const [erreur, setErreur] = useState<string | null>(null);
  const [messageConfirmation, setMessageConfirmation] = useState<string | null>(null);
  const [nouveauService, setNouveauService] = useState("");
  const [formulaireServiceOuvert, setFormulaireServiceOuvert] = useState(false);
  const [serviceEnRenommage, setServiceEnRenommage] = useState<string | null>(null);
  const [nomServiceRenomme, setNomServiceRenomme] = useState("");
  const [pending, demarrer] = useTransition();

  // Pour chaque service, qui en est déjà responsable (si quelqu'un) —
  // dérivé des utilisateurs déjà chargés, pas besoin d'une requête
  // dédiée. Permet au formulaire de griser les services déjà pris par un
  // AUTRE compte que celui en cours d'édition (retour client du 29/10).
  const responsableParService = new Map<string, { id: string; nom: string }>();
  for (const u of utilisateurs) {
    for (const nomService of u.services) {
      responsableParService.set(nomService, { id: u.id, nom: `${u.prenom} ${u.nom}` });
    }
  }
  const servicesAvecResponsable = services.map((s) => {
    const responsable = responsableParService.get(s.nom);
    return {
      id: s.id,
      nom: s.nom,
      responsableId: responsable?.id ?? null,
      responsableNom: responsable?.nom ?? null,
    };
  });

  function ouvrirCreation() {
    setUtilisateurEnEdition(undefined);
    setErreur(null);
    setPanneau("creation");
  }

  function ouvrirEdition(utilisateur: Utilisateur) {
    setUtilisateurEnEdition(utilisateur);
    setErreur(null);
    setPanneau("edition");
  }

  function fermerPanneau() {
    setPanneau("ferme");
    setUtilisateurEnEdition(undefined);
    setErreur(null);
  }

  function enregistrer(donnees: Omit<Utilisateur, "id">) {
    demarrer(async () => {
      if (utilisateurEnEdition) {
        const resultat = await modifierUtilisateur(utilisateurEnEdition.id, donnees);
        if (resultat?.error) {
          setErreur(resultat.error);
          return;
        }
        setMessageConfirmation(`Utilisateur ${donnees.prenom} ${donnees.nom} mis à jour.`);
      } else {
        const resultat = await creerUtilisateur(donnees);
        if (resultat.error) {
          setErreur(resultat.error);
          return;
        }
        setMessageConfirmation(
          `Utilisateur créé — un email de configuration du mot de passe a été envoyé à ${donnees.email}.`
        );
      }
      fermerPanneau();
      setTimeout(() => setMessageConfirmation(null), 6000);
    });
  }

  function supprimer(utilisateur: Utilisateur) {
    if (!confirm(`Supprimer l'utilisateur « ${utilisateur.prenom} ${utilisateur.nom} » ?`)) return;
    demarrer(async () => {
      const resultat = await supprimerUtilisateur(utilisateur.id);
      if (resultat?.error) alert(resultat.error);
    });
  }

  function ajouterService(nom: string) {
    if (!nom.trim()) return;
    demarrer(async () => {
      const formData = new FormData();
      formData.set("nom", nom.trim());
      const resultat = await creerService(undefined, formData);
      if (resultat?.error) setErreur(resultat.error);
      else {
        setNouveauService("");
        setFormulaireServiceOuvert(false);
      }
    });
  }

  function ouvrirRenommageService(service: { id: string; nom: string }) {
    setErreur(null);
    setServiceEnRenommage(service.id);
    setNomServiceRenomme(service.nom);
  }

  function renommerService() {
    if (!serviceEnRenommage || !nomServiceRenomme.trim()) return;
    demarrer(async () => {
      const resultat = await modifierService(serviceEnRenommage, nomServiceRenomme.trim());
      if (resultat?.error) setErreur(resultat.error);
      else setServiceEnRenommage(null);
    });
  }

  function supprimerServiceConfirme(service: { id: string; nom: string }) {
    if (!confirm(`Supprimer le service « ${service.nom} » ?`)) return;
    demarrer(async () => {
      const resultat = await supprimerService(service.id);
      if (resultat?.error) alert(resultat.error);
    });
  }

  return (
    <div className="relative flex h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-800">Utilisateurs</h1>
            <p className="text-xs text-zinc-500">
              {utilisateurs.length} utilisateur{utilisateurs.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={ouvrirCreation}
            disabled={services.length === 0}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            title={services.length === 0 ? "Créez d'abord un service ci-dessous" : undefined}
          >
            + Nouvel utilisateur
          </button>
        </div>

        <div className="mb-4 rounded border border-zinc-200 bg-zinc-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-800">Services</h2>
            <button
              onClick={() => setFormulaireServiceOuvert((v) => !v)}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Ajouter un service
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {services.map((s) =>
              serviceEnRenommage === s.id ? (
                <form
                  key={s.id}
                  onSubmit={(e) => {
                    e.preventDefault();
                    renommerService();
                  }}
                  className="flex items-center gap-1"
                >
                  <input
                    autoFocus
                    value={nomServiceRenomme}
                    onChange={(e) => setNomServiceRenomme(e.target.value)}
                    className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={pending || !nomServiceRenomme.trim()}
                    className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-40"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceEnRenommage(null)}
                    className="text-xs text-zinc-400 hover:underline"
                  >
                    Annuler
                  </button>
                </form>
              ) : (
                <span
                  key={s.id}
                  className="flex items-center gap-1 rounded bg-white px-2 py-0.5 text-xs text-zinc-700 shadow-sm"
                >
                  {s.nom}
                  <button
                    type="button"
                    onClick={() => ouvrirRenommageService(s)}
                    className="text-zinc-400 hover:text-blue-600"
                    title={`Renommer ${s.nom}`}
                    aria-label={`Renommer ${s.nom}`}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => supprimerServiceConfirme(s)}
                    className="text-zinc-400 hover:text-red-600"
                    title={`Supprimer ${s.nom}`}
                    aria-label={`Supprimer ${s.nom}`}
                  >
                    ✕
                  </button>
                </span>
              )
            )}
            {services.length === 0 && (
              <span className="text-xs italic text-zinc-400">Aucun service pour l&apos;instant.</span>
            )}
          </div>

          {formulaireServiceOuvert && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ajouterService(nouveauService);
              }}
              className="mt-2 flex items-center gap-1.5"
            >
              <input
                autoFocus
                value={nouveauService}
                onChange={(e) => setNouveauService(e.target.value)}
                placeholder="Nom du service"
                className="rounded border border-zinc-300 px-2 py-1 text-xs"
              />
              <button
                type="submit"
                disabled={pending || !nouveauService.trim()}
                className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormulaireServiceOuvert(false);
                  setNouveauService("");
                }}
                className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
              >
                Annuler
              </button>
            </form>
          )}
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
              services={servicesAvecResponsable}
              onValider={enregistrer}
              onAnnuler={fermerPanneau}
            />
          </div>
        </>
      )}
    </div>
  );
}
