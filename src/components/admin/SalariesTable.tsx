"use client";

import type { FicheSalarie } from "@/lib/mock-data";

type SalariesTableProps = {
  salaries: FicheSalarie[];
  onModifier: (salarie: FicheSalarie) => void;
  onSupprimer: (salarie: FicheSalarie) => void;
};

export default function SalariesTable({ salaries, onModifier, onSupprimer }: SalariesTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-500">
          <th className="px-3 py-2">Matricule</th>
          <th className="px-3 py-2">Nom</th>
          <th className="px-3 py-2">Prénom</th>
          <th className="px-3 py-2">Service</th>
          <th className="px-3 py-2">Contrat</th>
          <th className="px-3 py-2">Manager</th>
          <th className="px-3 py-2">Équipe</th>
          <th className="px-3 py-2">Présence</th>
          <th className="px-3 py-2" />
        </tr>
      </thead>
      <tbody>
        {salaries.map((salarie) => (
          <tr key={salarie.id} className="border-b border-zinc-100 hover:bg-zinc-50">
            <td className="px-3 py-2">
              <span className="inline-block rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                {salarie.matricule}
              </span>
            </td>
            <td className="px-3 py-2">{salarie.nom}</td>
            <td className="px-3 py-2">{salarie.prenom}</td>
            <td className="px-3 py-2 text-zinc-600">{salarie.service}</td>
            <td className="px-3 py-2">
              <span className="mr-1 inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600">
                {salarie.typeContrat}
              </span>
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                  salarie.contratActif ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-500"
                }`}
              >
                {salarie.contratActif ? "Actif" : "Inactif"}
              </span>
            </td>
            <td className="px-3 py-2 text-zinc-600">{salarie.manager}</td>
            <td className="px-3 py-2 text-zinc-600">{salarie.equipe}</td>
            <td className="px-3 py-2">
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                  salarie.presence === "Présent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {salarie.presence}
              </span>
            </td>
            <td className="px-3 py-2 text-right">
              <button
                onClick={() => onModifier(salarie)}
                className="mr-3 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Modifier
              </button>
              <button
                onClick={() => onSupprimer(salarie)}
                className="text-xs font-medium text-red-500 hover:text-red-700"
              >
                Supprimer
              </button>
            </td>
          </tr>
        ))}
        {salaries.length === 0 && (
          <tr>
            <td colSpan={9} className="px-3 py-6 text-center text-sm text-zinc-400">
              Aucun salarié.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
