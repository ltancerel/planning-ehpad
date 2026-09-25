"use client";

import { useState, useTransition } from "react";
import {
  ROULEMENTS_DEMO,
  AFFECTATIONS_ROULEMENT_DEMO,
  type AffectationRoulement,
  type FicheSalarie,
} from "@/lib/mock-data";
import SalariesTable from "@/components/admin/SalariesTable";
import SalarieForm, { type ValeurInitialeSalarie } from "@/components/admin/SalarieForm";
import { creerService, enregistrerSalarie, supprimerSalarie, type ChampsSalarie } from "./actions";

export default function SalariesAdminClient({
  salaries,
  services,
}: {
  salaries: ValeurInitialeSalarie[];
  services: { id: string; nom: string }[];
}) {
  const [panneau, setPanneau] = useState<"ferme" | "creation" | "edition">("ferme");
  const [salarieEnEdition, setSalarieEnEdition] = useState<ValeurInitialeSalarie | undefined>(undefined);
  const [erreur, setErreur] = useState<string | null>(null);
  const [messageConfirmation, setMessageConfirmation] = useState<string | null>(null);
  const [affectationsParSalarie, setAffectationsParSalarie] = useState<
    Record<string, AffectationRoulement[]>
  >(AFFECTATIONS_ROULEMENT_DEMO);
  const [nouveauService, setNouveauService] = useState("");
  const [pending, demarrer] = useTransition();

  function ouvrirCreation() {
    setSalarieEnEdition(undefined);
    setErreur(null);
    setPanneau("creation");
  }

  function ouvrirEdition(salarie: FicheSalarie) {
    setSalarieEnEdition(salarie as ValeurInitialeSalarie);
    setErreur(null);
    setPanneau("edition");
  }

  function fermerPanneau() {
    setPanneau("ferme");
    setSalarieEnEdition(undefined);
    setErreur(null);
  }

  function enregistrer(champs: ChampsSalarie) {
    demarrer(async () => {
      const resultat = await enregistrerSalarie(salarieEnEdition?.id, champs);
      if (resultat.error) {
        setErreur(resultat.error);
        return;
      }
      setMessageConfirmation(`Salarié ${champs.prenom} ${champs.nom} enregistré.`);
      fermerPanneau();
      setTimeout(() => setMessageConfirmation(null), 4000);
    });
  }

  function supprimer(salarie: FicheSalarie) {
    if (!confirm(`Supprimer le salarié « ${salarie.prenom} ${salarie.nom} » ?`)) return;
    demarrer(async () => {
      const resultat = await supprimerSalarie(salarie.id);
      if (resultat.error) alert(resultat.error);
    });
  }

  function ajouterService(nom: string) {
    if (!nom.trim()) return;
    demarrer(async () => {
      const formData = new FormData();
      formData.set("nom", nom.trim());
      const resultat = await creerService(undefined, formData);
      if (resultat?.error) setErreur(resultat.error);
      else setNouveauService("");
    });
  }

  function assignerRoulement(salarieId: string, donnees: Omit<AffectationRoulement, "id">) {
    setAffectationsParSalarie((prev) => ({
      ...prev,
      [salarieId]: [...(prev[salarieId] ?? []), { ...donnees, id: `aff-${Date.now()}` }],
    }));
  }

  return (
    <div className="relative flex h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-800">Salariés</h1>
            <p className="text-xs text-zinc-500">
              {salaries.length} salarié{salaries.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={ouvrirCreation}
            disabled={services.length === 0}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            title={services.length === 0 ? "Créez d'abord un service ci-dessous" : undefined}
          >
            + Nouveau salarié
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 rounded border border-zinc-200 bg-zinc-50 p-2">
          <span className="text-xs font-medium text-zinc-500">Services :</span>
          {services.map((s) => (
            <span key={s.id} className="rounded bg-white px-2 py-0.5 text-xs text-zinc-700 shadow-sm">
              {s.nom}
            </span>
          ))}
          {services.length === 0 && <span className="text-xs italic text-zinc-400">aucun</span>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ajouterService(nouveauService);
            }}
            className="ml-auto flex items-center gap-1.5"
          >
            <input
              value={nouveauService}
              onChange={(e) => setNouveauService(e.target.value)}
              placeholder="Nouveau service"
              className="rounded border border-zinc-300 px-2 py-1 text-xs"
            />
            <button
              type="submit"
              disabled={pending || !nouveauService.trim()}
              className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
            >
              + Ajouter
            </button>
          </form>
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
              services={services}
              roulements={ROULEMENTS_DEMO}
              affectationsRoulement={affectationsParSalarie[salarieEnEdition?.id ?? ""] ?? []}
              onValider={enregistrer}
              onAssignerRoulement={(donnees) => assignerRoulement(salarieEnEdition!.id, donnees)}
              onAnnuler={fermerPanneau}
            />
          </div>
        </>
      )}
    </div>
  );
}
