"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import AppTabs from "@/components/AppTabs";
import UserMenu from "@/components/UserMenu";
import {
  ANNEE,
  MOIS_COURANT,
  MOIS_LABELS,
  LABELS_FREQUENCE,
  EVENEMENTS_DEMO,
  INSTANCES_DEMO,
  NOTIFICATIONS_DEMO,
  lundisDuMois,
  dateISO,
  moisDeISO,
  formatDateFR,
  dateDansSemaine,
  finDeSemaineISO,
  evenementConforme,
  conformitePourcentage,
  tousLesResponsables,
  tousLesItems,
  type FrequenceType,
  type ItemPilotage,
  type InstancePilotage,
  type EvenementPilotage,
  type NotificationPilotage,
} from "@/lib/pilotage-paqg-data";

// EPIC Multi-application (#46), story #47 (maquette) — Pilotage PAQG.
// Cahier des charges fourni par le client le 20/11, cf. artefact "Pilotage
// PAQG — Cahier des charges". Périmètre explicitement demandé pour cette
// première maquette : vue Administrateur uniquement, édition d'un
// évènement pour les 3 types de fréquence (an / mois / semaine), pas
// d'écrans d'administration (création d'instance/item). Entièrement local
// (useState), sans backend ni rémanence — même logique que le reste de
// cette maquette multi-application.
//
// Retours client du 20/11 intégrés ici : navigation année (visuelle,
// non fonctionnelle), colonnes mieux délimitées, colonne Item élargie
// (lignes moins hautes), un seul style de « coché » pour les 3 fréquences
// (plus de cible ronde), date complète affichée pour /an et /mois,
// référence documentaire visible sans ouvrir la fenêtre d'édition, date du
// jour proposée par défaut (modifiable) y compris pour /semaine, badge
// « Doc » dans la colonne Item quand la référence est requise.
//
// Retours client du 21/11 : colonne Responsable supprimée (visible au
// survol de l'item, le filtre Manager reste) ; largeur resserrée pour
// tenir sur un écran 13 pouces avec les 12 mois visibles ; case vide plus
// visible quand une saisie est attendue (rouge quand le mois est déjà
// passé — retard) ; une anticipation /an non renseignée ne peut pas être
// effacée mais peut être déplacée vers un autre mois par glisser-déposer
// (exigence du cahier des charges : l'activité reste due, seule sa
// programmation dans l'année peut bouger).

// UserMenu (avatar + détail Julie Dupont) repris tel quel du Planning —
// retour client du 20/11, bandeau fusionné avec celui-ci le 21/11 pour
// une vraie uniformité (Filtres, navigation, notifications, utilisateur
// dans le même bandeau que le Planning, même si l'affichage diffère).
const UTILISATEUR_DEMO = {
  nom: "DUPONT",
  prenom: "Julie",
  typeUtilisateur: "Administrateur",
  service: "Administratif",
  poste: "Directrice",
};

const STYLES_FREQUENCE: Record<FrequenceType, string> = {
  an: "bg-violet-100 text-violet-800",
  mois: "bg-blue-100 text-blue-800",
  semaine: "bg-teal-100 text-teal-800",
};

// --- Fenêtre d'édition d'un évènement -------------------------------------

type ContextePopover = { type: "mois"; mois: number } | { type: "semaine"; lundiISO: string };

