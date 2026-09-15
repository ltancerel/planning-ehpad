"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SALARIES, JOURS_FERIES_2026, PLANNING_DEMO } from "@/lib/mock-data";
import { HORAIRE_CODES_PAR_CODE, heuresReellesCellule } from "@/lib/horaire-codes";
import {
  formatDateISO,
  estWeekend,
  genererMois,
  genererCalendrierMois,
  formatAnneeMois,
  libelleMois,
} from "@/lib/dates";

const JOURS_SEMAINE = ["L", "Ma", "M", "J", "V", "S", "D"];

function estJourGrise(date: Date): boolean {
  return estWeekend(date) || JOURS_FERIES_2026.has(formatDateISO(date));
}

export default function EmargementContenu() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const salarieId = searchParams.get("salarie") ?? SALARIES[0]?.id;
  const salarie = SALARIES.find((s) => s.id === salarieId) ?? SALARIES[0];

  const moisParam = searchParams.get("mois");
  const dateMois = useMemo(
    () => (moisParam ? new Date(`${moisParam}-01`) : new Date(2026, 8, 1)),
    [moisParam]
  );
  const [valide, setValide] = useState(false);

  const semaines = useMemo(
    () => genererCalendrierMois(dateMois.getFullYear(), dateMois.getMonth()),
    [dateMois]
  );
  const joursDuMois = useMemo(
    () => genererMois(dateMois.getFullYear(), dateMois.getMonth()),
    [dateMois]
  );

  function valeurDuJour(jour: Date) {
    const dateISO = formatDateISO(jour);
    const valeur = PLANNING_DEMO[`${salarie.id}__${dateISO}`];
    const horaireTravail = valeur?.travail ? HORAIRE_CODES_PAR_CODE[valeur.travail] : undefined;
    const horaireEvenementiel = valeur?.evenementiel ? HORAIRE_CODES_PAR_CODE[valeur.evenementiel] : undefined;
    const heures = valeur ? heuresReellesCellule(valeur) : 0;
    return { valeur, horaireTravail, horaireEvenementiel, heures };
  }

  const totalHeures = joursDuMois.reduce((total, jour) => total + valeurDuJour(jour).heures, 0);

  function changerMois(delta: number) {
    const suivant = new Date(dateMois.getFullYear(), dateMois.getMonth() + delta, 1);
    router.push(`/emargement?salarie=${salarie.id}&mois=${formatAnneeMois(suivant)}`);
    setValide(false);
  }

  return (
    <div className="flex h-screen flex-col bg-white text-sm text-zinc-900">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-2">
        <div>
          <h1 className="font-semibold text-zinc-800">
            Émargement — {salarie.nom} {salarie.prenom}
          </h1>
          <p className="text-[10px] text-zinc-400">Validation mensuelle du planning</p>
        </div>
        <Link href="/" className="text-xs font-medium text-blue-600 hover:underline">
          ← Retour au planning
        </Link>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="mb-3 flex max-w-2xl items-center justify-between">
          <button
            onClick={() => changerMois(-1)}
            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
          >
            ← Mois précédent
          </button>
          <span className="text-sm font-semibold text-zinc-700">{libelleMois(dateMois)}</span>
          <button
            onClick={() => changerMois(1)}
            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
          >
            Mois suivant →
          </button>
        </div>

        <div className="max-w-2xl overflow-hidden rounded border border-zinc-200">
          <table className="w-full border-collapse text-sm" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr>
                {JOURS_SEMAINE.map((j) => (
                  <th
                    key={j}
                    className="border border-zinc-200 bg-zinc-100 py-1 text-xs font-medium text-zinc-600"
                  >
                    {j}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {semaines.map((semaine, index) => (
                <tr key={index}>
                  {semaine.map((jour) => {
                    const dansLeMois = jour.getMonth() === dateMois.getMonth();
                    const { valeur, horaireTravail, horaireEvenementiel, heures } = valeurDuJour(jour);
                    const grise = estJourGrise(jour);

                    if (!dansLeMois) {
                      return (
                        <td
                          key={formatDateISO(jour)}
                          className="h-16 border border-zinc-100 bg-zinc-50 align-top text-zinc-300"
                        >
                          <span className="block px-1.5 py-1 text-xs">{jour.getDate()}</span>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={formatDateISO(jour)}
                        className={`h-16 border border-zinc-200 align-top ${grise ? "bg-zinc-50" : "bg-white"}`}
                      >
                        <div className="flex h-full flex-col px-1.5 py-1">
                          <span className={`text-xs ${grise ? "text-zinc-400" : "text-zinc-500"}`}>
                            {jour.getDate()}
                          </span>
                          <div className="mt-0.5 flex flex-wrap gap-0.5">
                            {valeur?.travail && (
                              <span
                                className="rounded px-1 text-[11px] font-semibold leading-tight"
                                style={{
                                  backgroundColor: horaireTravail?.couleurFond,
                                  color: horaireTravail?.couleurTexte,
                                }}
                              >
                                {valeur.travail}
                              </span>
                            )}
                            {valeur?.evenementiel && (
                              <span
                                className="rounded px-1 text-[11px] font-bold leading-tight"
                                style={{
                                  backgroundColor: horaireEvenementiel?.couleurFond,
                                  color: horaireEvenementiel?.couleurTexte,
                                }}
                              >
                                {valeur.evenementiel}
                              </span>
                            )}
                          </div>
                          {heures > 0 && (
                            <span className="mt-auto text-right text-[10px] text-zinc-400">{heures}h</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-2 flex max-w-2xl items-center justify-between text-xs text-zinc-500">
          <p className="max-w-md">
            Heures extrapolées à partir des codes horaires du mois (planifié, amendé par les codes
            événementiels superposés — cf. story #4).
          </p>
          <p className="font-semibold text-zinc-700">Total : {totalHeures}h</p>
        </div>

        <div className="mt-4 max-w-2xl rounded border border-zinc-200 p-3">
          {valide ? (
            <p className="text-sm font-medium text-green-700">
              ✓ Planning validé par {salarie.prenom} {salarie.nom} pour {libelleMois(dateMois)}. Il ne peut
              plus être modifié.
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs text-zinc-600">
                En validant, {salarie.prenom} {salarie.nom} confirme que ce planning correspond aux heures
                réellement effectuées ce mois-ci.
              </p>
              <button
                onClick={() => setValide(true)}
                className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              >
                Valider le mois
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
