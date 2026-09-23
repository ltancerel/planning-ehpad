"use client";

import { useState } from "react";
import {
  APPLICATIONS,
  type Application,
  type AdministrateurEtablissement,
  type Etablissement,
} from "@/lib/admin-systeme-mock-data";

type NouvelAdministrateur = Omit<AdministrateurEtablissement, "id" | "etablissementId">;

type EtablissementFormProps = {
  valeurInitiale?: Etablissement;
  administrateurs: AdministrateurEtablissement[];
  onValider: (etablissement: Omit<Etablissement, "id">, nouveauxAdministrateurs: NouvelAdministrateur[]) => void;
  onAjouterAdministrateur: (donnees: NouvelAdministrateur) => void;
  onAnnuler: () => void;
};

function basculerApplication(liste: Application[], application: Application): Application[] {
  return liste.includes(application) ? liste.filter((a) => a !== application) : [...liste, application];
}

export default function EtablissementForm({
  valeurInitiale,
  administrateurs,
  onValider,
  onAjouterAdministrateur,
  onAnnuler,
}: EtablissementFormProps) {
  const modeEdition = Boolean(valeurInitiale);
  const [nom, setNom] = useState(valeurInitiale?.nom ?? "");
  const [ville, setVille] = useState(valeurInitiale?.ville ?? "");
  const [statutActif, setStatutActif] = useState(valeurInitiale?.statut !== "inactif");
  const [applications, setApplications] = useState<Application[]>(valeurInitiale?.applications ?? []);
  const [erreur, setErreur] = useState<string | null>(null);

  // En création, les administrateurs saisis sont conservés localement (pas
  // encore d'etablissementId) et créés en même temps que l'établissement —
  // cloisonnement système/établissement oblige, un établissement ne peut pas
  // exister sans au moins un administrateur qui en a la charge.
  const [administrateursEnAttente, setAdministrateursEnAttente] = useState<NouvelAdministrateur[]>([]);
  const [nomAdmin, setNomAdmin] = useState("");
  const [prenomAdmin, setPrenomAdmin] = useState("");
  const [emailAdmin, setEmailAdmin] = useState("");
  const [erreurAdmin, setErreurAdmin] = useState<string | null>(null);

  function valider() {
    if (!nom.trim() || !ville.trim()) {
      setErreur("Le nom et la ville sont obligatoires.");
      return;
    }
    if (!modeEdition && administrateursEnAttente.length === 0) {
      setErreur("Au moins un administrateur doit être créé pour cet établissement.");
      return;
    }
    setErreur(null);
    onValider(
      {
        nom: nom.trim(),
        ville: ville.trim(),
        statut: statutActif ? "actif" : "inactif",
        applications,
        dateCreation: valeurInitiale?.dateCreation ?? new Date().toISOString().slice(0, 10),
      },
      administrateursEnAttente
    );
  }

  function ajouterAdministrateur() {
    if (!nomAdmin.trim() || !prenomAdmin.trim()) {
      setErreurAdmin("Le nom et le prénom sont obligatoires.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(emailAdmin.trim())) {
      setErreurAdmin("Un email valide est requis.");
      return;
    }
    setErreurAdmin(null);
    const nouvel: NouvelAdministrateur = { nom: nomAdmin.trim(), prenom: prenomAdmin.trim(), email: emailAdmin.trim() };
    if (modeEdition) {
      onAjouterAdministrateur(nouvel);
    } else {
      setAdministrateursEnAttente((prev) => [...prev, nouvel]);
      setErreur(null);
    }
    setNomAdmin("");
    setPrenomAdmin("");
    setEmailAdmin("");
  }

  function retirerAdministrateurEnAttente(index: number) {
    setAdministrateursEnAttente((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-800">
          {modeEdition ? "Modifier l'établissement" : "Nouvel établissement"}
        </h2>
        <button onClick={onAnnuler} className="text-zinc-400 hover:text-zinc-600" aria-label="Fermer">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-auto px-4 py-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Nom de l&apos;établissement</label>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            placeholder="Ex : Les Jardins de Rambam"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Ville</label>
          <input
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          />
        </div>

        <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700">
          <input type="checkbox" checked={statutActif} onChange={(e) => setStatutActif(e.target.checked)} />
          Établissement actif
        </label>

        <div>
          <p className="mb-1.5 text-xs font-medium text-zinc-700">Applications souscrites</p>
          <div className="flex flex-col gap-1">
            {APPLICATIONS.map((application) => (
              <label key={application} className="flex cursor-pointer items-center gap-1.5 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={applications.includes(application)}
                  onChange={() => setApplications((prev) => basculerApplication(prev, application))}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-[#0F3A35] focus:ring-[#0F3A35]"
                />
                {application}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded border border-zinc-200 p-3">
          <p className="mb-1 text-xs font-medium text-zinc-700">
            Administrateurs de cet établissement
            {!modeEdition && <span className="text-red-600"> *</span>}
          </p>
          {!modeEdition && (
            <p className="mb-2 text-[11px] text-zinc-400">
              Obligatoire : un administrateur système ne gère pas les données d&apos;un établissement — seul un
              administrateur établissement le peut.
            </p>
          )}

          {modeEdition ? (
            administrateurs.length === 0 ? (
              <p className="mb-3 text-xs text-zinc-400">Aucun administrateur créé pour l&apos;instant.</p>
            ) : (
              <ul className="mb-3 space-y-1">
                {administrateurs.map((admin) => (
                  <li key={admin.id} className="flex items-center justify-between text-xs text-zinc-700">
                    <span>
                      {admin.prenom} {admin.nom}
                    </span>
                    <span className="text-zinc-400">{admin.email}</span>
                  </li>
                ))}
              </ul>
            )
          ) : administrateursEnAttente.length === 0 ? (
            <p className="mb-3 text-xs text-zinc-400">Aucun administrateur ajouté pour l&apos;instant.</p>
          ) : (
            <ul className="mb-3 space-y-1">
              {administrateursEnAttente.map((admin, index) => (
                <li key={index} className="flex items-center justify-between text-xs text-zinc-700">
                  <span>
                    {admin.prenom} {admin.nom}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-zinc-400">{admin.email}</span>
                    <button
                      type="button"
                      onClick={() => retirerAdministrateurEnAttente(index)}
                      aria-label={`Retirer ${admin.prenom} ${admin.nom}`}
                      className="text-zinc-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2 border-t border-zinc-100 pt-2">
            <div className="flex gap-2">
              <input
                value={prenomAdmin}
                onChange={(e) => setPrenomAdmin(e.target.value)}
                placeholder="Prénom"
                className="w-1/2 rounded border border-zinc-300 px-2 py-1.5 text-xs"
              />
              <input
                value={nomAdmin}
                onChange={(e) => setNomAdmin(e.target.value)}
                placeholder="Nom"
                className="w-1/2 rounded border border-zinc-300 px-2 py-1.5 text-xs"
              />
            </div>
            <input
              value={emailAdmin}
              onChange={(e) => setEmailAdmin(e.target.value)}
              placeholder="Email"
              type="email"
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs"
            />
            {erreurAdmin && <p className="text-[11px] font-medium text-red-600">{erreurAdmin}</p>}
            <button
              type="button"
              onClick={ajouterAdministrateur}
              className="w-full rounded border border-[#A7D97A] bg-[#A7D97A]/15 px-2 py-1.5 text-xs font-medium text-[#0F3A35] hover:bg-[#A7D97A]/30"
            >
              + Ajouter un administrateur
            </button>
          </div>
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
          className="rounded bg-[#0F3A35] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2F5B43]"
        >
          {modeEdition ? "Enregistrer" : "Créer"}
        </button>
      </div>
    </div>
  );
}
