"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { HORAIRE_CODES, estCodeSuperposable, estCodeComplement, type Plage } from "@/lib/horaire-codes";

export type PositionSelecteur = { top: number; left: number; width: number };

type HoraireCodeSelectorProps = {
  position: PositionSelecteur;
  aUneValeur?: boolean;
  /** Masque les codes événementiels (superposition) — non pertinents hors du
   * planning réel, ex. dans un roulement qui définit un motif récurrent. */
  masquerEvenementiels?: boolean;
  /** Raccourci proposé sur une case jamais remplie dont le salarié a un
   * roulement actuel : l'appliquer directement, sans bloquer la saisie
   * manuelle d'un code qui reste l'action la plus courante. */
  actionRoulement?: { nomRoulement: string; onAppliquer: () => void };
  onChoisir: (code: string | null) => void;
  /** Un évènement "complement" (à la volée) demande une plage horaire avant
   * d'être posé — cf. retour client du 17/09. */
  onChoisirComplement?: (code: string, plage: Plage) => void;
  onFermer: () => void;
};

export default function HoraireCodeSelector({
  position,
  aUneValeur,
  masquerEvenementiels,
  actionRoulement,
  onChoisir,
  onChoisirComplement,
  onFermer,
}: HoraireCodeSelectorProps) {
  const [recherche, setRecherche] = useState("");
  const [indexSurligne, setIndexSurligne] = useState(0);
  const [codeComplementEnSaisie, setCodeComplementEnSaisie] = useState<string | null>(null);
  const [plageDebut, setPlageDebut] = useState("");
  const [plageFin, setPlageFin] = useState("");

  const codesDisponibles = useMemo(
    () =>
      masquerEvenementiels
        ? HORAIRE_CODES.filter((h) => h.categorie !== "evenementiel")
        : HORAIRE_CODES,
    [masquerEvenementiels]
  );

  const resultats = useMemo(() => {
    const terme = recherche.trim().toUpperCase();
    const filtres = !terme
      ? codesDisponibles
      : codesDisponibles.filter(
          (h) => h.code.toUpperCase().includes(terme) || h.intitule.toUpperCase().includes(terme)
        );
    return [...filtres].sort((a, b) => {
      const groupeA = estCodeSuperposable(a.code) ? 1 : 0;
      const groupeB = estCodeSuperposable(b.code) ? 1 : 0;
      if (groupeA !== groupeB) return groupeA - groupeB;
      return a.code.localeCompare(b.code);
    });
  }, [recherche, codesDisponibles]);

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
      if (choisi) surChoixCode(choisi.code);
    } else if (e.key === "Escape") {
      onFermer();
    }
  }

  function surChoixCode(code: string) {
    if (onChoisirComplement && estCodeComplement(code)) {
      setCodeComplementEnSaisie(code);
      return;
    }
    onChoisir(code);
  }

  function validerComplement() {
    if (!codeComplementEnSaisie || !onChoisirComplement || !plageDebut || !plageFin) return;
    onChoisirComplement(codeComplementEnSaisie, { debut: plageDebut, fin: plageFin });
    setCodeComplementEnSaisie(null);
    setPlageDebut("");
    setPlageFin("");
  }

  if (codeComplementEnSaisie) {
    const horaire = HORAIRE_CODES.find((h) => h.code === codeComplementEnSaisie);
    return (
      <div
        className="fixed z-50 flex flex-col rounded border border-zinc-200 bg-white p-3 shadow-lg"
        style={{ top: position.top, left: position.left, width: Math.max(position.width, 240) }}
      >
        <p className="mb-2 text-xs font-medium text-zinc-700">
          Plage horaire pour «&nbsp;{horaire?.intitule ?? codeComplementEnSaisie}&nbsp;»
        </p>
        <div className="mb-2 flex items-center gap-2">
          <input
            autoFocus
            type="time"
            value={plageDebut}
            onChange={(e) => setPlageDebut(e.target.value)}
            className="rounded border border-zinc-300 px-2 py-1 text-sm"
          />
          <span className="text-zinc-400">→</span>
          <input
            type="time"
            value={plageFin}
            onChange={(e) => setPlageFin(e.target.value)}
            className="rounded border border-zinc-300 px-2 py-1 text-sm"
          />
        </div>
        <p className="mb-2 text-[11px] text-zinc-400">
          Chevauche le code de travail : heures en moins. Hors du code de travail : heures en plus.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setCodeComplementEnSaisie(null)}
            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={validerComplement}
            disabled={!plageDebut || !plageFin}
            className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ajouter
          </button>
        </div>
      </div>
    );
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
      {actionRoulement && (
        <button
          type="button"
          onClick={actionRoulement.onAppliquer}
          className="border-b border-zinc-100 bg-blue-50 px-2 py-1.5 text-left text-xs font-medium text-blue-700 hover:bg-blue-100"
        >
          Appliquer le roulement « {actionRoulement.nomRoulement} »
        </button>
      )}
      <ul className="flex-1 overflow-auto py-1">
        {resultats.map((horaire, index) => {
          const superposable = estCodeSuperposable(horaire.code);
          const premierSuperposable = superposable && !estCodeSuperposable(resultats[index - 1]?.code ?? "");

          return (
            <li key={horaire.code}>
              {premierSuperposable && (
                <div className="mx-2 my-1 border-t border-zinc-100 pt-1 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  Codes de superposition
                </div>
              )}
              <button
                type="button"
                onClick={() => surChoixCode(horaire.code)}
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
              </button>
            </li>
          );
        })}
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
