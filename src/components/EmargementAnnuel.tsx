"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Salarie } from "@/lib/mock-data";
import { PLANNING_DEMO } from "@/lib/mock-data";
import { HORAIRE_CODES, HORAIRE_CODES_PAR_CODE, type HoraireCode } from "@/lib/horaire-codes";
import { formatDateISO, genererMois } from "@/lib/dates";

const MOIS_ABREGE = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const NB_JOURS_MAX = 31;

// Priorité au code évènementiel sur le code travail si les deux sont
// configurés pour la vue annuelle (cf. retour client du 17/09) — en
// pratique, seuls les codes évènementiels d'absence sont cochés par défaut,
// mais un code travail reste éligible.
function codeAnnuelDuJour(salarieId: string, jour: Date): HoraireCode | undefined {
  const valeur = PLANNING_DEMO[`${salarieId}__${formatDateISO(jour)}`];
  if (!valeur) return undefined;
  const horaireEvenementiel = valeur.evenementiel ? HORAIRE_CODES_PAR_CODE[valeur.evenementiel] : undefined;
  if (horaireEvenementiel?.afficherVueAnnuelle) return horaireEvenementiel;
  const horaireTravail = valeur.travail ? HORAIRE_CODES_PAR_CODE[valeur.travail] : undefined;
  if (horaireTravail?.afficherVueAnnuelle) return horaireTravail;
  return undefined;
}

export default function EmargementAnnuel({ salarie }: { salarie: Salarie }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const anneeParam = searchParams.get("annee");
  const annee = anneeParam ? Number(anneeParam) : 2026;

  const moisListe = useMemo(() => Array.from({ length: 12 }, (_, m) => genererMois(annee, m)), [annee]);
  const legende = useMemo(() => HORAIRE_CODES.filter((h) => h.afficherVueAnnuelle), []);

  function changerAnnee(delta: number) {
    router.push(`/emargement?salarie=${salarie.id}&vue=annuel&annee=${annee + delta}`);
  }

  return (
    <>
      <div className="mb-3 flex max-w-3xl items-center justify-between">
        <button
          onClick={() => changerAnnee(-1)}
          className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 print:hidden"
        >
          ← Année précédente
        </button>
        <span className="text-sm font-semibold text-zinc-700">{annee}</span>
        <button
          onClick={() => changerAnnee(1)}
          className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 print:hidden"
        >
          Année suivante →
        </button>
      </div>

      <div className="max-w-3xl overflow-hidden rounded border border-zinc-200">
        <table className="w-full border-collapse text-xs" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th className="w-8 border border-zinc-200 bg-zinc-100 py-1 font-medium text-zinc-600" />
              {MOIS_ABREGE.map((m) => (
                <th key={m} className="border border-zinc-200 bg-zinc-100 py-1 font-medium text-zinc-600">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: NB_JOURS_MAX }, (_, i) => i + 1).map((jourNum) => (
              <tr key={jourNum}>
                <td className="border border-zinc-100 bg-zinc-50 text-center text-[10px] text-zinc-400">
                  {jourNum}
                </td>
                {moisListe.map((joursMois, m) => {
                  const jour = joursMois[jourNum - 1];
                  if (!jour) {
                    return <td key={m} className="border border-zinc-100 bg-zinc-50" />;
                  }
                  const code = codeAnnuelDuJour(salarie.id, jour);
                  return (
                    <td
                      key={m}
                      title={`${formatDateISO(jour)}${code ? ` — ${code.intitule}` : ""}`}
                      className="border border-zinc-100"
                      style={{ backgroundColor: code?.couleurFond ?? "#ffffff" }}
                    >
                      <div className="h-4" />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex max-w-3xl flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
        {legende.map((h) => (
          <div key={h.code} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm border border-zinc-300"
              style={{ backgroundColor: h.couleurFond }}
            />
            <span>{h.intitule}</span>
          </div>
        ))}
        {legende.length === 0 && (
          <p className="text-zinc-400">
            Aucun code n&apos;est configuré pour la vue annuelle (case « Afficher dans la vue annuelle »
            dans l&apos;administration des codes horaires).
          </p>
        )}
      </div>

      <p className="mt-4 max-w-3xl text-xs text-zinc-500">
        Vue de repérage uniquement (pas d&apos;émargement) : un code couleur par jour, sans détail
        d&apos;horaire — cf. story #16.
      </p>
    </>
  );
}
