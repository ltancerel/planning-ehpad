import {
  UNITES_TRAVAIL,
  RISQUES_DEMO,
  CATEGORIES_RISQUE,
  categorie,
  niveauCriticite,
  LIBELLES_CRITICITE,
  DESCRIPTIONS_CRITICITE,
  type Risque,
  type NiveauCriticite,
} from "@/lib/qualite-mock-data";
import { CriticiteBadge, OrganeBadge } from "@/components/qualite/Badges";
import RiskMatrixChart from "@/components/qualite/RiskMatrixChart";

const LEGENDE: { niveau: NiveauCriticite; classe: string }[] = [
  { niveau: "faible", classe: "bg-emerald-400" },
  { niveau: "moyen", classe: "bg-amber-400" },
  { niveau: "eleve", classe: "bg-red-400" },
];

function compterParCategorie(risques: Risque[]): { slug: string; nom: string; icone: string; count: number }[] {
  return CATEGORIES_RISQUE.map((cat) => ({
    slug: cat.slug,
    nom: cat.nom,
    icone: cat.icone,
    count: risques.filter((r) => r.categorie === cat.slug).length,
  })).filter((c) => c.count > 0);
}

function compterParNiveau(risques: Risque[]): Record<NiveauCriticite, number> {
  const compte: Record<NiveauCriticite, number> = { faible: 0, moyen: 0, eleve: 0 };
  for (const r of risques) compte[niveauCriticite(r.residuel)]++;
  return compte;
}

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
        <span className="font-medium text-zinc-600">Criticité (résiduelle) :</span>
        {LEGENDE.map(({ niveau, classe }) => (
          <span key={niveau} className="inline-flex items-center gap-1" title={DESCRIPTIONS_CRITICITE[niveau]}>
            <span className={`h-2.5 w-2.5 rounded-sm ${classe}`} /> {LIBELLES_CRITICITE[niveau]}
          </span>
        ))}
      </div>

      <h2 className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Synthèse
      </h2>
      <div className="rounded border border-zinc-200 bg-white p-4">
        <RiskMatrixChart />
      </div>

      <h2 className="mt-8 mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Risques par unité de travail
      </h2>
      <p className="mb-3 text-xs text-zinc-400">
        Cliquez sur une unité pour afficher le détail de ses risques.
      </p>
      <div className="space-y-2">
        {UNITES_TRAVAIL.map((ut) => {
          const risques = RISQUES_DEMO.filter((r) => r.uniteTravailId === ut.id);

          if (risques.length === 0) {
            return (
              <div key={ut.id} className="flex items-center gap-3 rounded border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full opacity-40" style={{ backgroundColor: ut.couleur }} />
                <span className="text-sm font-medium text-zinc-500">
                  {ut.numero}. {ut.nom}
                </span>
                <span className="text-xs text-zinc-400">
                  — aucun risque encore détaillé (document en cours d&apos;élaboration)
                </span>
              </div>
            );
          }

          const parCategorie = compterParCategorie(risques);
          const parNiveau = compterParNiveau(risques);

          return (
            <details key={ut.id} className="group rounded border border-zinc-200 bg-white">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                <span className="text-zinc-400 transition-transform group-open:rotate-90">▶</span>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ut.couleur }} />
                <span className="text-sm font-semibold text-zinc-800">
                  {ut.numero}. {ut.nom}
                </span>
                <span className="text-xs text-zinc-400">
                  ({risques.length} risque{risques.length > 1 ? "s" : ""})
                </span>

                <span className="mx-1 hidden h-4 w-px bg-zinc-200 sm:block" />

                <span className="flex flex-wrap items-center gap-2">
                  {parCategorie.map((c) => (
                    <span key={c.slug} className="inline-flex items-center gap-0.5" title={c.nom}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- pictogramme DUERP statique */}
                      <img src={c.icone} alt="" className="h-4 w-4 object-contain" />
                      <span className="text-[10px] font-medium text-zinc-500">×{c.count}</span>
                    </span>
                  ))}
                </span>

                <span className="mx-1 hidden h-4 w-px bg-zinc-200 sm:block" />

                <span className="flex items-center gap-2.5 text-xs">
                  <span className="inline-flex items-center gap-1 text-red-700" title="Risques élevés (résiduel)">
                    <span className="h-2 w-2 rounded-sm bg-red-400" />
                    {parNiveau.eleve}
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-700" title="Risques moyens (résiduel)">
                    <span className="h-2 w-2 rounded-sm bg-amber-400" />
                    {parNiveau.moyen}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700" title="Risques faibles (résiduel)">
                    <span className="h-2 w-2 rounded-sm bg-emerald-400" />
                    {parNiveau.faible}
                  </span>
                </span>

                <span className="ml-auto" />
              </summary>

              <div className="overflow-x-auto border-t border-zinc-200">
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
            </details>
          );
        })}
      </div>
    </div>
  );
}
