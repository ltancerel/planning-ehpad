"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppTabs from "@/components/AppTabs";
import UserMenu from "@/components/UserMenu";
import {
  ACTIONS_DEMO,
  CATALOGUE_ORIGINES,
  LIBELLES_STATUT,
  STATUTS,
  type ActionQualite,
  type StatutAction,
} from "@/lib/actions-paqg-data";

// UserMenu (avatar + détail Julie Dupont) repris tel quel du Planning —
// retour client du 20/11, bandeau fusionné avec celui-ci le 21/11 pour
// une vraie uniformité (Filtres puis utilisateur dans le même bandeau que
// le Planning, même si l'affichage diffère).
const UTILISATEUR_DEMO = {
  nom: "DUPONT",
  prenom: "Julie",
  typeUtilisateur: "Administrateur",
  service: "Administratif",
  poste: "Directrice",
};

// EPIC Multi-application (#46), story #47 (maquette) — reprend le tableau
// de bord maquetté sur experiment/qualite-maquette, avec les modifications
// demandées : vignettes d'indicateur restylées (carte colorée, chiffre
// dans la vignette, réparties selon la largeur de fenêtre), colonne
// « Organe de décision » retirée, statut d'une action modifiable
// directement, ajout d'une action via une fenêtre modale (intitulé,
// détails, responsable, échéance, caractère impératif). Cliquer sur
// l'intitulé d'une action ouvre la même fenêtre pour la modifier ou la
// supprimer (retour client du 21/11). Avatar responsable (même style que
// Pilotage PAQG) et filtre masqué derrière un bouton (mot-clé, origine,
// responsable, statut — même langage visuel que Planning/Pilotage PAQG,
// retour client du 21/11). Entièrement local (useState) : rien n'est
// persisté, cohérent avec une maquette sans backend — l'ajout/la
// modification sera réservé aux comptes Administrateur et Manager une
// fois cette application réellement construite (pas de système de rôle
// dans cette maquette, donc pas de restriction ici).

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

// Fait ressortir un responsable ou une échéance encore "À définir" —
// retour client du 21/11 : une bonne initiative (signaler qu'il reste une
// décision à prendre) mais pas assez visible en texte brut.
function BadgeADefinir() {
  return (
    <span className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
      À définir
    </span>
  );
}

// Même composant que AvatarResponsable dans Pilotage PAQG (TableauBordPilotage.tsx).
function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/);
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase();
}

