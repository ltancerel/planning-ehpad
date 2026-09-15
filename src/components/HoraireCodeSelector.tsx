"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { HORAIRE_CODES, estCodeSuperposable } from "@/lib/horaire-codes";

export type PositionSelecteur = { top: number; left: number; width: number };

type HoraireCodeSelectorProps = {
  position: PositionSelecteur;
  aUneValeur?: boolean;
  onChoisir: (code: string | null) => void;
  onFermer: () => void;
};

export default function HoraireCodeSelector({
  position,
  aUneValeur,
  onChoisir,
  onFermer,
}: HoraireCodeSelectorProps) {
  const [recherche, setRecherche] = useState("");
  const [indexSurligne, setIndexSurligne] = useState(0);

  const resultats = useMemo(() => {
    const terme = recherche.trim().toUpperCase();
    const filtres = !terme
      ? HORAIRE_CODES
      : HORAIRE_CODES.filter(
          (h) => h.code.toUpperCase().includes(terme) || h.intitule.toUpperCase().includes(terme)
        );
    return [...filtres].sort((a, b) => a.code.localeCompare(b.code));
  }, [recherche]);

  function changerRecherche(valeur: string) {
    setRecherche(valeur);
    setIndexSurligne(0);
  }

  function surTouche(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndexSurligne((i) => Math.min(i + 1, resultats.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndexSurligne((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const choisi = resultats[indexSurligne];
      if (choisi) onChoisir(choisi.code);
    } else if (e.key === "Escape") {
      onFermer();
    }
  }

  return (
    <div
      className="fixed z-50 flex max-h-80 flex-col rounded border border-zinc-200 bg-white shadow-lg"
      style={{ top: position.top, left: position.left, width: Math.max(position.width, 240) }}
    >
      <input
        autoFocus
        value={recherche}
        onChange={(e) => changerRecherche(e.target.value)}
        onKeyDown={surTouche}
        placeholder="Rechercher un code ou un libellé…"
        className="border-b border-zinc-200 px-2 py-1.5 text-sm outline-none"
      />
      <ul className="flex-1 overflow-auto py-1">
        {resultats.map((horaire, index) => (
          <li key={horaire.code}>
            <button
              type="button"
              onClick={() => onChoisir(horaire.code)}
              onMouseEnter={() => setIndexSurligne(index)}
              className={`flex w-full items-center gap-2 px-2 py-1 text-left text-sm ${
                index === indexSurligne ? "bg-zinc-100" : ""
              }`}
            >
              <span
                className="inline-block min-w-[2.25rem] shrink-0 rounded px-1.5 py-0.5 text-center text-xs font-semibold"
                style={{ backgroundColor: horaire.couleurFond, color: horaire.couleurTexte }}
              >
                {horaire.code}
              </span>
              <span className="truncate text-zinc-700">{horaire.intitule}</span>
              {estCodeSuperposable(horaire.code) && (
                <span className="ml-auto shrink-0 text-[10px] text-zinc-400">se superpose</span>
              )}
            </button>
          </li>
        ))}
        {resultats.length === 0 && (
          <li className="px-2 py-3 text-center text-xs text-zinc-400">Aucun code trouvé</li>
        )}
      </ul>
      {aUneValeur && (
        <button
          type="button"
          onClick={() => onChoisir(null)}
          className="border-t border-zinc-100 px-2 py-1.5 text-left text-xs font-medium text-red-500 hover:bg-red-50"
        >
          Vider la cellule
        </button>
      )}
    </div>
  );
}
