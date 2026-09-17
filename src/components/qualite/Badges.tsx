import {
  criticite,
  niveauCriticite,
  LIBELLES_COTATION,
  LIBELLES_STATUT,
  type Risque,
  type NiveauCotation,
  type StatutAction,
} from "@/lib/qualite-mock-data";

const STYLES_CRITICITE: Record<string, string> = {
  faible: "bg-emerald-100 text-emerald-800",
  moderee: "bg-yellow-100 text-yellow-800",
  elevee: "bg-orange-100 text-orange-800",
  critique: "bg-red-100 text-red-800",
};

export function CriticiteBadge({ risque }: { risque: Pick<Risque, "gravite" | "frequence"> }) {
  const score = criticite(risque);
  const niveau = niveauCriticite(score);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold ${STYLES_CRITICITE[niveau]}`}
      title={`Gravité ${risque.gravite} × Fréquence ${risque.frequence}`}
    >
      {score}
    </span>
  );
}

const STYLES_COTATION: Record<NiveauCotation, string> = {
  conforme: "bg-emerald-100 text-emerald-800",
  partiellement_conforme: "bg-yellow-100 text-yellow-800",
  non_conforme: "bg-red-100 text-red-800",
  non_concerne: "bg-zinc-100 text-zinc-600",
};

export function CotationBadge({ cotation }: { cotation: NiveauCotation }) {
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${STYLES_COTATION[cotation]}`}>
      {LIBELLES_COTATION[cotation]}
    </span>
  );
}

const STYLES_STATUT: Record<StatutAction, string> = {
  a_faire: "bg-zinc-100 text-zinc-700",
  en_cours: "bg-blue-100 text-blue-800",
  fait: "bg-emerald-100 text-emerald-800",
};

export function StatutBadge({ statut }: { statut: StatutAction }) {
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${STYLES_STATUT[statut]}`}>
      {LIBELLES_STATUT[statut]}
    </span>
  );
}

export function ImperatifBadge() {
  return (
    <span className="inline-block rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
      Impératif
    </span>
  );
}
