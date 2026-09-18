import {
  UNITES_TRAVAIL,
  RISQUES_DEMO,
  categorie,
  LIBELLES_CRITICITE,
  DESCRIPTIONS_CRITICITE,
  type NiveauCriticite,
} from "@/lib/qualite-mock-data";
import { CriticiteBadge, OrganeBadge } from "@/components/qualite/Badges";

const LEGENDE: { niveau: NiveauCriticite; classe: string }[] = [
  { niveau: "faible", classe: "bg-emerald-400" },
  { niveau: "moyen", classe: "bg-amber-400" },
  { niveau: "eleve", classe: "bg-red-400" },
];

export default function DuerpPage() {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Document unique d&apos;évaluation des risques professionnels
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-500">
            DUERP réel — EHPAD Les Jardins de Rambam, version 3 (en cours d&apos;élaboration). Risques
            recensés par unité de travail, cotés selon la méthode INRS (Gravité × Fréquence = Criticité),
            avec distinction entre risque brut (avant mesures) et risque résiduel (après mesures en place).
          </p>
        </div>
        <button
          disabled
          className="shrink-0 cursor-not-allowed rounded bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-500"
          title="Maquette — pas encore implémenté"
        >
          + Ajouter un risque
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span className="font-medium text-zinc-600">Criticité :</span>
        {LEGENDE.map(({ niveau, classe }) => (
          <span key={niveau} className="inline-flex items-center gap-1" title={DESCRIPTIONS_CRITICITE[niveau]}>
            <span className={`h-2.5 w-2.5 rounded-sm ${classe}`} /> {LIBELLES_CRITICITE[niveau]}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-8">
        {UNITES_TRAVAIL.map((ut) => {
          const risques = RISQUES_DEMO.filter((r) => r.uniteTravailId === ut.id);
          if (risques.length === 0) {
            return (
              <section key={ut.id}>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ut.couleur }} />
                  {ut.numero}. {ut.nom}
                </h2>
                <p className="rounded border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400">
                  Aucun risque encore détaillé pour cette unité dans le DUERP (document en cours
                  d&apos;élaboration).
                </p>
              </section>
            );
          }
          return (
            <section key={ut.id}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ut.couleur }} />
                {ut.numero}. {ut.nom}
                <span className="font-normal text-zinc-400">
                  ({risques.length} risque{risques.length > 1 ? "s" : ""})
                </span>
              </h2>
              <div className="overflow-x-auto rounded border border-zinc-200">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-3 py-2">Catégorie</th>
                      <th className="px-3 py-2">Facteur de risque</th>
                      <th className="px-3 py-2">Mesures existantes</th>
                      <th className="px-3 py-2 text-center">Brut (G×F)</th>
                      <th className="px-3 py-2 text-center">Résiduel (G×F)</th>
                      <th className="px-3 py-2">Organe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {risques.map((r) => {
                      const cat = categorie(r.categorie);
                      return (
                        <tr key={r.id} className="border-t border-zinc-100 align-top">
                          <td className="px-3 py-2">
                            <div className="flex flex-col items-center gap-1" title={cat.nom}>
                              {/* eslint-disable-next-line @next/next/no-img-element -- pictogramme DUERP statique */}
                              <img src={cat.icone} alt={cat.nom} className="h-7 w-7 object-contain" />
                              <span className="text-center text-[10px] text-zinc-500">{cat.nom}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-zinc-800">{r.intitule}</div>
                            {r.phase && <div className="text-[10px] uppercase tracking-wide text-zinc-400">{r.phase}</div>}
                            {r.situations.length > 0 && (
                              <ul className="mt-1 list-inside list-disc text-xs text-zinc-500">
                                {r.situations.map((s) => (
                                  <li key={s}>{s}</li>
                                ))}
                              </ul>
                            )}
                            <div className="mt-1 text-xs italic text-zinc-400">Dommages : {r.dommages}</div>
                          </td>
                          <td className="px-3 py-2 text-xs text-zinc-600">
                            <ul className="list-inside list-disc">
                              {r.mesuresExistantes.map((m) => (
                                <li key={m}>{m}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <CriticiteBadge cotation={r.brut} />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <CriticiteBadge cotation={r.residuel} />
                          </td>
                          <td className="px-3 py-2">
                            <OrganeBadge organe={r.organeDecision} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
