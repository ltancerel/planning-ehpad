"use client";

import type { AnneePlanifiee } from "@/lib/mock-data";
import { estAnneeBissextile } from "@/lib/jours-feries";

type AnneesTableProps = {
  annees: AnneePlanifiee[];
  onModifier: (annee: AnneePlanifiee) => void;
};

export default function AnneesTable({ annees, onModifier }: AnneesTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-500">
          <th className="px-3 py-2">Année</th>
          <th className="px-3 py-2">Jour de démarrage</th>
          <th className="px-3 py-2">Type</th>
          <th className="px-3 py-2">Jours fériés actifs</th>
          <th className="px-3 py-2" />
        </tr>
      </thead>
      <tbody>
        {annees.map((annee) => {
          const bissextile = estAnneeBissextile(annee.annee);
          const nbActifs = annee.joursFeries.filter((j) => j.actif).length;
          return (
            <tr key={annee.id} className="border-b border-zinc-100 hover:bg-zinc-50">
              <td className="px-3 py-2 font-semibold">{annee.annee}</td>
              <td className="px-3 py-2 text-zinc-600">{annee.jourDemarrage}</td>
              <td className="px-3 py-2">
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                    bissextile ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {bissextile ? "Bissextile — 366 jours" : "365 jours"}
                </span>
              </td>
              <td className="px-3 py-2 text-zinc-600">
                {nbActifs} / {annee.joursFeries.length}
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => onModifier(annee)}
                  className="mr-3 text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  Modifier
                </button>
                <span
                  className="cursor-not-allowed text-xs font-medium text-zinc-300"
                  title="Une année déjà planifiée ne peut pas être supprimée."
                >
                  Supprimer
                </span>
              </td>
            </tr>
          );
        })}
        {annees.length === 0 && (
          <tr>
            <td colSpan={5} className="px-3 py-6 text-center text-sm text-zinc-400">
              Aucune année planifiée.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
