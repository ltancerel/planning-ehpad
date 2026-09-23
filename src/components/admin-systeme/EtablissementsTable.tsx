"use client";

import type { Etablissement } from "@/lib/admin-systeme-mock-data";

export default function EtablissementsTable({
  etablissements,
  onModifier,
}: {
  etablissements: Etablissement[];
  onModifier: (etablissement: Etablissement) => void;
}) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-zinc-50 text-xs text-zinc-500">
        <tr>
          <th className="px-3 py-2 font-medium">Nom</th>
          <th className="px-3 py-2 font-medium">Ville</th>
          <th className="px-3 py-2 font-medium">Statut</th>
          <th className="px-3 py-2 font-medium">Applications</th>
          <th className="px-3 py-2 font-medium">Créé le</th>
          <th className="px-3 py-2 font-medium" />
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {etablissements.map((etablissement) => (
          <tr key={etablissement.id}>
            <td className="px-3 py-2 font-medium text-zinc-800">{etablissement.nom}</td>
            <td className="px-3 py-2 text-zinc-600">{etablissement.ville}</td>
            <td className="px-3 py-2">
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                  etablissement.statut === "actif"
                    ? "bg-green-100 text-green-700"
                    : "bg-zinc-200 text-zinc-500"
                }`}
              >
                {etablissement.statut === "actif" ? "Actif" : "Inactif"}
              </span>
            </td>
            <td className="px-3 py-2">
              {etablissement.applications.length === 0 ? (
                <span className="text-xs text-zinc-400">Aucune</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {etablissement.applications.map((application) => (
                    <span
                      key={application}
                      className="rounded bg-[#A7D97A]/30 px-1.5 py-0.5 text-[11px] font-medium text-[#0F3A35]"
                    >
                      {application}
                    </span>
                  ))}
                </div>
              )}
            </td>
            <td className="px-3 py-2 text-xs text-zinc-500">
              {new Date(etablissement.dateCreation).toLocaleDateString("fr-FR")}
            </td>
            <td className="px-3 py-2 text-right">
              <button
                onClick={() => onModifier(etablissement)}
                className="text-xs font-medium text-[#0F3A35] hover:text-[#2F5B43]"
              >
                Modifier
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
