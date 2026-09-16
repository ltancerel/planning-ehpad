"use client";

import type { HoraireCode } from "@/lib/horaire-codes";
import { dureeHeures } from "@/lib/horaire-codes";

const LIBELLE_CATEGORIE: Record<HoraireCode["categorie"], string> = {
  travail: "Travail",
  informatif: "Informatif",
  evenementiel: "Événementiel",
  special: "Particulier",
};

const LIBELLE_TYPE_EVENEMENT: Record<"superposition" | "complement", string> = {
  superposition: "Superposition",
  complement: "Complément à la volée",
};

type HoraireCodesTableProps = {
  codes: HoraireCode[];
  onModifier: (code: HoraireCode) => void;
  onSupprimer: (code: HoraireCode) => void;
};

function resumePlages(code: HoraireCode): string {
  if (!code.plages?.length) return "—";
  return code.plages.map((p) => `${p.debut}-${p.fin}`).join(", ");
}

export default function HoraireCodesTable({ codes, onModifier, onSupprimer }: HoraireCodesTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-500">
          <th className="px-3 py-2">Code</th>
          <th className="px-3 py-2">Intitulé</th>
          <th className="px-3 py-2">Catégorie</th>
          <th className="px-3 py-2">Plages</th>
          <th className="px-3 py-2">Heures/jour</th>
          <th className="px-3 py-2">Commentaire</th>
          <th className="px-3 py-2" />
        </tr>
      </thead>
      <tbody>
        {codes.map((code) => (
          <tr key={code.code} className="border-b border-zinc-100 hover:bg-zinc-50">
            <td className="px-3 py-2">
              <span
                className="inline-block min-w-[2.5rem] rounded px-2 py-0.5 text-center text-xs font-semibold"
                style={{ backgroundColor: code.couleurFond, color: code.couleurTexte }}
              >
                {code.code}
              </span>
            </td>
            <td className="px-3 py-2">{code.intitule}</td>
            <td className="px-3 py-2 text-zinc-600">
              {LIBELLE_CATEGORIE[code.categorie]}
              {code.categorie === "evenementiel" && code.typeEvenement && (
                <span className="ml-1 text-[11px] text-zinc-400">
                  ({LIBELLE_TYPE_EVENEMENT[code.typeEvenement]})
                </span>
              )}
            </td>
            <td className="px-3 py-2 text-zinc-600">{resumePlages(code)}</td>
            <td className="px-3 py-2 text-zinc-600">
              {code.categorie === "travail" ? `${dureeHeures(code.plages)}h` : "—"}
            </td>
            <td className="max-w-[16rem] truncate px-3 py-2 text-zinc-500" title={code.commentaire}>
              {code.commentaire ?? "—"}
            </td>
            <td className="px-3 py-2 text-right">
              <button
                onClick={() => onModifier(code)}
                className="mr-3 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Modifier
              </button>
              <button
                onClick={() => onSupprimer(code)}
                className="text-xs font-medium text-red-500 hover:text-red-700"
              >
                Supprimer
              </button>
            </td>
          </tr>
        ))}
        {codes.length === 0 && (
          <tr>
            <td colSpan={7} className="px-3 py-6 text-center text-sm text-zinc-400">
              Aucun code horaire.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
