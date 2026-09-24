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
  formatJourMois,
  parseDateISO,
  estWeekend,
  genererPeriode,
  lundiDeLaSemaine,
  lundiLePlusProche,
} from "@/lib/dates";

type NbSemaines = 4 | 6;
const NB_SEMAINES_DEFAUT: NbSemaines = 4;

const JOURS_SEMAINE = ["L", "Ma", "M", "J", "V", "S", "D"];

// Distinction visuelle jour férié / week-end (retour client du 24/09) : un
// jour férié tombant un week-end reste marqué férié (priorité), pas juste
// grisé comme un week-end ordinaire.
type ClasseJour = "ferie" | "weekend" | "normal";
function classeJour(date: Date): ClasseJour {
  if (JOURS_FERIES_2026.has(formatDateISO(date))) return "ferie";
  if (estWeekend(date)) return "weekend";
  return "normal";
}

function formatPlages(plages?: Plage[]): string {
  if (!plages?.length) return "";
  return plages.map((p) => `${p.debut}–${p.fin}`).join(", ");
}

export default function EmargementMensuel({ salarie }: { salarie: Salarie }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // "mois" ne sert qu'à calculer le départ par défaut (milieu de mois, cf.
  // lundiLePlusProche ci-dessous) — c'est le paramètre transmis par le lien
  // depuis la grille Planning. Une fois affichée, la navigation (semaine par
  // semaine, ou changement du nombre de semaines) passe par "debut", qui
  // prend le pas sur "mois" dès qu'il est présent.
  const moisParam = searchParams.get("mois");
  const debutParam = searchParams.get("debut");
  const semainesParam = searchParams.get("semaines");
  const nbSemaines: NbSemaines = semainesParam === "6" ? 6 : NB_SEMAINES_DEFAUT;
  const [valide, setValide] = useState(false);

  const debutFenetre = useMemo(() => {
    if (debutParam) return lundiDeLaSemaine(parseDateISO(debutParam));
    const dateReference = moisParam ? parseDateISO(`${moisParam}-01`) : new Date(2026, 8, 1);
    return lundiLePlusProche(new Date(dateReference.getFullYear(), dateReference.getMonth(), 15));
  }, [debutParam, moisParam]);

  const jours = useMemo(() => genererPeriode(debutFenetre, nbSemaines * 7), [debutFenetre, nbSemaines]);
  const semaines = useMemo(() => {
    const groupes: Date[][] = [];
    for (let i = 0; i < jours.length; i += 7) groupes.push(jours.slice(i, i + 7));
    return groupes;
  }, [jours]);
  const finFenetre = jours[jours.length - 1];

  function valeurDuJour(jour: Date) {
    const dateISO = formatDateISO(jour);
    const valeur = PLANNING_DEMO[`${salarie.id}__${dateISO}`];
    const horaireTravail = valeur?.travail ? HORAIRE_CODES_PAR_CODE[valeur.travail] : undefined;
    const horaireInformatif = valeur?.informatif ? HORAIRE_CODES_PAR_CODE[valeur.informatif] : undefined;
    const horaireEvenementiel = valeur?.evenementiel ? HORAIRE_CODES_PAR_CODE[valeur.evenementiel] : undefined;
    const heuresBase = valeur?.travail ? heuresDuCode(valeur.travail) : 0;
    const heures = valeur ? heuresReellesCellule(valeur) : 0;
    // Type "normal" : le code travail est barré (décompte écrasé) et
    // remplacé par le décompte du code évènement. Type "partiel" : le
    // delta (+/-) doit être explicitement visible, sans barrer le travail.
    // Type "special" : traité séparément (affichage plein, pas de barré).
    const travailBarre = horaireEvenementiel?.typeEvenement === "normal";
    const delta = valeur ? deltaEvenementielCellule(valeur) : undefined;
    return { valeur, horaireTravail, horaireInformatif, horaireEvenementiel, heuresBase, heures, travailBarre, delta };
  }

  const totalHeures = jours.reduce((total, jour) => total + valeurDuJour(jour).heures, 0);

  function naviguer(nouveauDebut: Date, nouveauNbSemaines: NbSemaines) {
    const params = new URLSearchParams({
      salarie: salarie.id,
      debut: formatDateISO(nouveauDebut),
      semaines: String(nouveauNbSemaines),
    });
    router.push(`/emargement?${params.toString()}`);
    setValide(false);
  }

  function allerSemaine(delta: number) {
    const suivant = new Date(debutFenetre);
    suivant.setDate(suivant.getDate() + delta * 7);
    naviguer(suivant, nbSemaines);
  }

  function choisirNbSemaines(n: NbSemaines) {
    naviguer(debutFenetre, n);
  }

  return (
    <>
      <div className="mb-3 flex max-w-5xl items-center justify-between">
        <button
          onClick={() => allerSemaine(-1)}
          className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 print:hidden"
        >
          ← Semaine précédente
        </button>
        <span className="text-sm font-semibold text-zinc-700">
          {formatJourMois(debutFenetre)} – {formatJourMois(finFenetre)} {finFenetre.getFullYear()}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded border border-zinc-300 text-xs print:hidden">
            <button
              onClick={() => choisirNbSemaines(4)}
              className={`px-2 py-1 font-medium ${
                nbSemaines === 4 ? "bg-blue-600 text-white" : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              4 semaines
            </button>
            <button
              onClick={() => choisirNbSemaines(6)}
              className={`border-l border-zinc-300 px-2 py-1 font-medium ${
                nbSemaines === 6 ? "bg-blue-600 text-white" : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              6 semaines
            </button>
          </div>
          <button
            onClick={() => allerSemaine(1)}
            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 print:hidden"
          >
            Semaine suivante →
          </button>
        </div>
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
              const totalSemaine = semaine.reduce((total, jour) => total + valeurDuJour(jour).heures, 0);
              return (
                <tr key={index}>
                  {semaine.map((jour) => {
                    const {
                      valeur,
                      horaireTravail,
                      horaireInformatif,
                      horaireEvenementiel,
                      heuresBase,
                      heures,
                      travailBarre,
                      delta,
                    } = valeurDuJour(jour);
                    const classe = classeJour(jour);
                    const plagesTravail = formatPlages(horaireTravail?.plages);
                    const estPartiel = horaireEvenementiel?.typeEvenement === "partiel";

                    return (
                      <td
                        key={formatDateISO(jour)}
                        className={`min-h-32 border border-zinc-200 align-top ${
                          classe === "ferie" ? "bg-amber-50" : classe === "weekend" ? "bg-zinc-50" : "bg-white"
                        }`}
                        title={classe === "ferie" ? "Jour férié" : undefined}
                      >
                        <div className="flex h-full flex-col gap-1 px-1.5 py-1">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs ${
                                classe === "ferie"
                                  ? "font-semibold text-amber-700"
                                  : classe === "weekend"
                                    ? "text-zinc-400"
                                    : "text-zinc-500"
                              }`}
                            >
                              {formatJourMois(jour)}
                            </span>
                            {valeur && <span className="text-[10px] font-semibold text-zinc-700">{heures}h</span>}
                          </div>

                          {/* Code horaire de travail — au-dessus du code événementiel
                              (empilés, cf. retour client du 17/09), toujours visible même
                              avec un évènement "spécial" superposé (retour client du
                              23/09 : contrairement à la grille planning, la vue mensuelle
                              ne l'efface jamais — seul le décompte peut être barré). */}
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

                          {/* Code événementiel — special (décompte du travail gardé,
                              affiché ci-dessus), normal (décompte écrasé, cf. ci-dessus)
                              ou partiel (plage + delta). */}
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
                              {estPartiel && valeur.evenementielPlages && valeur.evenementielPlages.length > 0 && (
                                <div className="text-[9px] font-semibold">
                                  {valeur.evenementielPlages.map((p) => `${p.debut}–${p.fin}`).join(", ")} (
                                  {delta !== undefined && delta >= 0 ? "+" : ""}
                                  {delta}h)
                                </div>
                              )}
                            </div>
                          )}

                          {/* Code informatif — jamais d'heures propres. En dessous du
                              travail s'il y en a un, en plein sinon (cf. règle de
                              composition de cellule du 23/09). */}
                          {valeur?.informatif && horaireInformatif && (
                            <div
                              className="rounded px-1 py-0.5 leading-tight"
                              style={{
                                backgroundColor: horaireInformatif.couleurFond,
                                color: horaireInformatif.couleurTexte,
                              }}
                            >
                              <div className="text-[10px] font-bold">{horaireInformatif.code}</div>
                              <div className="text-[9px]">{horaireInformatif.intitule}</div>
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
          Heures extrapolées à partir des codes horaires de la période (planifié, amendé par les codes
          événementiels — superposition ou complément à la volée, cf. story #19).
        </p>
        <p className="font-semibold text-zinc-700">Total : {totalHeures}h</p>
      </div>

      <div className="mt-4 max-w-5xl rounded border border-zinc-200 p-3 print:hidden">
        {valide ? (
          <p className="text-sm font-medium text-green-700">
            ✓ Planning validé par {salarie.prenom} {salarie.nom} pour la période du{" "}
            {formatJourMois(debutFenetre)} au {formatJourMois(finFenetre)} {finFenetre.getFullYear()}. Il
            ne peut plus être modifié.
          </p>
        ) : (
          <>
            <p className="mb-2 text-xs text-zinc-600">
              En validant, {salarie.prenom} {salarie.nom} confirme que ce planning correspond aux heures
              réellement effectuées sur la période affichée.
            </p>
            <button
              onClick={() => setValide(true)}
              className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              Valider la période
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
