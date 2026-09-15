"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SALARIES, SERVICES_ORDRE, JOURS_FERIES_2026, genererPlanningDemo } from "@/lib/mock-data";
import { HORAIRE_CODES_PAR_CODE, heuresDuCode } from "@/lib/horaire-codes";
import { formatDateISO, lettreJour, estWeekend, formatJourMois, lundiDeLaSemaine, genererPeriode } from "@/lib/dates";
import UserMenu from "@/components/UserMenu";

const NB_SEMAINES = 4;
const NB_JOURS = NB_SEMAINES * 7;
const LARGEUR_COLONNE = 44;
const LARGEUR_COLONNE_SALARIE = 200;
const CLE_STOCKAGE_PERIODE = "planning-ehpad:periode-debut";

// Données de démo générées une seule fois sur une large plage fixe, indépendante
// de la période actuellement affichée (permet de naviguer librement sans "trous").
const DEMO_DEBUT = new Date(2025, 0, 1);
const DEMO_NB_JOURS = 1100;
const PLANNING_DEMO = genererPlanningDemo(
  SALARIES,
  genererPeriode(DEMO_DEBUT, DEMO_NB_JOURS).map(formatDateISO)
);

function estJourGrise(date: Date): boolean {
  return estWeekend(date) || JOURS_FERIES_2026.has(formatDateISO(date));
}

export default function PlanningGrid() {
  const [debutPeriode, setDebutPeriode] = useState(() => lundiDeLaSemaine(new Date()));
  const jours = useMemo(() => genererPeriode(debutPeriode, NB_JOURS), [debutPeriode]);
  const [editions, setEditions] = useState<Record<string, string>>({});
  const [cellEnEdition, setCellEnEdition] = useState<string | null>(null);
  const [valeurEdition, setValeurEdition] = useState("");
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

  function ouvrirEdition(cle: string) {
    setCellEnEdition(cle);
    setValeurEdition(editions[cle] ?? PLANNING_DEMO[cle] ?? "");
  }

  function validerEdition(cle: string) {
    const saisie = valeurEdition.trim().toUpperCase();
    setEditions((prev) => {
      const suivant = { ...prev };
      if (!saisie) {
        suivant[cle] = "";
      } else if (HORAIRE_CODES_PAR_CODE[saisie]) {
        suivant[cle] = saisie;
      }
      return suivant;
    });
    setCellEnEdition(null);
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

  return (
    <div className="flex h-screen flex-col bg-white text-sm text-zinc-900">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-2">
        <h1 className="font-semibold text-zinc-800">Planning</h1>
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
                rowSpan={2}
              />
              {jours.map((jour) => {
                const grise = estJourGrise(jour);
                return (
                  <th
                    key={formatDateISO(jour)}
                    className={`sticky top-0 z-10 border border-zinc-200 text-xs font-medium ${
                      grise ? "bg-zinc-300 text-zinc-600" : "bg-zinc-100 text-zinc-700"
                    }`}
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
                    className={`sticky z-10 border border-zinc-200 text-xs font-normal ${
                      grise ? "bg-zinc-300 text-zinc-600" : "bg-zinc-50 text-zinc-500"
                    }`}
                    style={{ top: 28 }}
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
                          onClick={() => !enEdition && ouvrirEdition(cle)}
                          className="cursor-pointer border border-zinc-200 p-0 text-center align-middle"
                          style={{
                            backgroundColor: enEdition ? "#fff" : horaire?.couleurFond ?? "#fff",
                            color: horaire?.couleurTexte ?? "#000",
                          }}
                          title={horaire ? `${horaire.intitule}${horaire.plages ? ` — ${heuresDuCode(code!)}h` : ""}` : undefined}
                        >
                          {enEdition ? (
                            <input
                              autoFocus
                              value={valeurEdition}
                              onChange={(e) => setValeurEdition(e.target.value)}
                              onBlur={() => validerEdition(cle)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") validerEdition(cle);
                                if (e.key === "Escape") setCellEnEdition(null);
                              }}
                              className="w-full border-0 bg-white px-1 py-1 text-center text-xs text-zinc-900 outline outline-1 outline-blue-400"
                            />
                          ) : (
                            <span className="block px-1 py-1 text-xs font-semibold leading-tight">
                              {code ?? ""}
                            </span>
                          )}
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
    </div>
  );
}
