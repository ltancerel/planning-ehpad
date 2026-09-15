"use client";

import { useState } from "react";
import type { FicheSalarie, Manager } from "@/lib/mock-data";
import { SERVICES_ORDRE, MANAGERS } from "@/lib/mock-data";

function capitaliser(texte: string): string {
  if (!texte) return texte;
  return texte.charAt(0).toUpperCase() + texte.slice(1).toLowerCase();
}

type SalarieFormProps = {
  valeurInitiale?: FicheSalarie;
  matriculesExistants: string[];
  onValider: (salarie: Omit<FicheSalarie, "id">) => void;
  onAnnuler: () => void;
};

export default function SalarieForm({
  valeurInitiale,
  matriculesExistants,
  onValider,
  onAnnuler,
}: SalarieFormProps) {
  const modeEdition = Boolean(valeurInitiale);
  const [matricule, setMatricule] = useState(valeurInitiale?.matricule ?? "");
  const [nom, setNom] = useState(valeurInitiale?.nom ?? "");
  const [prenom, setPrenom] = useState(valeurInitiale?.prenom ?? "");
  const [service, setService] = useState(valeurInitiale?.service ?? SERVICES_ORDRE[0]);
  const [typeContrat, setTypeContrat] = useState<FicheSalarie["typeContrat"]>(
    valeurInitiale?.typeContrat ?? "CDI"
  );
  const [contratActif, setContratActif] = useState(valeurInitiale?.contratActif ?? true);
  const [manager, setManager] = useState<Manager>(valeurInitiale?.manager ?? "Aucun");
  const [presence, setPresence] = useState<FicheSalarie["presence"]>(valeurInitiale?.presence ?? "Présent");
  const [compteUtilisateur, setCompteUtilisateur] = useState(valeurInitiale?.compteUtilisateur ?? false);
  const [email, setEmail] = useState(valeurInitiale?.email ?? "");
  const [erreur, setErreur] = useState<string | null>(null);

  function changerMatricule(saisie: string) {
    setMatricule(saisie.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4));
  }

  function valider() {
    if (!/^[A-Z]{4}$/.test(matricule)) {
      setErreur("Le matricule doit contenir exactement 4 lettres majuscules.");
      return;
    }
    const autresMatricules = matriculesExistants.filter((m) => m !== valeurInitiale?.matricule);
    if (autresMatricules.includes(matricule)) {
      setErreur("Ce matricule existe déjà.");
      return;
    }
    if (!nom.trim() || !prenom.trim()) {
      setErreur("Le nom et le prénom sont obligatoires.");
      return;
    }
    if (compteUtilisateur && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErreur("Un email valide est requis pour créer un compte utilisateur.");
      return;
    }

    setErreur(null);
    onValider({
      matricule,
      nom: nom.trim().toUpperCase(),
      prenom: capitaliser(prenom.trim()),
      service,
      typeContrat,
      contratActif,
      manager,
      presence,
      compteUtilisateur,
      email: compteUtilisateur ? email.trim() : undefined,
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-800">
          {modeEdition ? "Modifier le salarié" : "Nouveau salarié"}
        </h2>
        <button onClick={onAnnuler} className="text-zinc-400 hover:text-zinc-600" aria-label="Fermer">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-auto px-4 py-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">
            Matricule (4 lettres majuscules)
          </label>
          <input
            value={matricule}
            onChange={(e) => changerMatricule(e.target.value)}
            className="w-24 rounded border border-zinc-300 px-2 py-1.5 text-sm font-semibold uppercase"
            placeholder="ABCD"
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

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-700">Type de contrat</label>
            <select
              value={typeContrat}
              onChange={(e) => setTypeContrat(e.target.value as FicheSalarie["typeContrat"])}
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            >
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700">
              <input
                type="checkbox"
                checked={contratActif}
                onChange={(e) => setContratActif(e.target.checked)}
              />
              Contrat actif
            </label>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Manager</label>
          <select
            value={manager}
            onChange={(e) => setManager(e.target.value as Manager)}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          >
            {MANAGERS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Roulement</label>
          <select disabled className="w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-sm text-zinc-400">
            <option>Aucun roulement créé pour l&apos;instant</option>
          </select>
          <p className="mt-1 text-[11px] text-zinc-400">
            Sera disponible une fois la story « Créer un roulement » construite.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Présence</label>
          <select
            value={presence}
            onChange={(e) => setPresence(e.target.value as FicheSalarie["presence"])}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          >
            <option value="Présent">Présent</option>
            <option value="Absent">Absent</option>
          </select>
        </div>

        <div className="rounded border border-zinc-200 p-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={compteUtilisateur}
              onChange={(e) => setCompteUtilisateur(e.target.checked)}
            />
            Créer un compte utilisateur pour ce salarié
          </label>
          {compteUtilisateur && (
            <div className="mt-2">
              <label className="mb-1 block text-xs font-medium text-zinc-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                placeholder="prenom.nom@ehpad.fr"
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                Un email sera envoyé au salarié pour consulter son planning.
              </p>
            </div>
          )}
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
