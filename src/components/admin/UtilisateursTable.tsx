"use client";

import type { Utilisateur } from "@/lib/mock-data";
import { useTri } from "@/lib/useTri";
import ThTriable from "./ThTriable";

const STYLE_TYPE_UTILISATEUR: Record<Utilisateur["typeUtilisateur"], string> = {
  Administrateur: "bg-amber-100 text-amber-800",
  Manager: "bg-blue-100 text-blue-800",
  Utilisateur: "bg-zinc-100 text-zinc-600",
};

type UtilisateursTableProps = {
  utilisateurs: Utilisateur[];
  onModifier: (utilisateur: Utilisateur) => void;
  onSupprimer: (utilisateur: Utilisateur) => void;
};

type ColonneTriable = "identifiant" | "nom" | "prenom" | "email" | "type" | "service" | "poste";

export default function UtilisateursTable({ utilisateurs, onModifier, onSupprimer }: UtilisateursTableProps) {
  const { lignesTriees, colonne, sens, trierPar } = useTri<Utilisateur, ColonneTriable>(utilisateurs, {
    identifiant: (u) => u.identifiant,
    nom: (u) => u.nom,
    prenom: (u) => u.prenom,
    email: (u) => u.email,
    type: (u) => u.typeUtilisateur,
    service: (u) => u.services.join(", "),
    poste: (u) => u.poste,
  });

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-500">
          <ThTriable colonne="identifiant" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Identifiant
          </ThTriable>
          <ThTriable colonne="nom" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Nom
          </ThTriable>
          <ThTriable colonne="prenom" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Prénom
          </ThTriable>
          <ThTriable colonne="email" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Email
          </ThTriable>
          <ThTriable colonne="type" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Type
          </ThTriable>
          <ThTriable colonne="service" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Service
          </ThTriable>
          <ThTriable colonne="poste" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Poste
          </ThTriable>
          <th className="px-3 py-2" />
        </tr>
      </thead>
      <tbody>
        {lignesTriees.map((utilisateur) => (
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
                className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${STYLE_TYPE_UTILISATEUR[utilisateur.typeUtilisateur]}`}
              >
                {utilisateur.typeUtilisateur}
              </span>
            </td>
            <td className="px-3 py-2 text-zinc-600">{utilisateur.services.join(", ") || "—"}</td>
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