function AvatarResponsable({ nom }: { nom: string }) {
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-semibold text-white"
      title={nom}
    >
      {initiales(nom)}
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

// jj/mm/aaaa à partir d'une chaîne ISO sans passer par new Date(chaîne),
// qui parse en UTC et peut décaler le jour affiché selon le fuseau
// horaire du serveur (même bug déjà corrigé côté Pilotage PAQG).
function formatDateFR(iso: string): string {
  const [y, m, j] = iso.split("-").map(Number);
  return new Date(y, m - 1, j).toLocaleDateString("fr-FR");
}

type ValeursFormulaire = {
  origineBadge: ActionQualite["origineBadge"];
  origineTexte: string;
  intitule: string;
  details: string;
  responsable: string;
  echeance: string;
  imperatif: boolean;
};

const VALEURS_VIDES: ValeursFormulaire = {
  origineBadge: CATALOGUE_ORIGINES[0].badge,
  origineTexte: CATALOGUE_ORIGINES[0].texte,
  intitule: "",
  details: "",
  responsable: "",
  echeance: "",
  imperatif: false,
};

function valeursDepuisAction(action: ActionQualite): ValeursFormulaire {
  return {
    origineBadge: action.origineBadge,
    origineTexte: action.origineTexte,
    intitule: action.intitule,
    details: action.details ?? "",
    responsable: action.responsable,
    echeance: action.echeanceLabel ? "" : action.echeance,
    imperatif: action.imperatif ?? false,
  };
}

function FormulaireAction({
  actionExistante,
  onAnnuler,
  onEnregistrer,
  onSupprimer,
}: {
  actionExistante?: ActionQualite;
  onAnnuler: () => void;
  onEnregistrer: (valeurs: ValeursFormulaire) => void;
  onSupprimer?: () => void;
}) {
  const [valeurs, setValeurs] = useState<ValeursFormulaire>(
    actionExistante ? valeursDepuisAction(actionExistante) : VALEURS_VIDES
  );

  // Catégories du catalogue pour le badge choisi — si l'action modifiée
  // porte une origine antérieure au catalogue (ex. "Ajoutée manuellement"),
  // elle est ajoutée en tête pour ne pas être perdue tant qu'on ne change
  // pas explicitement de catégorie.
  const categoriesPourBadge = CATALOGUE_ORIGINES.filter((o) => o.badge === valeurs.origineBadge);
  const categorieActuelleAbsente = !categoriesPourBadge.some((o) => o.texte === valeurs.origineTexte);

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
          <h3 className="text-base font-semibold text-zinc-900">
            {actionExistante ? "Modifier l'action" : "Ajouter une action"}
          </h3>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Origine</label>
              <select
                value={valeurs.origineBadge}
                onChange={(e) => {
                  const badge = e.target.value as ActionQualite["origineBadge"];
                  const premiereCategorie = CATALOGUE_ORIGINES.find((o) => o.badge === badge)?.texte ?? "";
                  setValeurs((v) => ({ ...v, origineBadge: badge, origineTexte: premiereCategorie }));
                }}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="DUERP">DUERP</option>
                <option value="HAS">HAS</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Catégorie</label>
              <select
                value={valeurs.origineTexte}
                onChange={(e) => setValeurs((v) => ({ ...v, origineTexte: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {categorieActuelleAbsente && <option value={valeurs.origineTexte}>{valeurs.origineTexte}</option>}
                {categoriesPourBadge.map((o) => (
                  <option key={o.texte} value={o.texte}>
                    {o.texte}
                  </option>
                ))}
              </select>
            </div>
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

        <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-4">
          <div>
            {actionExistante && onSupprimer && (
              <button onClick={onSupprimer} className="text-sm font-medium text-red-600 hover:underline">
                Supprimer
              </button>
            )}
          </div>
          <div className="flex gap-2">
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
    </div>
  );
}

type EtatModal = { mode: "ajouter" } | { mode: "modifier"; action: ActionQualite } | null;

// --- Filtre (masqué derrière un bouton, même langage visuel que
// FiltreSalariesBouton du planning et FiltresPilotageBouton de Pilotage
// PAQG, retour client du 21/11) ----------------------------------------------

function FunnelIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M1.5 2.5h13l-4.75 5.75v4.25l-3.5 1.5V8.25L1.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TitreSection({ enfant }: { enfant: string }) {
  return <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{enfant}</p>;
}

type FiltresActions = {
  motCle: string;
  origine: "toutes" | ActionQualite["origineBadge"];
  responsable: string;
  statut: "tous" | StatutAction;
};

const FILTRES_VIDES: FiltresActions = { motCle: "", origine: "toutes", responsable: "tous", statut: "tous" };

function nbFiltresActifs(f: FiltresActions): number {
  return (
    (f.motCle.trim() ? 1 : 0) + (f.origine !== "toutes" ? 1 : 0) + (f.responsable !== "tous" ? 1 : 0) + (f.statut !== "tous" ? 1 : 0)
  );
}

function FiltresActionsBouton({
  filtres,
  onChange,
  responsables,
  nbResultats,
}: {
  filtres: FiltresActions;
  onChange: (f: FiltresActions) => void;
  responsables: string[];
  nbResultats: number;
}) {
  const [ouvert, setOuvert] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const actifs = nbFiltresActifs(filtres);

  useEffect(() => {
    if (!ouvert) return;
    function surClicExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) setOuvert(false);
    }
    document.addEventListener("mousedown", surClicExterieur);
    return () => document.removeEventListener("mousedown", surClicExterieur);
  }, [ouvert]);

  return (
    <div ref={conteneurRef} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium ${
          actifs > 0 ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100" : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
        }`}
      >
        <FunnelIcon />
        Filtres
        {actifs > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
            {actifs}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute right-0 top-full z-40 mt-1.5 w-[320px] rounded border border-zinc-200 bg-white p-3.5 shadow-lg">
          <div>
            <TitreSection enfant="Mot-clé" />
            <input
              type="text"
              value={filtres.motCle}
              onChange={(e) => onChange({ ...filtres, motCle: e.target.value })}
              placeholder="Rechercher..."
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>

          <div className="mt-3">
            <TitreSection enfant="Origine" />
            <select
              value={filtres.origine}
              onChange={(e) => onChange({ ...filtres, origine: e.target.value as FiltresActions["origine"] })}
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            >
              <option value="toutes">Toutes</option>
              <option value="DUERP">DUERP</option>
              <option value="HAS">HAS</option>
            </select>
          </div>

          <div className="mt-3">
            <TitreSection enfant="Responsable" />
            <select
              value={filtres.responsable}
              onChange={(e) => onChange({ ...filtres, responsable: e.target.value })}
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            >
              <option value="tous">Tous</option>
              {responsables.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3">
            <TitreSection enfant="Statut" />
            <select
              value={filtres.statut}
              onChange={(e) => onChange({ ...filtres, statut: e.target.value as FiltresActions["statut"] })}
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            >
              <option value="tous">Tous</option>
              {STATUTS.map((s) => (
                <option key={s} value={s}>
                  {LIBELLES_STATUT[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
            <button
              type="button"
              onClick={() => onChange(FILTRES_VIDES)}
              disabled={actifs === 0}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-800 disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              Réinitialiser
            </button>
            <span className="text-xs text-zinc-500">
              {nbResultats} action{nbResultats > 1 ? "s" : ""} affichée{nbResultats > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TableauBordActions() {
  const [actions, setActions] = useState<ActionQualite[]>(ACTIONS_DEMO);
  const [modal, setModal] = useState<EtatModal>(null);
  const [filtres, setFiltres] = useState<FiltresActions>(FILTRES_VIDES);

  const responsables = useMemo(
    () => [...new Set(actions.map((a) => a.responsable))].sort((a, b) => a.localeCompare(b, "fr")),
    [actions]
  );

  const actionsFiltrees = useMemo(() => {
    return actions.filter((a) => {
      if (filtres.origine !== "toutes" && a.origineBadge !== filtres.origine) return false;
      if (filtres.responsable !== "tous" && a.responsable !== filtres.responsable) return false;
      if (filtres.statut !== "tous" && a.statut !== filtres.statut) return false;
      if (filtres.motCle.trim()) {
        const cible = `${a.intitule} ${a.origineTexte} ${a.responsable}`.toLowerCase();
        if (!cible.includes(filtres.motCle.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [actions, filtres]);

  const actionsAFaire = actions.filter((a) => a.statut !== "fait").length;
  const actionsEnRetard = actions.filter(estEnRetard).length;

  function changerStatut(id: string, statut: StatutAction) {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, statut } : a)));
  }

  function ajouterAction(valeurs: ValeursFormulaire) {
    if (!valeurs.intitule.trim()) return;
    setActions((prev) => [
      {
        id: `nouvelle-${Date.now()}`,
        origineBadge: valeurs.origineBadge,
        origineTexte: valeurs.origineTexte,
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
    setModal(null);
  }

  function modifierAction(id: string, valeurs: ValeursFormulaire) {
    if (!valeurs.intitule.trim()) return;
    setActions((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              origineBadge: valeurs.origineBadge,
              origineTexte: valeurs.origineTexte,
              intitule: valeurs.intitule.trim(),
              details: valeurs.details.trim() || undefined,
              responsable: valeurs.responsable.trim() || "À définir",
              echeance: valeurs.echeance || a.echeance,
              echeanceLabel: valeurs.echeance ? undefined : a.echeanceLabel,
              imperatif: valeurs.imperatif,
            }
          : a
      )
    );
    setModal(null);
  }

  function supprimerAction(id: string) {
    setActions((prev) => prev.filter((a) => a.id !== id));
    setModal(null);
  }

  const triees = [...actionsFiltrees].sort((a, b) => a.echeance.localeCompare(b.echeance));

  return (
    <div className="flex h-screen flex-col bg-white text-sm text-zinc-900">
      <header className="flex shrink-0 flex-col border-b border-zinc-200">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-zinc-200 text-xs font-semibold text-zinc-500">
              E
            </span>
            <div className="leading-tight">
              <h1 className="font-semibold text-zinc-800">EHPAD Démo</h1>
              <p className="text-[10px] text-zinc-400">Actions PAQG</p>
            </div>
            <div className="ml-4 border-l border-zinc-200 pl-4">
              <AppTabs actif="actions-paqg" />
            </div>
          </div>
          {/* Même bandeau que l'utilisateur — retour client du 21/11 :
              Filtres puis utilisateur dans le même bandeau que Planning,
              plutôt que sur une ligne à part. */}
          <div className="flex items-center gap-2">
            <FiltresActionsBouton
              filtres={filtres}
              onChange={setFiltres}
              responsables={responsables}
              nbResultats={actionsFiltrees.length}
            />
            <UserMenu utilisateur={UTILISATEUR_DEMO} />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
      <h2 className="text-xl font-semibold text-zinc-900">Tableau de bord Actions PAQG</h2>
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
          onClick={() => setModal({ mode: "ajouter" })}
          className="rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
        >
          + Ajouter une action
        </button>
      </div>

      {modal?.mode === "ajouter" && (
        <FormulaireAction onAnnuler={() => setModal(null)} onEnregistrer={ajouterAction} />
      )}
      {modal?.mode === "modifier" && (
        <FormulaireAction
          actionExistante={modal.action}
          onAnnuler={() => setModal(null)}
          onEnregistrer={(valeurs) => modifierAction(modal.action.id, valeurs)}
          onSupprimer={() => supprimerAction(modal.action.id)}
        />
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
                      <button
                        onClick={() => setModal({ mode: "modifier", action })}
                        title="Modifier ou supprimer cette action"
                        className="text-left font-medium text-zinc-800 underline decoration-zinc-300 decoration-dashed underline-offset-2 hover:text-amber-700 hover:decoration-amber-500"
                      >
                        {action.intitule}
                      </button>
                    </div>
                    <div className="text-xs text-zinc-500">{action.origineTexte}</div>
                    {action.details && <div className="mt-1 text-xs text-zinc-500">{action.details}</div>}
                  </td>
                  <td className="px-3 py-2">
                    {action.responsable === "À définir" ? (
                      <BadgeADefinir />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <AvatarResponsable nom={action.responsable} />
                        <span className="text-zinc-700">{action.responsable}</span>
                      </div>
                    )}
                  </td>
                  <td className={`px-3 py-2 ${retard ? "font-semibold text-red-600" : "text-zinc-700"}`}>
                    {action.echeanceLabel === "À définir" ? (
                      <BadgeADefinir />
                    ) : (
                      <>
                        {action.echeanceLabel ?? formatDateFR(action.echeance)}
                        {retard && <span className="ml-1 text-[10px] uppercase">en retard</span>}
                      </>
                    )}
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
    </div>
  );
}
