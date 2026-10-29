"use client";

import { useState } from "react";
import type { Utilisateur } from "@/lib/mock-data";

const TYPES_UTILISATEUR: Utilisateur["typeUtilisateur"][] = ["Administrateur", "Manager", "Utilisateur"];

export type ServiceOption = { id: string; nom: string; responsableId: string | null; responsableNom: string | null };

type UtilisateurFormProps = {
  valeurInitiale?: Utilisateur;
  identifiantsExistants: string[];
  services: ServiceOption[];
  onValider: (utilisateur: Omit<Utilisateur, "id">) => void;
  onAnnuler: () => void;
};

export default function UtilisateurForm({
  valeurInitiale,
  identifiantsExistants,
  services,
  onValider,
  onAnnuler,
}: UtilisateurFormProps) {
  const modeEdition = Boolean(valeurInitiale);
  const [identifiant, setIdentifiant] = useState(valeurInitiale?.identifiant ?? "");
  const [nom, setNom] = useState(valeurInitiale?.nom ?? "");
  const [prenom, setPrenom] = useState(valeurInitiale?.prenom ?? "");
  const [email, setEmail] = useState(valeurInitiale?.email ?? "");
  const [typeUtilisateur, setTypeUtilisateur] = useState<Utilisateur["typeUtilisateur"]>(
    valeurInitiale?.typeUtilisateur ?? "Utilisateur"
  );
  const [servicesSelectionnes, setServicesSelectionnes] = useState<Set<string>>(
    new Set(valeurInitiale?.services ?? [])
  );
  const [poste, setPoste] = useState(valeurInitiale?.poste ?? "");
  const [erreur, setErreur] = useState<string | null>(null);

  function changerIdentifiant(saisie: string) {
    setIdentifiant(saisie.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3));
  }

  function basculerService(nomService: string) {
    setServicesSelectionnes((precedent) => {
      const copie = new Set(precedent);
      if (copie.has(nomService)) copie.delete(nomService);
      else copie.add(nomService);
      return copie;
    });
  }

  // Un utilisateur ne peut jamais être responsable d'un service (retour
  // client du 29/10) : on vide la sélection dès qu'on bascule sur ce type,
  // plutôt que de la laisser masquée mais toujours présente en mémoire.
  function changerType(type: Utilisateur["typeUtilisateur"]) {
    setTypeUtilisateur(type);
    if (type === "Utilisateur") setServicesSelectionnes(new Set());
  }

  function valider() {
    if (!/^[A-Z]{3}$/.test(identifiant)) {
      setErreur("L'identifiant doit contenir exactement 3 lettres majuscules.");
      return;
    }
    const autresIdentifiants = identifiantsExistants.filter((i) => i !== valeurInitiale?.identifiant);
    if (autresIdentifiants.includes(identifiant)) {
      setErreur("Cet identifiant existe déjà.");
      return;
    }
    if (!nom.trim() || !prenom.trim()) {
      setErreur("Le nom et le prénom sont obligatoires.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErreur("L'email n'est pas valide.");
      return;
    }

    setErreur(null);
    onValider({
      identifiant,
      nom: nom.trim().toUpperCase(),
      prenom: prenom.trim(),
      email: email.trim(),
      typeUtilisateur,
      services: typeUtilisateur === "Utilisateur" ? [] : Array.from(servicesSelectionnes),
      poste: poste.trim(),
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-800">
          {modeEdition ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
        </h2>
        <button onClick={onAnnuler} className="text-zinc-400 hover:text-zinc-600" aria-label="Fermer">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-auto px-4 py-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">
            Identifiant (3 lettres majuscules)
          </label>
          <input
            value={identifiant}
            onChange={(e) => changerIdentifiant(e.target.value)}
            className="w-24 rounded border border-zinc-300 px-2 py-1.5 text-sm font-semibold uppercase"
            placeholder="ABC"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-700">Nom</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-700">Prénom</label>
            <input
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            placeholder="prenom.nom@ehpad.fr"
          />
          <p className="mt-1 text-[11px] text-zinc-400">
            Un email sera envoyé à l&apos;utilisateur pour configurer son mot de passe.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Type d&apos;utilisateur</label>
          <select
            value={typeUtilisateur}
            onChange={(e) => changerType(e.target.value as Utilisateur["typeUtilisateur"])}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          >
            {TYPES_UTILISATEUR.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-zinc-400">
            Administrateur : tous les droits, dont le menu Administration. Manager : peut modifier le
            planning, sans accès au menu Administration. Utilisateur : consultation seule.
          </p>
        </div>

        {typeUtilisateur !== "Utilisateur" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Services ({typeUtilisateur === "Administrateur" ? "dont il est administrateur" : "dont il est manager"})
            </label>
            <div className="flex flex-col gap-1 rounded border border-zinc-300 p-2">
              {services.map((s) => {
                const prisParAutre = s.responsableId !== null && s.responsableId !== valeurInitiale?.id;
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-1.5 text-sm ${
                      prisParAutre ? "cursor-not-allowed text-zinc-400" : "cursor-pointer text-zinc-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={servicesSelectionnes.has(s.nom)}
                      disabled={prisParAutre}
                      onChange={() => basculerService(s.nom)}
                      className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    {s.nom}
                    {prisParAutre && (
                      <span className="text-[11px] text-zinc-400">— déjà affecté à {s.responsableNom}</span>
                    )}
                  </label>
                );
              })}
              {services.length === 0 && <p className="text-xs italic text-zinc-400">Aucun service créé.</p>}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Poste</label>
          <input
            value={poste}
            onChange={(e) => setPoste(e.target.value)}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            placeholder="Ex : Infirmière coordinatrice"
          />
        </div>

        {erreur && <p className="text-xs font-medium text-red-600">{erreur}</p>}
      </div>

      <div className="flex justify-end gap-2 border-t border-zinc-200 px-4 py-3">
        <button
          onClick={onAnnuler}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Annuler
        </button>
        <button
          onClick={valider}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {modeEdition ? "Enregistrer" : "Créer"}
        </button>
      </div>
    </div>
  );
}
