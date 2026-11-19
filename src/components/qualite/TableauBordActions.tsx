"use client";

import { useState } from "react";
import {
  ACTIONS_DEMO,
  LIBELLES_STATUT,
  STATUTS,
  type ActionQualite,
  type StatutAction,
} from "@/lib/actions-paqg-data";

// EPIC Multi-application (#46), story #47 (maquette) — reprend le tableau
// de bord maquetté sur experiment/qualite-maquette, avec les modifications
// demandées : vignettes d'indicateur restylées (carte colorée, chiffre
// dans la vignette), colonne « Organe de décision » retirée, statut d'une
// action modifiable directement, ajout d'une action possible. Entièrement
// local (useState) : rien n'est persisté, cohérent avec une maquette sans
// backend — l'ajout/la modification de statut sera réservé aux comptes
// Administrateur et Manager une fois cette application réellement
// construite (pas de système de rôle dans cette maquette, donc pas de
// restriction ici).

function IndicateurTuile({
  valeur,
  label,
  degrade,
}: {
  valeur: number;
  label: string;
  degrade: string;
}) {
  return (
    <div
      className={`flex aspect-square flex-col items-center justify-center rounded-2xl bg-gradient-to-br p-4 text-center text-white shadow-md ${degrade}`}
    >
      <div className="text-4xl font-bold">{valeur}</div>
      <div className="mt-1.5 text-xs font-medium leading-snug text-white/90">{label}</div>
    </div>
  );
}

const STYLES_ORIGINE: Record<ActionQualite["origineBadge"], string> = {
  DUERP: "bg-amber-100 text-amber-800",
  HAS: "bg-teal-100 text-teal-800",
};

const STYLES_STATUT: Record<StatutAction, string> = {
  a_faire: "bg-zinc-100 text-zinc-700",
  en_cours: "bg-blue-100 text-blue-800",
  fait: "bg-emerald-100 text-emerald-800",
};

const DATE_REFERENCE = "2026-09-17";

function estEnRetard(action: ActionQualite): boolean {
  if (action.statut === "fait") return false;
  if (action.echeanceLabel === "À définir") return false;
  return action.echeance < DATE_REFERENCE;
}

const NOUVELLE_ACTION_VIDE = { intitule: "", responsable: "", echeance: "" };

export default function TableauBordActions() {
  const [actions, setActions] = useState<ActionQualite[]>(ACTIONS_DEMO);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [nouvelleAction, setNouvelleAction] = useState(NOUVELLE_ACTION_VIDE);

  const actionsAFaire = actions.filter((a) => a.statut !== "fait").length;
  const actionsEnRetard = actions.filter(estEnRetard).length;

  function changerStatut(id: string, statut: StatutAction) {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, statut } : a)));
  }

  function ajouterAction() {
    if (!nouvelleAction.intitule.trim()) return;
    setActions((prev) => [
      {
        id: `nouvelle-${Date.now()}`,
        origineBadge: "DUERP",
        origineTexte: "Ajoutée manuellement",
        intitule: nouvelleAction.intitule.trim(),
        responsable: nouvelleAction.responsable.trim() || "À définir",
        echeance: nouvelleAction.echeance || "2099-12-31",
        echeanceLabel: nouvelleAction.echeance ? undefined : "À définir",
        statut: "a_faire",
      },
      ...prev,
    ]);
    setNouvelleAction(NOUVELLE_ACTION_VIDE);
    setFormulaireOuvert(false);
  }

  const triees = [...actions].sort((a, b) => a.echeance.localeCompare(b.echeance));

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-zinc-900">Tableau de bord Actions PAQG</h1>
      <p className="mt-1 max-w-2xl text-sm text-zinc-500">
        Vue unifiée du plan d&apos;action qualité de l&apos;établissement, alimenté par le document
        unique d&apos;évaluation des risques professionnels (DUERP) et le référentiel d&apos;évaluation
        HAS.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <IndicateurTuile valeur={3} label="Risques DUERP élevés (résiduel)" degrade="from-rose-500 to-rose-600" />
        <IndicateurTuile valeur={2} label="Critères impératifs à traiter" degrade="from-amber-500 to-amber-600" />
        <IndicateurTuile valeur={actionsAFaire} label="Actions non terminées" degrade="from-blue-500 to-blue-600" />
        <IndicateurTuile valeur={actionsEnRetard} label="Actions en retard" degrade="from-red-600 to-red-700" />
      </div>

      <div className="mt-8 mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Plan d&apos;action</h2>
        <button
          onClick={() => setFormulaireOuvert((v) => !v)}
          className="rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
        >
          {formulaireOuvert ? "Annuler" : "+ Ajouter une action"}
        </button>
      </div>

      {formulaireOuvert && (
        <div className="mb-4 rounded border border-zinc-200 bg-zinc-50 p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              type="text"
              placeholder="Intitulé de l'action"
              value={nouvelleAction.intitule}
              onChange={(e) => setNouvelleAction((v) => ({ ...v, intitule: e.target.value }))}
              className="rounded border border-zinc-300 px-2 py-1.5 text-sm sm:col-span-3"
            />
            <input
              type="text"
              placeholder="Responsable"
              value={nouvelleAction.responsable}
              onChange={(e) => setNouvelleAction((v) => ({ ...v, responsable: e.target.value }))}
              className="rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
            <input
              type="date"
              value={nouvelleAction.echeance}
              onChange={(e) => setNouvelleAction((v) => ({ ...v, echeance: e.target.value }))}
              className="rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
            <button
              onClick={ajouterAction}
              disabled={!nouvelleAction.intitule.trim()}
              className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded border border-zinc-200">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2">Origine</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Responsable</th>
              <th className="px-3 py-2">Échéance</th>
              <th className="px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {triees.map((action) => {
              const retard = estEnRetard(action);
              return (
                <tr key={action.id} className="border-t border-zinc-100 align-top">
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${STYLES_ORIGINE[action.origineBadge]}`}
                    >
                      {action.origineBadge}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-zinc-800">{action.intitule}</div>
                    <div className="text-xs text-zinc-500">{action.origineTexte}</div>
                  </td>
                  <td className="px-3 py-2 text-zinc-700">{action.responsable}</td>
                  <td className={`px-3 py-2 ${retard ? "font-semibold text-red-600" : "text-zinc-700"}`}>
                    {action.echeanceLabel ?? new Date(action.echeance).toLocaleDateString("fr-FR")}
                    {retard && <span className="ml-1 text-[10px] uppercase">en retard</span>}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={action.statut}
                      onChange={(e) => changerStatut(action.id, e.target.value as StatutAction)}
                      className={`rounded border-0 px-1.5 py-0.5 text-xs font-medium ${STYLES_STATUT[action.statut]}`}
                    >
                      {STATUTS.map((s) => (
                        <option key={s} value={s}>
                          {LIBELLES_STATUT[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