function EvenementPopover({
  item,
  contexte,
  evenementExistant,
  onFermer,
  onEnregistrer,
  onSupprimer,
}: {
  item: ItemPilotage;
  contexte: ContextePopover;
  evenementExistant: EvenementPilotage | undefined;
  onFermer: () => void;
  onEnregistrer: (valeurs: { date: string; reference: string }) => void;
  onSupprimer: () => void;
}) {
  // Date du jour proposée par défaut (modifiable) — retour client du
  // 20/11, y compris pour la fréquence /semaine.
  const [date, setDate] = useState(evenementExistant?.date ?? dateISO(new Date()));
  const [reference, setReference] = useState(evenementExistant?.reference ?? "");
  const [erreur, setErreur] = useState<string | null>(null);

  const titre =
    contexte.type === "semaine"
      ? `Semaine du ${formatDateFR(contexte.lundiISO)} au ${formatDateFR(finDeSemaineISO(contexte.lundiISO))}`
      : `${MOIS_LABELS[contexte.mois]} ${ANNEE}`;

  function enregistrer() {
    if (contexte.type === "mois" && moisDeISO(date) !== contexte.mois) {
      setErreur("La date doit correspondre au mois choisi.");
      return;
    }
    if (contexte.type === "semaine" && !dateDansSemaine(date, contexte.lundiISO)) {
      setErreur("La date doit correspondre à la semaine choisie.");
      return;
    }
    onEnregistrer({ date, reference });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-900/40 p-4" onClick={onFermer}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900">{item.code}</h3>
            <p className="text-xs text-zinc-500">{titre}</p>
          </div>
          <button
            onClick={onFermer}
            aria-label="Fermer"
            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Date de l&apos;évènement</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setErreur(null);
              }}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {erreur && <p className="mt-1 text-xs text-red-600">{erreur}</p>}
          </div>
          {item.gestionDocumentaire && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                Référence du document
                {item.documentCompteConformite && (
                  <span className="ml-1 font-normal text-zinc-400">(compte pour la conformité)</span>
                )}
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="ex. CR-2026-11.pdf"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-4">
          <div>
            {evenementExistant && (
              <button onClick={onSupprimer} className="text-sm font-medium text-red-600 hover:underline">
                Supprimer
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onFermer} className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100">
              Annuler
            </button>
            <button
              onClick={enregistrer}
              className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Style unifié de « coché », commun aux 3 fréquences ---------------------
// Même langage visuel partout (coin arrondi, vert = conforme, rouge = non
// conforme, pastille bleue = référence documentaire présente) plutôt
// qu'une cible ronde réservée à /an — retour client du 20/11.

function PointReference() {
  return <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-500 ring-1 ring-white" />;
}

function PuceDate({
  dateLabel,
  conforme,
  reference,
  onCliquer,
}: {
  dateLabel: string;
  conforme: boolean;
  reference?: string;
  onCliquer: () => void;
}) {
  return (
    <button
      onClick={onCliquer}
      title={reference ? `Référence : ${reference}` : undefined}
      className={
        "relative inline-flex items-center rounded-md border px-1 py-0.5 text-[11px] font-semibold tabular-nums " +
        (conforme ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100")
      }
    >
      {dateLabel}
      {reference && <PointReference />}
    </button>
  );
}

// PucePrevue (mois à venir, pas encore passé) et PuceRetard (mois déjà
// passé sans saisie) — retour client du 21/11 : la case vide attendue
// doit être plus visible, et franchement rouge une fois le mois passé,
// plutôt que le discret "+" pointillé violet d'origine. Pour une
// fréquence /an, l'anticipation (pas encore renseignée) peut être
// déplacée vers un autre mois par glisser-déposer : elle ne peut pas être
// effacée, seule sa programmation peut bouger (exigence du cahier des
// charges).
function PucePrevue({
  onCliquer,
  deplacable,
  onDeplacerDebut,
}: {
  onCliquer: () => void;
  deplacable: boolean;
  onDeplacerDebut: () => void;
}) {
  return (
    <button
      onClick={onCliquer}
      draggable={deplacable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", "");
        onDeplacerDebut();
      }}
      title={deplacable ? "À renseigner — glisser pour reprogrammer sur un autre mois" : "Ajouter l'évènement"}
      className={
        "rounded-md border border-zinc-400 bg-zinc-100 px-1 py-0.5 text-[11px] font-bold text-zinc-600 hover:bg-zinc-200 " +
        (deplacable ? "cursor-grab active:cursor-grabbing" : "")
      }
    >
      +
    </button>
  );
}

function PuceRetard({
  onCliquer,
  deplacable,
  onDeplacerDebut,
}: {
  onCliquer: () => void;
  deplacable: boolean;
  onDeplacerDebut: () => void;
}) {
  return (
    <button
      onClick={onCliquer}
      draggable={deplacable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", "");
        onDeplacerDebut();
      }}
      title={
        deplacable
          ? "En retard — non renseigné. Glisser pour reprogrammer sur un autre mois (ne peut pas être effacé)."
          : "En retard — non renseigné"
      }
      className={
        "rounded-md border border-red-400 bg-red-100 px-1 py-0.5 text-[11px] font-bold text-red-700 hover:bg-red-200 " +
        (deplacable ? "cursor-grab active:cursor-grabbing" : "")
      }
    >
      !
    </button>
  );
}

function CaseSemaine({
  cochee,
  conforme,
  reference,
  titre,
  onCliquer,
}: {
  cochee: boolean;
  conforme: boolean;
  reference?: string;
  titre: string;
  onCliquer: () => void;
}) {
  return (
    <button
      onClick={onCliquer}
      title={reference ? `${titre} — référence : ${reference}` : titre}
      className={
        "relative flex h-[13px] w-[13px] items-center justify-center rounded border text-[7px] font-bold leading-none " +
        (cochee
          ? conforme
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-red-500 bg-red-500 text-white"
          : "border-zinc-400 bg-white hover:border-zinc-500 hover:bg-zinc-50")
      }
    >
      {cochee && "✓"}
      {cochee && reference && <PointReference />}
    </button>
  );
}

// --- Cellule de la grille ---------------------------------------------------

function CelluleMois({
  item,
  mois,
  evenement,
  onCliquer,
  onDeplacerDebut,
  onDeplacerDepot,
}: {
  item: ItemPilotage;
  mois: number;
  evenement: EvenementPilotage | undefined;
  onCliquer: () => void;
  onDeplacerDebut: (mois: number) => void;
  onDeplacerDepot: (mois: number) => void;
}) {
  // Seule une fréquence /an a une « anticipation » qu'on peut déplacer
  // d'un mois à l'autre par glisser-déposer (retour client du 21/11).
  const deplacable = item.frequenceType === "an";
  const proprietesDepot = deplacable
    ? { onDragOver: (e: DragEvent) => e.preventDefault(), onDrop: () => onDeplacerDepot(mois) }
    : {};

  if (item.frequenceType === "an" && !item.moisAnticipes?.includes(mois)) {
    return <td className="border-l border-zinc-100 bg-zinc-50/60 px-0.5 py-0.5" {...proprietesDepot} />;
  }

  const enRetard = !evenement && mois < MOIS_COURANT;

  return (
    <td className="border-l border-zinc-100 px-0.5 py-0.5 text-center" {...proprietesDepot}>
      {evenement ? (
        <PuceDate
          dateLabel={formatDateFR(evenement.date)}
          conforme={evenementConforme(item, evenement)}
          reference={evenement.reference}
          onCliquer={onCliquer}
        />
      ) : enRetard ? (
        <PuceRetard onCliquer={onCliquer} deplacable={deplacable} onDeplacerDebut={() => onDeplacerDebut(mois)} />
      ) : (
        <PucePrevue onCliquer={onCliquer} deplacable={deplacable} onDeplacerDebut={() => onDeplacerDebut(mois)} />
      )}
    </td>
  );
}

function CelluleSemaine({
  item,
  mois,
  evenements,
  onCliquerSemaine,
}: {
  item: ItemPilotage;
  mois: number;
  evenements: EvenementPilotage[];
  onCliquerSemaine: (lundiISO: string) => void;
}) {
  const lundis = lundisDuMois(ANNEE, mois);
  return (
    <td className="border-l border-zinc-100 px-0.5 py-0.5">
      <div className="flex items-center justify-center gap-px">
        {lundis.map((lundi) => {
          const iso = dateISO(lundi);
          const evenement = evenements.find((e) => e.itemId === item.id && dateDansSemaine(e.date, iso));
          const coche = Boolean(evenement);
          const conforme = evenement ? evenementConforme(item, evenement) : true;
          return (
            <CaseSemaine
              key={iso}
              cochee={coche}
              conforme={conforme}
              reference={evenement?.reference}
              titre={`Semaine du ${formatDateFR(iso)}`}
              onCliquer={() => onCliquerSemaine(iso)}
            />
          );
        })}
      </div>
    </td>
  );
}

// --- Ligne d'item ------------------------------------------------------------

function LigneItem({
  item,
  evenements,
  onCliquerMois,
  onCliquerSemaine,
  onDeplacerDebut,
  onDeplacerDepot,
}: {
  item: ItemPilotage;
  evenements: EvenementPilotage[];
  onCliquerMois: (item: ItemPilotage, mois: number) => void;
  onCliquerSemaine: (item: ItemPilotage, lundiISO: string) => void;
  onDeplacerDebut: (itemId: string, mois: number) => void;
  onDeplacerDepot: (itemId: string, mois: number) => void;
}) {
  return (
    <tr className="border-t border-zinc-100">
      {/* Colonne Responsable supprimée (retour client du 21/11) — visible
          au survol de la cellule Item ; le filtre Manager reste disponible. */}
      <td className="sticky left-0 z-10 w-[260px] bg-white px-1.5 py-1" title={`Responsable : ${item.responsable}`}>
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="font-medium text-zinc-800">{item.code}</span>
          <div className="flex shrink-0 items-center gap-1">
            {item.gestionDocumentaire && (
              <span
                className="inline-flex items-center rounded bg-blue-50 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-600"
                title={
                  item.documentCompteConformite
                    ? "Référence documentaire requise — compte pour la conformité"
                    : "Référence documentaire requise"
                }
              >
                Doc
              </span>
            )}
            <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${STYLES_FREQUENCE[item.frequenceType]}`}>
              {item.frequenceN} {LABELS_FREQUENCE[item.frequenceType]}
            </span>
          </div>
        </div>
        {item.nomComplet && <div className="text-xs text-zinc-500">{item.nomComplet}</div>}
      </td>
      {MOIS_LABELS.map((_, mois) =>
        item.frequenceType === "semaine" ? (
          <CelluleSemaine
            key={mois}
            item={item}
            mois={mois}
            evenements={evenements}
            onCliquerSemaine={(lundiISO) => onCliquerSemaine(item, lundiISO)}
          />
        ) : (
          <CelluleMois
            key={mois}
            item={item}
            mois={mois}
            evenement={evenements.find((e) => e.itemId === item.id && moisDeISO(e.date) === mois)}
            onCliquer={() => onCliquerMois(item, mois)}
            onDeplacerDebut={(m) => onDeplacerDebut(item.id, m)}
            onDeplacerDepot={(m) => onDeplacerDepot(item.id, m)}
          />
        )
      )}
    </tr>
  );
}

// --- Bandeau indicateurs -----------------------------------------------------

function IndicateurConformite({ label, pourcentage }: { label: string; pourcentage: number }) {
  const couleur = pourcentage >= 80 ? "text-emerald-600" : pourcentage >= 50 ? "text-amber-600" : "text-red-600";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className={`text-2xl font-bold ${couleur}`}>{pourcentage}%</div>
      <div className="mt-0.5 text-[11px] font-medium leading-snug text-zinc-500">{label}</div>
    </div>
  );
}

// --- Filtres (masqués derrière un bouton, même langage visuel que le
// filtre du planning — FiltreSalariesBouton dans FiltreSalariesAvance.tsx,
// retour client du 20/11) ----------------------------------------------------

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

function FiltresPilotageBouton({
  motCle,
  onMotCleChange,
  frequenceFiltre,
  onFrequenceFiltreChange,
  managerFiltre,
  onManagerFiltreChange,
  responsables,
  instances,
  instancesDesactivees,
  onBasculerInstance,
  nbResultats,
  onReinitialiser,
}: {
  motCle: string;
  onMotCleChange: (v: string) => void;
  frequenceFiltre: "toutes" | FrequenceType;
  onFrequenceFiltreChange: (v: "toutes" | FrequenceType) => void;
  managerFiltre: string;
  onManagerFiltreChange: (v: string) => void;
  responsables: string[];
  instances: InstancePilotage[];
  instancesDesactivees: Set<string>;
  onBasculerInstance: (id: string) => void;
  nbResultats: number;
  onReinitialiser: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const actifs =
    (motCle.trim() ? 1 : 0) + (frequenceFiltre !== "toutes" ? 1 : 0) + (managerFiltre !== "tous" ? 1 : 0) + instancesDesactivees.size;

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
              value={motCle}
              onChange={(e) => onMotCleChange(e.target.value)}
              placeholder="Rechercher..."
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>

          <div className="mt-3">
            <TitreSection enfant="Fréquence" />
            <select
              value={frequenceFiltre}
              onChange={(e) => onFrequenceFiltreChange(e.target.value as "toutes" | FrequenceType)}
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            >
              <option value="toutes">Toutes</option>
              <option value="an">/ an</option>
              <option value="mois">/ mois</option>
              <option value="semaine">/ semaine</option>
            </select>
          </div>

          <div className="mt-3">
            <TitreSection enfant="Manager" />
            <select
              value={managerFiltre}
              onChange={(e) => onManagerFiltreChange(e.target.value)}
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

          <div className="mt-3 border-t border-zinc-100 pt-3">
            <TitreSection enfant="Instances" />
            <div className="flex flex-col gap-1">
              {instances.map((instance) => (
                <label key={instance.id} className="flex cursor-pointer items-center gap-1.5 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={!instancesDesactivees.has(instance.id)}
                    onChange={() => onBasculerInstance(instance.id)}
                    className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  {instance.nom}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
            <button
              type="button"
              onClick={onReinitialiser}
              disabled={actifs === 0}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-800 disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              Réinitialiser
            </button>
            <span className="text-xs text-zinc-500">
              {nbResultats} item{nbResultats > 1 ? "s" : ""} affiché{nbResultats > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Notifications (indicateur dans le bandeau supérieur, retour client
// du 20/11) : signale un retard de suivi ou un indicateur de conformité
// trop bas. Liste figée pour cette maquette, à affiner avec l'application
// réelle (détection automatique, historique...). ----------------------------

function NotificationsPilotageBouton({
  notifications,
  onOuvrirItem,
}: {
  notifications: NotificationPilotage[];
  onOuvrirItem: (itemId: string, mois: number) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [consultees, setConsultees] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const nonLues = consultees ? 0 : notifications.length;

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
        onClick={() => {
          setOuvert((v) => !v);
          setConsultees(true);
        }}
        aria-label="Notifications"
        title="Notifications"
        className={
          "relative flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold " +
          (nonLues > 0
            ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
            : "border-zinc-300 text-zinc-500 hover:bg-zinc-50")
        }
      >
        ?
        {nonLues > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
            {nonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute right-0 top-full z-40 mt-1.5 w-[340px] rounded border border-zinc-200 bg-white p-3.5 shadow-lg">
          <TitreSection enfant="Notifications" />
          {notifications.length === 0 ? (
            <p className="py-2 text-sm text-zinc-500">Rien à signaler.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onOuvrirItem(n.itemId, n.mois);
                      setOuvert(false);
                    }}
                    className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-50"
                  >
                    <span
                      className={
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full " +
                        (n.gravite === "retard" ? "bg-red-500" : "bg-amber-500")
                      }
                    />
                    <span className="text-zinc-700">{n.message}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// --- Composant principal ------------------------------------------------------

export default function TableauBordPilotage() {
  const [evenements, setEvenements] = useState<EvenementPilotage[]>(EVENEMENTS_DEMO);
  const [edition, setEdition] = useState<{ item: ItemPilotage; contexte: ContextePopover } | null>(null);

  const [motCle, setMotCle] = useState("");
  const [frequenceFiltre, setFrequenceFiltre] = useState<"toutes" | FrequenceType>("toutes");
  const [managerFiltre, setManagerFiltre] = useState("tous");
  const [instancesDesactivees, setInstancesDesactivees] = useState<Set<string>>(new Set());

  // Une anticipation /an non renseignée ne peut pas être effacée, mais peut
  // être déplacée vers un autre mois par glisser-déposer (cahier des
  // charges, retour client du 21/11) — surcharge locale de moisAnticipes
  // par item, cette maquette restant sans backend ni rémanence.
  const [moisAnticipesOverrides, setMoisAnticipesOverrides] = useState<Record<string, number[]>>({});
  const [deplacementEnCours, setDeplacementEnCours] = useState<{ itemId: string; mois: number } | null>(null);

  const responsables = useMemo(() => tousLesResponsables(), []);

  const instancesFiltrees = useMemo(() => {
    return INSTANCES_DEMO.filter((instance) => !instancesDesactivees.has(instance.id))
      .map((instance) => ({
        ...instance,
        items: instance.items
          .map((item) => {
            const override = moisAnticipesOverrides[item.id];
            return override ? { ...item, moisAnticipes: override } : item;
          })
          .filter((item) => {
            if (frequenceFiltre !== "toutes" && item.frequenceType !== frequenceFiltre) return false;
            if (managerFiltre !== "tous" && item.responsable !== managerFiltre) return false;
            if (motCle.trim()) {
              const cible = `${item.code} ${item.nomComplet ?? ""} ${item.responsable}`.toLowerCase();
              if (!cible.includes(motCle.trim().toLowerCase())) return false;
            }
            return true;
          }),
      }))
      .filter((instance) => instance.items.length > 0);
  }, [motCle, frequenceFiltre, managerFiltre, instancesDesactivees, moisAnticipesOverrides]);

  function debuterDeplacementAnticipation(itemId: string, mois: number) {
    setDeplacementEnCours({ itemId, mois });
  }

  // Refuse le dépôt si la cible est déjà anticipée (ou a déjà un
  // évènement, ce qui implique qu'elle est anticipée) — seule une case
  // vide et non anticipée peut recevoir l'anticipation déplacée.
  function deposerAnticipation(itemId: string, moisCible: number) {
    if (!deplacementEnCours || deplacementEnCours.itemId !== itemId || deplacementEnCours.mois === moisCible) {
      setDeplacementEnCours(null);
      return;
    }
    const moisSource = deplacementEnCours.mois;
    setMoisAnticipesOverrides((prev) => {
      const item = tousLesItems().find((i) => i.id === itemId);
      if (!item) return prev;
      const actuels = prev[itemId] ?? item.moisAnticipes ?? [];
      if (!actuels.includes(moisSource) || actuels.includes(moisCible)) return prev;
      const suivants = actuels
        .filter((m) => m !== moisSource)
        .concat(moisCible)
        .sort((a, b) => a - b);
      return { ...prev, [itemId]: suivants };
    });
    setDeplacementEnCours(null);
  }

  function basculerInstance(id: string) {
    setInstancesDesactivees((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });
  }

  function enregistrerEvenement(item: ItemPilotage, contexte: ContextePopover, date: string, reference: string) {
    setEvenements((prev) => {
      const existant = prev.find(
        (e) =>
          e.itemId === item.id &&
          (contexte.type === "semaine" ? dateDansSemaine(e.date, contexte.lundiISO) : moisDeISO(e.date) === contexte.mois)
      );
      if (existant) {
        return prev.map((e) => (e.id === existant.id ? { ...e, date, reference: reference || undefined } : e));
      }
      return [...prev, { id: `ev-${Date.now()}`, itemId: item.id, date, reference: reference || undefined }];
    });
    setEdition(null);
  }

  function supprimerEvenement(item: ItemPilotage, contexte: ContextePopover) {
    setEvenements((prev) =>
      prev.filter((e) => {
        if (e.itemId !== item.id) return true;
        if (contexte.type === "semaine") return !dateDansSemaine(e.date, contexte.lundiISO);
        return moisDeISO(e.date) !== contexte.mois;
      })
    );
    setEdition(null);
  }

  const evenementEnEdition = edition
    ? evenements.find((e) => {
        if (e.itemId !== edition.item.id) return false;
        if (edition.contexte.type === "semaine") return dateDansSemaine(e.date, edition.contexte.lundiISO);
        return moisDeISO(e.date) === edition.contexte.mois;
      })
    : undefined;

  const tousLesItemsFiltres = instancesFiltrees.flatMap((i) => i.items);
  const conformiteGlobale = conformitePourcentage(tousLesItemsFiltres, evenements, MOIS_COURANT);

  return (
    <div className="flex h-screen flex-col bg-white text-sm text-zinc-900">
      <header className="flex shrink-0 flex-col border-b border-zinc-200">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-2">
          <div className="flex items-center gap-2 justify-self-start">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-zinc-200 text-xs font-semibold text-zinc-500">
              E
            </span>
            <div className="leading-tight">
              <h1 className="font-semibold text-zinc-800">EHPAD Démo</h1>
              <p className="text-[10px] text-zinc-400">Programmation</p>
            </div>
          </div>
          {/* Onglets d'application décalés et centrés dans le bandeau,
              plutôt que collés au bloc EHPAD — retour client du 21/11. */}
          <div className="justify-self-center">
            <AppTabs actif="pilotage-paqg" />
          </div>
          {/* Même bandeau que l'utilisateur — retour client du 21/11 :
              auparavant Filtres/navigation/notifications étaient sur une
              ligne à part, pas uniforme avec Planning où tout est dans le
              même bandeau (Filtres, sélecteur, [Administration], puis
              l'utilisateur). Pas de bouton Administration ici, hors
              périmètre de cette première maquette. */}
          <div className="flex items-center justify-self-end gap-2">
            <FiltresPilotageBouton
              motCle={motCle}
              onMotCleChange={setMotCle}
              frequenceFiltre={frequenceFiltre}
              onFrequenceFiltreChange={setFrequenceFiltre}
              managerFiltre={managerFiltre}
              onManagerFiltreChange={setManagerFiltre}
              responsables={responsables}
              instances={INSTANCES_DEMO}
              instancesDesactivees={instancesDesactivees}
              onBasculerInstance={basculerInstance}
              nbResultats={tousLesItemsFiltres.length}
              onReinitialiser={() => {
                setMotCle("");
                setFrequenceFiltre("toutes");
                setManagerFiltre("tous");
                setInstancesDesactivees(new Set());
              }}
            />
            {/* Navigation année — visuelle uniquement pour cette maquette,
                pas encore fonctionnelle (retour client du 20/11). */}
            <div className="flex items-center gap-2 rounded-lg border border-zinc-300 px-1 py-1">
              <button
                type="button"
                aria-label="Année précédente"
                title="Année précédente (pas encore fonctionnel dans cette maquette)"
                className="rounded px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
              >
                ←
              </button>
              <span className="px-1 text-sm font-semibold text-zinc-800">{ANNEE}</span>
              <button
                type="button"
                aria-label="Année suivante"
                title="Année suivante (pas encore fonctionnel dans cette maquette)"
                className="rounded px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
              >
                →
              </button>
            </div>
            <NotificationsPilotageBouton
              notifications={NOTIFICATIONS_DEMO}
              onOuvrirItem={(itemId, mois) => {
                const item = tousLesItems().find((i) => i.id === itemId);
                if (item) setEdition({ item, contexte: { type: "mois", mois } });
              }}
            />
            <UserMenu utilisateur={UTILISATEUR_DEMO} />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
      <h2 className="text-xl font-semibold text-zinc-900">Programmation qualité</h2>
      <p className="mt-1 max-w-2xl text-sm text-zinc-500">
        Suivi des instances, comités, réunions, audits et sensibilisations planifiés sur l&apos;année. Vue
        Administrateur — accès réservé Administrateur &amp; Manager.
      </p>

      <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(110px,140px))] gap-3">
        <IndicateurConformite label="Conformité globale" pourcentage={conformiteGlobale} />
        {instancesFiltrees.map((instance) => (
          <IndicateurConformite
            key={instance.id}
            label={instance.nom}
            pourcentage={conformitePourcentage(instance.items, evenements, MOIS_COURANT)}
          />
        ))}
      </div>

      {/* table-fixed + largeurs explicites (retour client du 21/11) : tient
          dans la largeur d'un écran 13 pouces avec les 12 mois visibles,
          sans quoi la mise en page automatique élargit les colonnes selon
          le contenu et déborde. */}
      <div className="mt-4 overflow-x-auto rounded border border-zinc-200">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="sticky left-0 z-10 w-[260px] bg-zinc-50 px-1.5 py-1.5">Item</th>
              {MOIS_LABELS.map((m, i) => (
                <th
                  key={m}
                  className={
                    "w-[76px] border-l border-zinc-200 px-0.5 py-1.5 text-center " +
                    (i === MOIS_COURANT ? "bg-amber-50 text-amber-700" : "")
                  }
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instancesFiltrees.map((instance) => (
              <InstanceGroupe
                key={instance.id}
                instance={instance}
                evenements={evenements}
                onCliquerMois={(item, mois) => setEdition({ item, contexte: { type: "mois", mois } })}
                onCliquerSemaine={(item, lundiISO) => setEdition({ item, contexte: { type: "semaine", lundiISO } })}
                onDeplacerDebut={debuterDeplacementAnticipation}
                onDeplacerDepot={deposerAnticipation}
              />
            ))}
          </tbody>
        </table>
      </div>

      {edition && (
        <EvenementPopover
          item={edition.item}
          contexte={edition.contexte}
          evenementExistant={evenementEnEdition}
          onFermer={() => setEdition(null)}
          onEnregistrer={({ date, reference }) => enregistrerEvenement(edition.item, edition.contexte, date, reference)}
          onSupprimer={() => supprimerEvenement(edition.item, edition.contexte)}
        />
      )}
      </div>
    </div>
  );
}

function InstanceGroupe({
  instance,
  evenements,
  onCliquerMois,
  onCliquerSemaine,
  onDeplacerDebut,
  onDeplacerDepot,
}: {
  instance: InstancePilotage;
  evenements: EvenementPilotage[];
  onCliquerMois: (item: ItemPilotage, mois: number) => void;
  onCliquerSemaine: (item: ItemPilotage, lundiISO: string) => void;
  onDeplacerDebut: (itemId: string, mois: number) => void;
  onDeplacerDepot: (itemId: string, mois: number) => void;
}) {
  return (
    <>
      <tr className="bg-zinc-100">
        <td colSpan={1 + MOIS_LABELS.length} className="sticky left-0 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
          {instance.nom}
        </td>
      </tr>
      {instance.items.map((item) => (
        <LigneItem
          key={item.id}
          item={item}
          evenements={evenements}
          onCliquerMois={onCliquerMois}
          onCliquerSemaine={onCliquerSemaine}
          onDeplacerDebut={onDeplacerDebut}
          onDeplacerDepot={onDeplacerDepot}
        />
      ))}
    </>
  );
}
