"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SALARIES, JOURS_FERIES_2026, PLANNING_DEMO } from "@/lib/mock-data";
import { HORAIRE_CODES_PAR_CODE, heuresReellesCellule } from "@/lib/horaire-codes";
import {
  formatDateISO,
  lettreJour,
  estWeekend,
  genererMois,
  formatAnneeMois,
  libelleMois,
} from "@/lib/dates";

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

  const jours = useMemo(() => genererMois(dateMois.getFullYear(), dateMois.getMonth()), [dateMois]);

  const lignes = jours.map((jour) => {
    const dateISO = formatDateISO(jour);
    const valeur = PLANNING_DEMO[`${salarie.id}__${dateISO}`];
    const horaireTravail = valeur?.travail ? HORAIRE_CODES_PAR_CODE[valeur.travail] : undefined;
    const horaireEvenementiel = valeur?.evenementiel ? HORAIRE_CODES_PAR_CODE[valeur.evenementiel] : undefined;
    const heures = valeur ? heuresReellesCellule(valeur) : 0;
    return { jour, dateISO, valeur, horaireTravail, horaireEvenementiel, heures };
  });

  const totalHeures = lignes.reduce((total, l) => total + l.heures, 0);

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
        <div className="mb-4 flex max-w-xl items-center justify-between">
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

        <div className="max-w-xl overflow-hidden rounded border border-zinc-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-500">
                <th className="px-3 py-2">Jour</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Horaire</th>
                <th className="px-3 py-2 text-right">Heures</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map(({ jour, dateISO, valeur, horaireTravail, horaireEvenementiel, heures }) => {
                const grise = estJourGrise(jour);
                return (
                  <tr
                    key={dateISO}
                    className={`border-b border-zinc-100 ${grise ? "bg-zinc-50 text-zinc-400" : ""}`}
                  >
                    <td className="px-3 py-1.5">{lettreJour(jour)}</td>
                    <td className="px-3 py-1.5">
                      {String(jour.getDate()).padStart(2, "0")}/{String(jour.getMonth() + 1).padStart(2, "0")}
                    </td>
                    <td className="px-3 py-1.5">
                      {valeur?.travail && (
                        <span
                          className="mr-1 inline-block rounded px-1.5 py-0.5 text-xs font-semibold"
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
                          className="inline-block rounded px-1.5 py-0.5 text-xs font-bold"
                          style={{
                            backgroundColor: horaireEvenementiel?.couleurFond,
                            color: horaireEvenementiel?.couleurTexte,
                          }}
                        >
                          {valeur.evenementiel}
                        </span>
                      )}
                      {!valeur?.travail && !valeur?.evenementiel && (
                        <span className="text-xs text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right text-xs text-zinc-600">
                      {heures > 0 ? `${heures}h` : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-300 bg-zinc-50 font-semibold">
                <td colSpan={3} className="px-3 py-2 text-right text-xs text-zinc-600">
                  Total heures réalisées
                </td>
                <td className="px-3 py-2 text-right text-sm text-zinc-800">{totalHeures}h</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-2 max-w-xl text-[11px] text-zinc-400">
          Heures extrapolées à partir des codes horaires du mois (planifié, amendé par les codes
          événementiels superposés — cf. story #4). Maquette : données non persistées.
        </p>

        <div className="mt-4 max-w-xl rounded border border-zinc-200 p-3">
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
