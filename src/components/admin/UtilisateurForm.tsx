"use client";

import { useState } from "react";
import type { Utilisateur } from "@/lib/mock-data";
import { SERVICES_ORDRE } from "@/lib/mock-data";

const TYPES_UTILISATEUR: Utilisateur["typeUtilisateur"][] = ["Administrateur", "Utilisateur"];

type UtilisateurFormProps = {
  valeurInitiale?: Utilisateur;
  identifiantsExistants: string[];
  onValider: (utilisateur: Omit<Utilisateur, "id">) => void;
  onAnnuler: () => void;
};

export default function UtilisateurForm({
  valeurInitiale,
  identifiantsExistants,
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
  const [service, setService] = useState(valeurInitiale?.service ?? SERVICES_ORDRE[0]);
  const [poste, setPoste] = useState(valeurInitiale?.poste ?? "");
  const [erreur, setErreur] = useState<string | null>(null);

  function changerIdentifiant(saisie: string) {
    setIdentifiant(saisie.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3));
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
      service,
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
            onChange={(e) => setTypeUtilisateur(e.target.value as Utilisateur["typeUtilisateur"])}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          >
            {TYPES_UTILISATEUR.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Service</label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          >
            {SERVICES_ORDRE.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

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
