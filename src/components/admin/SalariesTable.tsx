"use client";

import type { FicheSalarie } from "@/lib/mock-data";
import { useTri } from "@/lib/useTri";
import ThTriable from "./ThTriable";

type SalariesTableProps = {
  salaries: FicheSalarie[];
  onModifier: (salarie: FicheSalarie) => void;
  onSupprimer: (salarie: FicheSalarie) => void;
};

type ColonneTriable = "matricule" | "nom" | "prenom" | "service" | "typePaie" | "groupeRoulement" | "presence";

export default function SalariesTable({ salaries, onModifier, onSupprimer }: SalariesTableProps) {
  const { lignesTriees, colonne, sens, trierPar } = useTri<FicheSalarie, ColonneTriable>(salaries, {
    matricule: (s) => s.matricule,
    nom: (s) => s.nom,
    prenom: (s) => s.prenom,
    service: (s) => s.service,
    typePaie: (s) => s.typePaie,
    groupeRoulement: (s) => s.groupeRoulement,
    presence: (s) => s.presence,
  });

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-500">
          <ThTriable colonne="matricule" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Matricule
          </ThTriable>
          <ThTriable colonne="nom" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Nom
          </ThTriable>
          <ThTriable colonne="prenom" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Prénom
          </ThTriable>
          <ThTriable colonne="service" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Service
          </ThTriable>
          <ThTriable colonne="typePaie" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Type de paie
          </ThTriable>
          <ThTriable colonne="groupeRoulement" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Alignement roulement
          </ThTriable>
          <ThTriable colonne="presence" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Présence
          </ThTriable>
          <th className="px-3 py-2" />
        </tr>
      </thead>
      <tbody>
        {lignesTriees.map((salarie) => (
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
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                  salarie.typePaie === "Aucun" ? "bg-zinc-200 text-zinc-500" : "bg-green-100 text-green-700"
                }`}
              >
                {salarie.typePaie}
              </span>
            </td>
            <td className="px-3 py-2 text-zinc-600">{salarie.groupeRoulement}</td>
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
            <td colSpan={8} className="px-3 py-6 text-center text-sm text-zinc-400">
              Aucun salarié.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
