"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Salarie } from "@/lib/mock-data";
import { JOURS_FERIES_2026, PLANNING_DEMO } from "@/lib/mock-data";
import {
  HORAIRE_CODES_PAR_CODE,
  heuresDuCode,
  heuresReellesCellule,
  deltaEvenementielCellule,
  type Plage,
} from "@/lib/horaire-codes";
import {
  formatDateISO,
  parseDateISO,
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

function formatPlages(plages?: Plage[]): string {
  if (!plages?.length) return "";
  return plages.map((p) => `${p.debut}–${p.fin}`).join(", ");
}

export default function EmargementMensuel({ salarie }: { salarie: Salarie }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const moisParam = searchParams.get("mois");
  const dateMois = useMemo(
    () => (moisParam ? parseDateISO(`${moisParam}-01`) : new Date(2026, 8, 1)),
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
    const heuresBase = valeur?.travail ? heuresDuCode(valeur.travail) : 0;
    const heures = valeur ? heuresReellesCellule(valeur) : 0;
    // Type "superposition" : le code travail est barré (décompte écrasé) et
    // remplacé par le décompte du code évènement. Type "complement" : le
    // delta (+/-) doit être explicitement visible, sans barrer le travail.
    const travailBarre = horaireEvenementiel?.typeEvenement === "superposition";
    const delta = valeur ? deltaEvenementielCellule(valeur) : undefined;
    return { valeur, horaireTravail, horaireEvenementiel, heuresBase, heures, travailBarre, delta };
  }

  const totalHeures = joursDuMois.reduce((total, jour) => total + valeurDuJour(jour).heures, 0);

  function changerMois(delta: number) {
    const suivant = new Date(dateMois.getFullYear(), dateMois.getMonth() + delta, 1);
    router.push(`/emargement?salarie=${salarie.id}&mois=${formatAnneeMois(suivant)}`);
    setValide(false);
  }

  return (
    <>
      <div className="mb-3 flex max-w-5xl items-center justify-between">
        <button
          onClick={() => changerMois(-1)}
          className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 print:hidden"
        >
          ← Mois précédent
        </button>
        <span className="text-sm font-semibold text-zinc-700">{libelleMois(dateMois)}</span>
        <button
          onClick={() => changerMois(1)}
          className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 print:hidden"
        >
          Mois suivant →
        </button>
      </div>

      <div className="max-w-5xl overflow-hidden rounded border border-zinc-200">
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
              <th className="w-16 border border-zinc-200 bg-zinc-100 py-1 text-xs font-medium text-zinc-600">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {semaines.map((semaine, index) => {
              const totalSemaine = semaine.reduce(
                (total, jour) =>
                  jour.getMonth() === dateMois.getMonth() ? total + valeurDuJour(jour).heures : total,
                0
              );
              return (
                <tr key={index}>
                  {semaine.map((jour) => {
                    const dansLeMois = jour.getMonth() === dateMois.getMonth();
                    const { valeur, horaireTravail, horaireEvenementiel, heuresBase, heures, travailBarre, delta } =
                      valeurDuJour(jour);
                    const grise = estJourGrise(jour);
                    const plagesTravail = formatPlages(horaireTravail?.plages);
                    const estComplement = horaireEvenementiel?.typeEvenement === "complement";

                    if (!dansLeMois) {
                      return (
                        <td
                          key={formatDateISO(jour)}
                          className="min-h-32 border border-zinc-100 bg-zinc-50 align-top text-zinc-300"
                        >
                          <span className="block px-1.5 py-1 text-xs">{jour.getDate()}</span>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={formatDateISO(jour)}
                        className={`min-h-32 border border-zinc-200 align-top ${grise ? "bg-zinc-50" : "bg-white"}`}
                      >
                        <div className="flex h-full flex-col gap-1 px-1.5 py-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs ${grise ? "text-zinc-400" : "text-zinc-500"}`}>
                              {jour.getDate()}
                            </span>
                            {valeur && <span className="text-[10px] font-semibold text-zinc-700">{heures}h</span>}
                          </div>

                          {/* Code horaire de travail — au-dessus du code événementiel
                              (empilés, cf. retour client du 17/09). */}
                          {valeur?.travail && horaireTravail && (
                            <div
                              className="rounded px-1 py-0.5 leading-tight"
                              style={{
                                backgroundColor: horaireTravail.couleurFond,
                                color: horaireTravail.couleurTexte,
                                textDecoration: travailBarre ? "line-through" : undefined,
                              }}
                            >
                              <div className="text-[10px] font-bold">{horaireTravail.code}</div>
                              <div className="text-[9px]">{horaireTravail.intitule}</div>
                              {plagesTravail && <div className="text-[9px]">{plagesTravail}</div>}
                            </div>
                          )}
                          {valeur?.travail && (
                            <div className="flex items-center gap-1 text-[10px]">
                              <span className={travailBarre ? "text-zinc-400 line-through" : "text-zinc-600"}>
                                {heuresBase}h
                              </span>
                              {travailBarre && (
                                <span
                                  className="rounded px-1 font-semibold"
                                  style={{
                                    backgroundColor: horaireEvenementiel?.couleurFond,
                                    color: horaireEvenementiel?.couleurTexte,
                                  }}
                                >
                                  → {heures}h
                                </span>
                              )}
                            </div>
                          )}

                          {/* Code événementiel — superposition (décompte écrasé, cf.
                              ci-dessus) ou complément à la volée (plage + delta). */}
                          {valeur?.evenementiel && horaireEvenementiel && (
                            <div
                              className="rounded px-1 py-0.5 leading-tight"
                              style={{
                                backgroundColor: horaireEvenementiel.couleurFond,
                                color: horaireEvenementiel.couleurTexte,
                              }}
                            >
                              <div className="text-[10px] font-bold">{horaireEvenementiel.code}</div>
                              <div className="text-[9px]">{horaireEvenementiel.intitule}</div>
                              {estComplement && valeur.evenementielPlages && valeur.evenementielPlages.length > 0 && (
                                <div className="text-[9px] font-semibold">
                                  {valeur.evenementielPlages.map((p) => `${p.debut}–${p.fin}`).join(", ")} (
                                  {delta !== undefined && delta >= 0 ? "+" : ""}
                                  {delta}h)
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="border border-zinc-200 bg-white px-1.5 py-1 text-right align-top text-xs font-semibold text-zinc-700">
                    {totalSemaine > 0 ? `${totalSemaine}h` : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex max-w-5xl items-center justify-between text-xs text-zinc-500">
        <p className="max-w-md">
          Heures extrapolées à partir des codes horaires du mois (planifié, amendé par les codes
          événementiels — superposition ou complément à la volée, cf. story #19).
        </p>
        <p className="font-semibold text-zinc-700">Total : {totalHeures}h</p>
      </div>

      <div className="mt-4 max-w-5xl rounded border border-zinc-200 p-3 print:hidden">
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

      {/* Case signature — pour émargement sur planning imprimé */}
      <div className="mt-6 grid max-w-5xl grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-xs text-zinc-500">
            Signature du salarié ({salarie.prenom} {salarie.nom})
          </p>
          <div className="h-20 rounded border border-zinc-300" />
          <p className="mt-1 text-[10px] text-zinc-400">Fait le : ____ / ____ / ______</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-zinc-500">Signature du manager</p>
          <div className="h-20 rounded border border-zinc-300" />
          <p className="mt-1 text-[10px] text-zinc-400">Fait le : ____ / ____ / ______</p>
        </div>
      </div>
    </>
  );
}
