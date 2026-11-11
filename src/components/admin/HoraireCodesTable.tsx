"use client";

import type { HoraireCode } from "@/lib/horaire-codes";
import { dureeHeures } from "@/lib/horaire-codes";
import { useTri } from "@/lib/useTri";
import ThTriable from "./ThTriable";

const LIBELLE_CATEGORIE: Record<HoraireCode["categorie"], string> = {
  travail: "Travail",
  informatif: "Informatif",
  evenementiel: "Événementiel",
};

const LIBELLE_TYPE_EVENEMENT: Record<NonNullable<HoraireCode["typeEvenement"]>, string> = {
  special: "Spécial",
  normal: "Normal",
  partiel: "Partiel",
};

type HoraireCodesTableProps = {
  codes: HoraireCode[];
  onModifier: (code: HoraireCode) => void;
  onSupprimer: (code: HoraireCode) => void;
};

type ColonneTriable = "code" | "intitule" | "categorie" | "plages" | "heures" | "type" | "commentaire";

function resumePlages(code: HoraireCode): string {
  if (!code.plages?.length) return "—";
  return code.plages.map((p) => `${p.debut}-${p.fin}`).join(", ");
}

function heuresParJour(code: HoraireCode): number {
  return code.categorie === "travail" ? dureeHeures(code.plages) : 0;
}

export default function HoraireCodesTable({ codes, onModifier, onSupprimer }: HoraireCodesTableProps) {
  const { lignesTriees, colonne, sens, trierPar } = useTri<HoraireCode, ColonneTriable>(codes, {
    code: (c) => c.code,
    intitule: (c) => c.intitule,
    categorie: (c) => LIBELLE_CATEGORIE[c.categorie],
    plages: (c) => resumePlages(c),
    heures: (c) => heuresParJour(c),
    type: (c) => (c.typeEvenement ? LIBELLE_TYPE_EVENEMENT[c.typeEvenement] : ""),
    commentaire: (c) => c.commentaire ?? "",
  });

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-500">
          <ThTriable colonne="code" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Code
          </ThTriable>
          <ThTriable colonne="intitule" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Intitulé
          </ThTriable>
          <ThTriable colonne="categorie" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Catégorie
          </ThTriable>
          <ThTriable colonne="plages" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Plages
          </ThTriable>
          <ThTriable colonne="heures" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Heures/jour
          </ThTriable>
          <ThTriable colonne="type" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Type
          </ThTriable>
          <ThTriable colonne="commentaire" colonneActive={colonne} sens={sens} onTrier={trierPar}>
            Commentaire
          </ThTriable>
          <th className="px-3 py-2" />
        </tr>
      </thead>
      <tbody>
        {lignesTriees.map((code) => (
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
            <td className="px-3 py-2 text-zinc-600">{LIBELLE_CATEGORIE[code.categorie]}</td>
            <td className="px-3 py-2 text-zinc-600">{resumePlages(code)}</td>
            <td className="px-3 py-2 text-zinc-600">
              {code.categorie === "travail" ? `${dureeHeures(code.plages)}h` : "—"}
            </td>
            <td className="px-3 py-2 text-zinc-600">
              {code.typeEvenement ? LIBELLE_TYPE_EVENEMENT[code.typeEvenement] : "—"}
            </td>
            <td className="max-w-[12rem] truncate px-3 py-2 text-zinc-500" title={code.commentaire}>
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
            <td colSpan={8} className="px-3 py-6 text-center text-sm text-zinc-400">
              Aucun code horaire.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
