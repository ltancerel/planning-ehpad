"use client";

import { useMemo, useState } from "react";
import {
  ANNEE,
  MOIS_COURANT,
  MOIS_LABELS,
  LABELS_FREQUENCE,
  EVENEMENTS_DEMO,
  INSTANCES_DEMO,
  lundisDuMois,
  dateISO,
  moisDeISO,
  formatDateFR,
  dateDansSemaine,
  finDeSemaineISO,
  evenementConforme,
  conformitePourcentage,
  tousLesResponsables,
  type FrequenceType,
  type ItemPilotage,
  type InstancePilotage,
  type EvenementPilotage,
} from "@/lib/pilotage-paqg-data";

// EPIC Multi-application (#46), story #47 (maquette) — Pilotage PAQG.
// Cahier des charges fourni par le client le 20/11, cf. artefact "Pilotage
// PAQG — Cahier des charges". Périmètre explicitement demandé pour cette
// première maquette : vue Administrateur uniquement, édition d'un
// évènement pour les 3 types de fréquence (an / mois / semaine), pas
// d'écrans d'administration (création d'instance/item, drag-and-drop).
// Entièrement local (useState), sans backend ni rémanence — même logique
// que le reste de cette maquette multi-application.
//
// Retours client du 20/11 intégrés ici : navigation année (visuelle,
// non fonctionnelle), colonnes mieux délimitées, colonne Item élargie
// (lignes moins hautes), un seul style de « coché » pour les 3 fréquences
// (plus de cible ronde), date complète affichée pour /an et /mois,
// référence documentaire visible sans ouvrir la fenêtre d'édition, date du
// jour proposée par défaut (modifiable) y compris pour /semaine, badge
// « Doc » dans la colonne Item quand la référence est requise.

const STYLES_FREQUENCE: Record<FrequenceType, string> = {
  an: "bg-violet-100 text-violet-800",
  mois: "bg-blue-100 text-blue-800",
  semaine: "bg-teal-100 text-teal-800",
};

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
        "relative inline-flex items-center rounded-md border px-1.5 py-1 text-[11px] font-semibold tabular-nums " +
        (conforme ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100")
      }
    >
      {dateLabel}
      {reference && <PointReference />}
    </button>
  );
}

