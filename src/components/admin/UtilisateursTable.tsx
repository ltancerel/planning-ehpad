"use client";

import type { Utilisateur } from "@/lib/mock-data";

type UtilisateursTableProps = {
  utilisateurs: Utilisateur[];
  onModifier: (utilisateur: Utilisateur) => void;
  onSupprimer: (utilisateur: Utilisateur) => void;
};

export default function UtilisateursTable({ utilisateurs, onModifier, onSupprimer }: UtilisateursTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-500">
          <th className="px-3 py-2">Identifiant</th>
          <th className="px-3 py-2">Nom</th>
          <th className="px-3 py-2">Prénom</th>
          <th className="px-3 py-2">Email</th>
          <th className="px-3 py-2">Type</th>
          <th className="px-3 py-2">Service</th>
          <th className="px-3 py-2">Poste</th>
          <th className="px-3 py-2" />
        </tr>
      </thead>
      <tbody>
        {utilisateurs.map((utilisateur) => (
          <tr key={utilisateur.id} className="border-b border-zinc-100 hover:bg-zinc-50">
            <td className="px-3 py-2">
              <span className="inline-block rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                {utilisateur.identifiant}
              </span>
            </td>
            <td className="px-3 py-2">{utilisateur.nom}</td>
            <td className="px-3 py-2">{utilisateur.prenom}</td>
            <td className="px-3 py-2 text-zinc-500">{utilisateur.email}</td>
            <td className="px-3 py-2">
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                  utilisateur.typeUtilisateur === "Administrateur"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {utilisateur.typeUtilisateur}
              </span>
            </td>
            <td className="px-3 py-2 text-zinc-600">{utilisateur.service}</td>
            <td className="px-3 py-2 text-zinc-600">{utilisateur.poste}</td>
            <td className="px-3 py-2 text-right">
              <button
                onClick={() => onModifier(utilisateur)}
                className="mr-3 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Modifier
              </button>
              <button
                onClick={() => onSupprimer(utilisateur)}
                className="text-xs font-medium text-red-500 hover:text-red-700"
              >
                Supprimer
              </button>
            </td>
          </tr>
        ))}
        {utilisateurs.length === 0 && (
          <tr>
            <td colSpan={8} className="px-3 py-6 text-center text-sm text-zinc-400">
              Aucun utilisateur.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
