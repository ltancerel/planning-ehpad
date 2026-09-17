import {
  CHAPITRES_HAS,
  THEMATIQUES_HAS,
  OBJECTIFS_HAS,
  CRITERES_HAS,
} from "@/lib/qualite-mock-data";
import { CotationBadge, ImperatifBadge } from "@/components/qualite/Badges";

export default function ReferentielPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-zinc-900">Référentiel qualité HAS</h1>
      <p className="mt-1 max-w-2xl text-sm text-zinc-500">
        Référentiel d&apos;évaluation des établissements et services sociaux et
        médico-sociaux (3 chapitres, 9 thématiques, 42 objectifs, 157 critères dont 18
        impératifs) — extrait illustratif pour cette maquette, pas le manuel complet.
      </p>

      <div className="mt-6 space-y-8">
        {CHAPITRES_HAS.map((chapitre) => {
          const thematiques = THEMATIQUES_HAS.filter((t) => t.chapitreId === chapitre.id);
          return (
            <section key={chapitre.id}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-teal-900">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-teal-700 text-xs font-bold text-white">
                  {chapitre.numero}
                </span>
                {chapitre.nom}
              </h2>

              <div className="space-y-5 border-l-2 border-teal-100 pl-4">
                {thematiques.map((thematique) => {
                  const objectifs = OBJECTIFS_HAS.filter((o) => o.thematiqueId === thematique.id);
                  return (
                    <div key={thematique.id}>
                      <h3 className="text-sm font-semibold text-zinc-800">{thematique.nom}</h3>

                      <div className="mt-2 space-y-3">
                        {objectifs.map((objectif) => {
                          const criteres = CRITERES_HAS.filter((c) => c.objectifId === objectif.id);
                          return (
                            <div key={objectif.id} className="rounded border border-zinc-200 bg-white">
                              <div className="border-b border-zinc-100 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600">
                                Objectif {objectif.numero} — {objectif.libelle}
                              </div>
                              <ul className="divide-y divide-zinc-100">
                                {criteres.map((critere) => (
                                  <li key={critere.id} className="flex items-start gap-3 px-3 py-2 text-sm">
                                    <span className="mt-0.5 shrink-0 font-mono text-xs text-zinc-400">
                                      {critere.numero}
                                    </span>
                                    <span className="flex-1 text-zinc-800">
                                      {critere.libelle}
                                      {critere.imperatif && (
                                        <span className="ml-2 inline-block align-middle">
                                          <ImperatifBadge />
                                        </span>
                                      )}
                                    </span>
                                    <CotationBadge cotation={critere.cotation} />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
