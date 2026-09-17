import { UNITES_TRAVAIL, RISQUES_DEMO } from "@/lib/qualite-mock-data";
import { CriticiteBadge } from "@/components/qualite/Badges";

export default function DuerpPage() {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Document unique d&apos;évaluation des risques professionnels
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Risques recensés par unité de travail, cotés selon la méthode INRS
            (Gravité × Fréquence = Criticité). Dernière mise à jour : 15/01/2026.
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

      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        <span className="font-medium text-zinc-600">Criticité :</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Faible (1-2)</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-yellow-400" /> Modérée (3-4)</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-orange-400" /> Élevée (6-9)</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Critique (≥12)</span>
      </div>

      <div className="mt-4 space-y-6">
        {UNITES_TRAVAIL.map((ut) => {
          const risques = RISQUES_DEMO.filter((r) => r.uniteTravailId === ut.id);
          if (risques.length === 0) return null;
          return (
            <section key={ut.id}>
              <h2 className="mb-2 text-sm font-semibold text-zinc-800">{ut.nom}</h2>
              <div className="overflow-x-auto rounded border border-zinc-200">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-3 py-2">Catégorie</th>
                      <th className="px-3 py-2">Risque</th>
                      <th className="px-3 py-2">Mesures existantes</th>
                      <th className="px-3 py-2 text-center">G</th>
                      <th className="px-3 py-2 text-center">F</th>
                      <th className="px-3 py-2 text-center">Criticité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {risques.map((r) => (
                      <tr key={r.id} className="border-t border-zinc-100 align-top">
                        <td className="px-3 py-2 text-zinc-600">{r.categorie}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-zinc-800">{r.intitule}</div>
                          <div className="text-xs text-zinc-500">{r.description}</div>
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-600">{r.mesuresExistantes}</td>
                        <td className="px-3 py-2 text-center text-zinc-700">{r.gravite}</td>
                        <td className="px-3 py-2 text-center text-zinc-700">{r.frequence}</td>
                        <td className="px-3 py-2 text-center">
                          <CriticiteBadge risque={r} />
                        </td>
                      </tr>
                    ))}
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
