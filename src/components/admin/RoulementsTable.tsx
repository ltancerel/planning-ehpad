"use client";

import { useMemo } from "react";
import type { Roulement } from "@/lib/mock-data";
import type { HoraireCode } from "@/lib/horaire-codes";

const JOURS = ["L", "Ma", "M", "J", "V", "S", "D"];

type RoulementsTableProps = {
  roulements: Roulement[];
  codesHoraires: HoraireCode[];
  onModifier: (roulement: Roulement) => void;
  onSupprimer: (roulement: Roulement) => void;
};

export default function RoulementsTable({ roulements, codesHoraires, onModifier, onSupprimer }: RoulementsTableProps) {
  const codesParCode = useMemo(
    () => Object.fromEntries(codesHoraires.map((h) => [h.code.toUpperCase(), h])),
    [codesHoraires]
  );
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-500">
          <th className="px-3 py-2">Nom</th>
          <th className="px-3 py-2">Semaines</th>
          <th className="px-3 py-2">Aperçu</th>
          <th className="px-3 py-2" />
        </tr>
      </thead>
      <tbody>
        {roulements.map((roulement) => (
          <tr key={roulement.id} className="border-b border-zinc-100 hover:bg-zinc-50">
            <td className="px-3 py-2 font-medium">{roulement.nom}</td>
            <td className="px-3 py-2 text-zinc-600">{roulement.nbSemaines}</td>
            <td className="px-3 py-2">
              <div className="space-y-1">
                {roulement.motif.map((semaine, index) => (
                  <div key={index} className="flex gap-0.5">
                    {semaine.map((code, jourIndex) => {
                      const horaire = code ? codesParCode[code.toUpperCase()] : undefined;
                      return (
                        <span
                          key={jourIndex}
                          title={`${JOURS[jourIndex]} — ${horaire?.intitule ?? "Repos"}`}
                          className="flex h-4 w-6 items-center justify-center rounded-sm text-[9px] font-semibold"
                          style={{
                            backgroundColor: horaire?.couleurFond ?? "#f4f4f5",
                            color: horaire?.couleurTexte ?? "#a1a1aa",
                          }}
                        >
                          {code || "·"}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </td>
            <td className="px-3 py-2 text-right align-top">
              <button
                onClick={() => onModifier(roulement)}
                className="mr-3 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Modifier
              </button>
              <button
                onClick={() => onSupprimer(roulement)}
                className="text-xs font-medium text-red-500 hover:text-red-700"
              >
                Supprimer
              </button>
            </td>
          </tr>
        ))}
        {roulements.length === 0 && (
          <tr>
            <td colSpan={4} className="px-3 py-6 text-center text-sm text-zinc-400">
              Aucun roulement.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
