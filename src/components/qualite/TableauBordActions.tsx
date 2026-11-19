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
// dans la vignette, réparties selon la largeur de fenêtre), colonne
// « Organe de décision » retirée, statut d'une action modifiable
// directement, ajout d'une action via une fenêtre modale (intitulé,
// détails, responsable, échéance, caractère impératif). Entièrement local
// (useState) : rien n'est persisté, cohérent avec une maquette sans
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
      className={`flex flex-col items-center justify-center rounded-xl bg-gradient-to-br p-3 text-center text-white shadow-sm ${degrade}`}
    >
      <div className="text-2xl font-bold">{valeur}</div>
      <div className="mt-1 text-[11px] font-medium leading-snug text-white/90">{label}</div>
    </div>
  );
}

// Même style que l'ancien ImperatifBadge de experiment/qualite-maquette
// (onglet référentiel HAS).
function ImperatifBadge() {
  return (
    <span className="inline-block rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
      Impératif
    </span>
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

const NOUVELLE_ACTION_VIDE = { intitule: "", details: "", responsable: "", echeance: "", imperatif: false };

function FormulaireAction({
  onAnnuler,
  onEnregistrer,
}: {
  onAnnuler: () => void;
  onEnregistrer: (valeurs: typeof NOUVELLE_ACTION_VIDE) => void;
}) {
  const [valeurs, setValeurs] = useState(NOUVELLE_ACTION_VIDE);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-900/40 p-4"
      onClick={onAnnuler}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h3 className="text-base font-semibold text-zinc-900">Ajouter une action</h3>
          <button
            onClick={onAnnuler}
            aria-label="Fermer"
            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Intitulé</label>
            <input
              type="text"
              autoFocus
              value={valeurs.intitule}
              onChange={(e) => setValeurs((v) => ({ ...v, intitule: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Détails</label>
            <textarea
              rows={3}
              value={valeurs.details}
              onChange={(e) => setValeurs((v) => ({ ...v, details: e.target.value }))}
              className="w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Responsable</label>
              <input
                type="text"
                value={valeurs.responsable}
                onChange={(e) => setValeurs((v) => ({ ...v, responsable: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Échéance</label>
              <input
                type="date"
                value={valeurs.echeance}
                onChange={(e) => setValeurs((v) => ({ ...v, echeance: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 pt-1 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={valeurs.imperatif}
              onChange={(e) => setValeurs((v) => ({ ...v, imperatif: e.target.checked }))}
              className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
            />
            Caractère impératif
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-4">
          <button
            onClick={onAnnuler}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Annuler
          </button>
          <button
            onClick={() => onEnregistrer(valeurs)}
            disabled={!valeurs.intitule.trim()}
            className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TableauBordActions() {
  const [actions, setActions] = useState<ActionQualite[]>(ACTIONS_DEMO);
  const [modalOuverte, setModalOuverte] = useState(false);

  const actionsAFaire = actions.filter((a) => a.statut !== "fait").length;
  const actionsEnRetard = actions.filter(estEnRetard).length;

  function changerStatut(id: string, statut: StatutAction) {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, statut } : a)));
  }

  function ajouterAction(valeurs: typeof NOUVELLE_ACTION_VIDE) {
    if (!valeurs.intitule.trim()) return;
    setActions((prev) => [
      {
        id: `nouvelle-${Date.now()}`,
        origineBadge: "DUERP",
        origineTexte: "Ajoutée manuellement",
        intitule: valeurs.intitule.trim(),
        details: valeurs.details.trim() || undefined,
        responsable: valeurs.responsable.trim() || "À définir",
        echeance: valeurs.echeance || "2099-12-31",
        echeanceLabel: valeurs.echeance ? undefined : "À définir",
        statut: "a_faire",
        imperatif: valeurs.imperatif,
      },
      ...prev,
    ]);
    setModalOuverte(false);
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

      <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(120px,150px))] gap-3">
        <IndicateurTuile valeur={3} label="Risques DUERP élevés (résiduel)" degrade="from-rose-500 to-rose-600" />
        <IndicateurTuile valeur={2} label="Critères impératifs à traiter" degrade="from-amber-500 to-amber-600" />
        <IndicateurTuile valeur={actionsAFaire} label="Actions non terminées" degrade="from-blue-500 to-blue-600" />
        <IndicateurTuile valeur={actionsEnRetard} label="Actions en retard" degrade="from-red-600 to-red-700" />
      </div>

      <div className="mt-8 mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Plan d&apos;action</h2>
        <button
          onClick={() => setModalOuverte(true)}
          className="rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
        >
          + Ajouter une action
        </button>
      </div>

      {modalOuverte && (
        <FormulaireAction onAnnuler={() => setModalOuverte(false)} onEnregistrer={ajouterAction} />
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
                    <div className="flex items-start gap-1.5">
                      {action.imperatif && <ImperatifBadge />}
                      <div className="font-medium text-zinc-800">{action.intitule}</div>
                    </div>
                    <div className="text-xs text-zinc-500">{action.origineTexte}</div>
                    {action.details && <div className="mt-1 text-xs text-zinc-500">{action.details}</div>}
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