function PucePrevue({ onCliquer }: { onCliquer: () => void }) {
  return (
    <button
      onClick={onCliquer}
      title="Ajouter l'évènement"
      className="rounded-md border border-dashed border-violet-300 px-2 py-1 text-[11px] font-medium text-violet-400 hover:border-amber-400 hover:text-amber-600"
    >
      +
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
        "relative flex h-4 w-4 items-center justify-center rounded border text-[8px] font-bold leading-none " +
        (cochee
          ? conforme
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-red-500 bg-red-500 text-white"
          : "border-zinc-300 bg-white hover:border-amber-400")
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
}: {
  item: ItemPilotage;
  mois: number;
  evenement: EvenementPilotage | undefined;
  onCliquer: () => void;
}) {
  if (item.frequenceType === "an" && !item.moisAnticipes?.includes(mois)) {
    return <td className="border-l border-zinc-100 bg-zinc-50/60 px-1.5 py-1.5" />;
  }
  return (
    <td className="border-l border-zinc-100 px-1.5 py-1.5 text-center">
      {evenement ? (
        <PuceDate
          dateLabel={formatDateFR(evenement.date)}
          conforme={evenementConforme(item, evenement)}
          reference={evenement.reference}
          onCliquer={onCliquer}
        />
      ) : (
        <PucePrevue onCliquer={onCliquer} />
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
    <td className="border-l border-zinc-100 px-1.5 py-1.5">
      <div className="flex items-center justify-center gap-1">
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
}: {
  item: ItemPilotage;
  evenements: EvenementPilotage[];
  onCliquerMois: (item: ItemPilotage, mois: number) => void;
  onCliquerSemaine: (item: ItemPilotage, lundiISO: string) => void;
}) {
  return (
    <tr className="border-t border-zinc-100">
      <td className="sticky left-0 z-10 min-w-[300px] bg-white px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-zinc-800">{item.code}</span>
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
        </div>
        {item.nomComplet && <div className="text-xs text-zinc-500">{item.nomComplet}</div>}
      </td>
      <td className="border-l border-zinc-100 px-2 py-2">
        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${STYLES_FREQUENCE[item.frequenceType]}`}>
          {item.frequenceN} {LABELS_FREQUENCE[item.frequenceType]}
        </span>
      </td>
      <td className="border-l border-zinc-100 px-2 py-2">
        <AvatarResponsable nom={item.responsable} />
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

// --- Composant principal ------------------------------------------------------

export default function TableauBordPilotage() {
  const [evenements, setEvenements] = useState<EvenementPilotage[]>(EVENEMENTS_DEMO);
  const [edition, setEdition] = useState<{ item: ItemPilotage; contexte: ContextePopover } | null>(null);

  const [motCle, setMotCle] = useState("");
  const [frequenceFiltre, setFrequenceFiltre] = useState<"toutes" | FrequenceType>("toutes");
  const [managerFiltre, setManagerFiltre] = useState("tous");
  const [instancesDesactivees, setInstancesDesactivees] = useState<Set<string>>(new Set());

  const responsables = useMemo(() => tousLesResponsables(), []);

  const instancesFiltrees = useMemo(() => {
    return INSTANCES_DEMO.filter((instance) => !instancesDesactivees.has(instance.id))
      .map((instance) => ({
        ...instance,
        items: instance.items.filter((item) => {
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
  }, [motCle, frequenceFiltre, managerFiltre, instancesDesactivees]);

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
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Tableau de bord Pilotage PAQG</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Suivi des instances, comités, réunions, audits et sensibilisations planifiés sur l&apos;année. Vue
            Administrateur — accès réservé Administrateur &amp; Manager.
          </p>
        </div>
        {/* Navigation année — visuelle uniquement pour cette maquette, pas
            encore fonctionnelle (retour client du 20/11). */}
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
      </div>

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

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Mot-clé</label>
          <input
            type="text"
            value={motCle}
            onChange={(e) => setMotCle(e.target.value)}
            placeholder="Rechercher..."
            className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Fréquence</label>
          <select
            value={frequenceFiltre}
            onChange={(e) => setFrequenceFiltre(e.target.value as typeof frequenceFiltre)}
            className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm"
          >
            <option value="toutes">Toutes</option>
            <option value="an">/ an</option>
            <option value="mois">/ mois</option>
            <option value="semaine">/ semaine</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Manager</label>
          <select
            value={managerFiltre}
            onChange={(e) => setManagerFiltre(e.target.value)}
            className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm"
          >
            <option value="tous">Tous</option>
            {responsables.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Instances</label>
          <div className="flex flex-wrap gap-2">
            {INSTANCES_DEMO.map((instance) => (
              <label key={instance.id} className="flex items-center gap-1 text-xs text-zinc-700">
                <input
                  type="checkbox"
                  checked={!instancesDesactivees.has(instance.id)}
                  onChange={() => basculerInstance(instance.id)}
                  className="h-3.5 w-3.5 rounded border-zinc-300"
                />
                {instance.nom}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="sticky left-0 z-10 min-w-[300px] bg-zinc-50 px-3 py-2">Item</th>
              <th className="border-l border-zinc-200 px-2 py-2">Fréquence</th>
              <th className="border-l border-zinc-200 px-2 py-2">Resp.</th>
              {MOIS_LABELS.map((m, i) => (
                <th
                  key={m}
                  className={
                    "border-l border-zinc-200 px-1.5 py-2 text-center " +
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
  );
}

function InstanceGroupe({
  instance,
  evenements,
  onCliquerMois,
  onCliquerSemaine,
}: {
  instance: InstancePilotage;
  evenements: EvenementPilotage[];
  onCliquerMois: (item: ItemPilotage, mois: number) => void;
  onCliquerSemaine: (item: ItemPilotage, lundiISO: string) => void;
}) {
  return (
    <>
      <tr className="bg-zinc-100">
        <td colSpan={3 + MOIS_LABELS.length} className="sticky left-0 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
          {instance.nom}
        </td>
      </tr>
      {instance.items.map((item) => (
        <LigneItem key={item.id} item={item} evenements={evenements} onCliquerMois={onCliquerMois} onCliquerSemaine={onCliquerSemaine} />
      ))}
    </>
  );
}
