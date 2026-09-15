"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SALARIES, SERVICES_ORDRE, SERVICE_BESOINS, JOURS_FERIES_2026, genererPlanningDemo } from "@/lib/mock-data";
import { HORAIRE_CODES_PAR_CODE, heuresDuCode } from "@/lib/horaire-codes";
import { formatDateISO, lettreJour, estWeekend, formatJourMois, lundiDeLaSemaine, genererPeriode } from "@/lib/dates";
import UserMenu from "@/components/UserMenu";
import { useEhpad } from "@/context/EhpadProvider";
import HoraireCodeSelector, { type PositionSelecteur } from "@/components/HoraireCodeSelector";

const NB_SEMAINES = 4;
const NB_JOURS = NB_SEMAINES * 7;
const LARGEUR_COLONNE = 44;
const LARGEUR_COLONNE_SALARIE = 200;
const HAUTEUR_LIGNE_ENTETE = 28;
const CLE_STOCKAGE_PERIODE = "planning-ehpad:periode-debut";

// Vue par défaut : septembre 2026, pour une démo cohérente quelle que soit la
// date réelle de consultation.
const PERIODE_PAR_DEFAUT = new Date(2026, 8, 1);

// Données de démo générées une seule fois sur une plage fixe, indépendante de la
// période actuellement affichée (permet de naviguer librement sans "trous").
// S'arrête fin septembre 2026 : le mois suivant (octobre) reste vide pour qu'un
// utilisateur puisse s'y projeter et planifier librement pendant la démo.
const DEMO_DEBUT = new Date(2025, 0, 1);
const DEMO_FIN = new Date(2026, 8, 30);
const DEMO_NB_JOURS = Math.round((DEMO_FIN.getTime() - DEMO_DEBUT.getTime()) / (24 * 60 * 60 * 1000)) + 1;
const PLANNING_DEMO = genererPlanningDemo(
  SALARIES.filter((s) => s.service !== SERVICE_BESOINS),
  genererPeriode(DEMO_DEBUT, DEMO_NB_JOURS).map(formatDateISO)
);

function estJourGrise(date: Date): boolean {
  return estWeekend(date) || JOURS_FERIES_2026.has(formatDateISO(date));
}

