"use client";

import { useState } from "react";
import type { AffectationRoulement, GroupeRoulement, FicheSalarie, Manager, Roulement } from "@/lib/mock-data";
import { MANAGERS, GROUPES_ROULEMENT, affectationActuelle } from "@/lib/mock-data";
import { formatDateISO, formatJourMois, parseDateISO } from "@/lib/dates";
import RoulementSalariePanel from "@/components/admin/RoulementSalariePanel";
import type { ChampsSalarie } from "@/app/admin/salaries/actions";

function capitaliser(texte: string): string {
  if (!texte) return texte;
  return texte.charAt(0).toUpperCase() + texte.slice(1).toLowerCase();
}

export type ValeurInitialeSalarie = FicheSalarie & { serviceId: string };

type SalarieFormProps = {
  valeurInitiale?: ValeurInitialeSalarie;
  matriculesExistants: string[];
  services: { id: string; nom: string }[];
  roulements: Roulement[];
  affectationsRoulement: AffectationRoulement[];
  onValider: (champs: ChampsSalarie) => void;
  onAssignerRoulement: (donnees: Omit<AffectationRoulement, "id">) => void;
  onAnnuler: () => void;
};

export default function SalarieForm({
  valeurInitiale,
  matriculesExistants,
  services,
  roulements,
  affectationsRoulement,
  onValider,
  onAssignerRoulement,
  onAnnuler,
}: SalarieFormProps) {
  const modeEdition = Boolean(valeurInitiale);
  const [matricule, setMatricule] = useState(valeurInitiale?.matricule ?? "");
  const [nom, setNom] = useState(valeurInitiale?.nom ?? "");
  const [prenom, setPrenom] = useState(valeurInitiale?.prenom ?? "");
  const [serviceId, setServiceId] = useState(valeurInitiale?.serviceId ?? services[0]?.id ?? "");
  const [typeContrat, setTypeContrat] = useState<FicheSalarie["typeContrat"]>(
    valeurInitiale?.typeContrat ?? "CDI"
  );
  const [contratActif, setContratActif] = useState(valeurInitiale?.contratActif ?? true);
  const [manager, setManager] = useState<Manager>(valeurInitiale?.manager ?? "Aucun");
  const [groupeRoulement, setGroupeRoulement] = useState<GroupeRoulement>(
    valeurInitiale?.groupeRoulement ?? GROUPES_ROULEMENT[0]
  );
  const [presence, setPresence] = useState<FicheSalarie["presence"]>(valeurInitiale?.presence ?? "Présent");
  const [erreur, setErreur] = useState<string | null>(null);
  const [panneauRoulementOuvert, setPanneauRoulementOuvert] = useState(false);
  const dateReferenceISO = formatDateISO(new Date());
  const roulementActuel = affectationActuelle(affectationsRoulement, dateReferenceISO);
  const nomRoulementActuel = roulementActuel
    ? roulements.find((r) => r.id === roulementActuel.roulementId)?.nom
    : undefined;

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
    if (!serviceId) {
      setErreur("Un service est requis (créez-en un d'abord si la liste est vide).");
      return;
    }
    setErreur(null);
    onValider({
      matricule,
      nom: nom.trim().toUpperCase(),
      prenom: capitaliser(prenom.trim()),
      serviceId,
      typeContrat,
      contratActif,
      manager,
      alignementRoulement: groupeRoulement,
      presence,
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
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
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

        <div className="flex gap-3">
          <div className="flex-1">
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
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-700">Alignement roulement</label>
            <select
              value={groupeRoulement}
              onChange={(e) => setGroupeRoulement(e.target.value as GroupeRoulement)}
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            >
              {GROUPES_ROULEMENT.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded border border-zinc-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-700">Roulement</p>
              {modeEdition ? (
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {roulementActuel && nomRoulementActuel
                    ? `${nomRoulementActuel} — depuis le ${formatJourMois(parseDateISO(roulementActuel.dateDebut))}`
                    : "Aucun roulement assigné"}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-zinc-400">
                  Aucun par défaut — assignable après création.
                </p>
              )}
            </div>
            {modeEdition && (
              <button
                type="button"
                onClick={() => setPanneauRoulementOuvert(true)}
                className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Gérer
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            Pas encore relié à la base (story #35 restante) — assignation locale à cet écran
            uniquement pour l&apos;instant.
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

      {modeEdition && panneauRoulementOuvert && (
        <RoulementSalariePanel
          nomComplet={`${prenom} ${nom}`}
          roulements={roulements}
          affectations={affectationsRoulement}
          dateReferenceISO={dateReferenceISO}
          onAssigner={onAssignerRoulement}
          onFermer={() => setPanneauRoulementOuvert(false)}
        />
      )}
    </div>
  );
}