export default function PlanningGrid() {
  const [debutPeriode, setDebutPeriode] = useState(() => lundiDeLaSemaine(PERIODE_PAR_DEFAUT));
  const jours = useMemo(() => genererPeriode(debutPeriode, NB_JOURS), [debutPeriode]);
  const [editions, setEditions] = useState<Record<string, string>>({});
  const [cellEnEdition, setCellEnEdition] = useState<string | null>(null);
  const [positionEdition, setPositionEdition] = useState<PositionSelecteur | null>(null);
  const [selecteurOuvert, setSelecteurOuvert] = useState(false);

  // Mémorisation de la période affichée d'une ouverture à l'autre (cf. CDC)
  useEffect(() => {
    try {
      const enregistree = localStorage.getItem(CLE_STOCKAGE_PERIODE);
      if (!enregistree) return;
      const periodeEnregistree = lundiDeLaSemaine(new Date(enregistree));
      // Hydratation depuis localStorage au montage : nécessairement post-render côté client
      // pour éviter un mismatch SSR (le serveur n'a pas accès à localStorage).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDebutPeriode((actuelle) =>
        formatDateISO(actuelle) === formatDateISO(periodeEnregistree) ? actuelle : periodeEnregistree
      );
    } catch {
      // localStorage indisponible (navigation privée...) : on garde la période par défaut
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CLE_STOCKAGE_PERIODE, formatDateISO(debutPeriode));
    } catch {
      // ignoré : la mémorisation est un confort, pas une exigence bloquante
    }
  }, [debutPeriode]);

  const groupes = useMemo(() => {
    const parService = new Map<string, typeof SALARIES>();
    for (const salarie of SALARIES) {
      const liste = parService.get(salarie.service) ?? [];
      liste.push(salarie);
      parService.set(salarie.service, liste);
    }
    return SERVICES_ORDRE.filter((s) => parService.has(s)).map((service) => ({
      service,
      salaries: parService.get(service)!,
    }));
  }, []);

  function ouvrirEdition(cle: string, cellule: HTMLElement) {
    const rect = cellule.getBoundingClientRect();
    setPositionEdition({ top: rect.bottom + 2, left: rect.left, width: rect.width });
    setCellEnEdition(cle);
  }

  function fermerEdition() {
    setCellEnEdition(null);
    setPositionEdition(null);
  }

  function choisirCode(cle: string, code: string | null) {
    setEditions((prev) => ({ ...prev, [cle]: code ?? "" }));
    fermerEdition();
  }

  function changerPeriode(deltaSemaines: number) {
    setDebutPeriode((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + deltaSemaines * 7 * NB_SEMAINES);
      return d;
    });
  }

  const premierJour = jours[0];
  const dernierJour = jours[jours.length - 1];
  const { identite } = useEhpad();
  const valeurActuelleEdition = cellEnEdition
    ? (cellEnEdition in editions ? editions[cellEnEdition] : PLANNING_DEMO[cellEnEdition]) || undefined
    : undefined;

  return (
    <div className="flex h-screen flex-col bg-white text-sm text-zinc-900">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-2">
        <div className="flex items-center gap-2">
          {identite.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo dynamique (data URL uploadé), incompatible avec next/image
            <img src={identite.logo} alt="" className="h-7 w-7 rounded object-contain" />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded bg-zinc-200 text-xs font-semibold text-zinc-500">
              {identite.nom.charAt(0)}
            </span>
          )}
          <div className="leading-tight">
            <h1 className="font-semibold text-zinc-800">{identite.nom}</h1>
            <p className="text-[10px] text-zinc-400">Planning</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changerPeriode(-1)}
            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
            aria-label="Période précédente"
            title="Période précédente"
          >
            ←
          </button>
          <div className="relative">
            <button
              onClick={() => setSelecteurOuvert((v) => !v)}
              className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50"
            >
              {formatJourMois(premierJour)} – {formatJourMois(dernierJour)} {dernierJour.getFullYear()} ▾
            </button>
            {selecteurOuvert && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setSelecteurOuvert(false)} />
                <div className="absolute left-0 top-full z-40 mt-1 rounded border border-zinc-200 bg-white p-3 shadow-lg">
                  <label className="mb-1 block text-xs font-medium text-zinc-600">
                    Choisir une date de début de période
                  </label>
                  <input
                    type="date"
                    defaultValue={formatDateISO(debutPeriode)}
                    onChange={(e) => {
                      if (e.target.value) {
                        setDebutPeriode(lundiDeLaSemaine(new Date(e.target.value)));
                        setSelecteurOuvert(false);
                      }
                    }}
                    className="rounded border border-zinc-300 px-2 py-1 text-sm"
                  />
                  <p className="mt-2 max-w-[16rem] text-xs text-zinc-500">
                    La période affichée ({NB_SEMAINES} semaines) est mémorisée d&apos;une ouverture à
                    l&apos;autre.
                  </p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => changerPeriode(1)}
            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
            aria-label="Période suivante"
            title="Période suivante"
          >
            →
          </button>
          <Link
            href="/admin/horaires"
            className="ml-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
          >
            Administration
          </Link>
          <UserMenu />
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <table className="border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: LARGEUR_COLONNE_SALARIE }} />
            {jours.map((j) => (
              <col key={formatDateISO(j)} style={{ width: LARGEUR_COLONNE }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                className="sticky left-0 top-0 z-30 border border-zinc-200 bg-zinc-100"
                style={{ height: HAUTEUR_LIGNE_ENTETE * 2 }}
                rowSpan={2}
              />
              {jours.map((jour) => {
                const grise = estJourGrise(jour);
                return (
                  <th
                    key={formatDateISO(jour)}
                    className={`sticky top-0 z-10 border border-zinc-200 text-xs font-medium leading-none ${
                      grise ? "bg-zinc-300 text-zinc-600" : "bg-zinc-100 text-zinc-700"
                    }`}
                    style={{ height: HAUTEUR_LIGNE_ENTETE, boxSizing: "border-box" }}
                  >
                    {lettreJour(jour)}
                  </th>
                );
              })}
            </tr>
            <tr>
              {jours.map((jour) => {
                const grise = estJourGrise(jour);
                return (
                  <th
                    key={formatDateISO(jour)}
                    className={`sticky z-10 border border-zinc-200 text-xs font-normal leading-none ${
                      grise ? "bg-zinc-300 text-zinc-600" : "bg-zinc-50 text-zinc-500"
                    }`}
                    style={{
                      top: HAUTEUR_LIGNE_ENTETE,
                      height: HAUTEUR_LIGNE_ENTETE,
                      boxSizing: "border-box",
                    }}
                  >
                    {formatJourMois(jour)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {groupes.map((groupe) => (
              <Fragment key={groupe.service}>
                <tr>
                  <td
                    colSpan={NB_JOURS + 1}
                    className="sticky left-0 z-10 border border-zinc-200 bg-zinc-200 px-2 py-1 text-xs font-bold text-zinc-700"
                  >
                    {groupe.service}
                  </td>
                </tr>
                {groupe.salaries.map((salarie) => (
                  <tr key={salarie.id}>
                    <td className="sticky left-0 z-10 truncate border border-zinc-200 bg-white px-2 py-1 text-xs font-medium">
                      {salarie.nom} {salarie.prenom}
                    </td>
                    {jours.map((jour) => {
                      const dateISO = formatDateISO(jour);
                      const cle = `${salarie.id}__${dateISO}`;
                      const code = (cle in editions ? editions[cle] : PLANNING_DEMO[cle]) || undefined;
                      const horaire = code ? HORAIRE_CODES_PAR_CODE[code] : undefined;
                      const enEdition = cellEnEdition === cle;

                      return (
                        <td
                          key={cle}
                          onClick={(e) => ouvrirEdition(cle, e.currentTarget)}
                          className="cursor-pointer border border-zinc-200 p-0 text-center align-middle"
                          style={{
                            backgroundColor: enEdition ? "#eff6ff" : horaire?.couleurFond ?? "#fff",
                            color: horaire?.couleurTexte ?? "#000",
                            outline: enEdition ? "2px solid #60a5fa" : undefined,
                            outlineOffset: enEdition ? "-2px" : undefined,
                          }}
                          title={horaire ? `${horaire.intitule}${horaire.plages ? ` — ${heuresDuCode(code!)}h` : ""}` : undefined}
                        >
                          <span className="block px-1 py-1 text-xs font-semibold leading-tight">
                            {code ?? ""}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {cellEnEdition && positionEdition && (
        <>
          <div className="fixed inset-0 z-40" onClick={fermerEdition} />
          <HoraireCodeSelector
            position={positionEdition}
            valeurActuelle={valeurActuelleEdition}
            onChoisir={(code) => choisirCode(cellEnEdition, code)}
            onFermer={fermerEdition}
          />
        </>
      )}
    </div>
  );
}
