"use client";

import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  HORAIRE_CODES,
  estCodeSuperposable,
  estCodeComplement,
  plageComplementValide,
  type Plage,
} from "@/lib/horaire-codes";

export type PositionSelecteur = { top: number; left: number; width: number };

type HoraireCodeSelectorProps = {
  position: PositionSelecteur;
  aUneValeur?: boolean;
  /** Masque les codes événementiels (superposition) — non pertinents hors du
   * planning réel, ex. dans un roulement qui définit un motif récurrent. */
  masquerEvenementiels?: boolean;
  /** Raccourci proposé sur une case jamais remplie dont le salarié a un
   * roulement actuel : l'appliquer directement, sans bloquer la saisie
   * manuelle d'un code qui reste l'action la plus courante. Si le roulement
   * porte sur plusieurs semaines, un sélecteur permet de choisir la semaine
   * du motif à partir de laquelle démarrer (retour client du 22/09) — utile
   * pour reprendre un roulement en cours de cycle, ex. démarrer à la semaine
   * 3 d'un motif sur 4 semaines. */
  actionRoulement?: { nomRoulement: string; nbSemaines: number; onAppliquer: (semaineDepart: number) => void };
  onChoisir: (code: string | null) => void;
  /** Un évènement "complement" (à la volée) demande une ou plusieurs plages
   * horaires avant d'être posé — cf. retour client du 17/09, étendu le
   * 22/09 (plusieurs plages possibles le même jour, ex. arrivée anticipée
   * et départ tardif). Une plage par défaut, avec possibilité d'en ajouter
   * d'autres depuis le même formulaire. */
  onChoisirComplement?: (code: string, plages: Plage[]) => void;
  /** Plages du code de travail de la case en cours d'édition, pour valider
   * que la plage saisie ne le chevauche pas partiellement (retour client
   * du 17/09 : ex. code 8h-18h, refuser un évènement 16h-20h). */
  plagesTravail?: Plage[];
  onFermer: () => void;
};

export default function HoraireCodeSelector({
  position,
  aUneValeur,
  masquerEvenementiels,
  actionRoulement,
  onChoisir,
  onChoisirComplement,
  plagesTravail,
  onFermer,
}: HoraireCodeSelectorProps) {
  const [recherche, setRecherche] = useState("");
  const [indexSurligne, setIndexSurligne] = useState(0);
  const [codeComplementEnSaisie, setCodeComplementEnSaisie] = useState<string | null>(null);
  // Une plage par défaut ; "+ Ajouter une plage" en insère d'autres (retour
  // client du 22/09).
  const [plages, setPlages] = useState<Plage[]>([{ debut: "", fin: "" }]);
  const [semaineDepartRoulement, setSemaineDepartRoulement] = useState(1);
  // Le sélecteur de semaine de départ ne prend de la place à l'écran qu'une
  // fois le bouton « Appliquer le roulement » cliqué une première fois
  // (retour client du 22/09 : trop encombrant affiché d'emblée).
  const [demarrageRoulementOuvert, setDemarrageRoulementOuvert] = useState(false);

  // La position d'ancrage (sous la case cliquée) peut pousser le popover hors
  // de l'écran pour une case proche du bord droit/bas — le bouton "Ajouter"
  // devient alors inatteignable (retour client du 17/09 : "impossible
  // d'enregistrer"). On mesure la taille réelle une fois rendu et on
  // recadre dans la fenêtre visible.
  const conteneurRef = useRef<HTMLDivElement>(null);
  const [positionAffichee, setPositionAffichee] = useState({ top: position.top, left: position.left });

  useLayoutEffect(() => {
    const el = conteneurRef.current;
    if (!el) return;
    const marge = 8;
    const left = Math.min(
      Math.max(position.left, marge),
      Math.max(marge, window.innerWidth - el.offsetWidth - marge)
    );
    const top = Math.min(
      Math.max(position.top, marge),
      Math.max(marge, window.innerHeight - el.offsetHeight - marge)
    );
    setPositionAffichee({ top, left });
  }, [position.top, position.left, position.width, codeComplementEnSaisie, plages.length]);

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

  // Un chevauchement partiel avéré est refusé (retour client du 17/09), mais
  // une saisie mal formatée (texte libre non reconnu) n'est jamais bloquante
  // — elle sera simplement sans effet sur le décompte d'heures plutôt que
  // d'empêcher l'ajout.
  const toutesPlagesCompletes = plages.every((p) => p.debut.trim() && p.fin.trim());
  const toutesPlagesValides = plages.every(
    (p) => !(p.debut.trim() && p.fin.trim()) || plageComplementValide(p, plagesTravail ?? [])
  );

  function mettreAJourPlage(index: number, champ: "debut" | "fin", valeur: string) {
    setPlages((prev) => prev.map((p, i) => (i === index ? { ...p, [champ]: valeur } : p)));
  }

  function ajouterPlage() {
    setPlages((prev) => [...prev, { debut: "", fin: "" }]);
  }

  function retirerPlage(index: number) {
    setPlages((prev) => prev.filter((_, i) => i !== index));
  }

  function fermerComplement() {
    setCodeComplementEnSaisie(null);
    setPlages([{ debut: "", fin: "" }]);
  }

  function validerComplement() {
    if (!codeComplementEnSaisie || !onChoisirComplement || !toutesPlagesCompletes || !toutesPlagesValides) return;
    onChoisirComplement(codeComplementEnSaisie, plages);
    fermerComplement();
  }

  if (codeComplementEnSaisie) {
    const horaire = HORAIRE_CODES.find((h) => h.code === codeComplementEnSaisie);
    return (
      <div
        ref={conteneurRef}
        className="fixed z-50 flex flex-col rounded border border-zinc-200 bg-white p-3 shadow-lg"
        style={{ top: positionAffichee.top, left: positionAffichee.left, width: Math.max(position.width, 240) }}
      >
        <p className="mb-2 text-xs font-medium text-zinc-700">
          Plage{plages.length > 1 ? "s" : ""} horaire{plages.length > 1 ? "s" : ""} pour «&nbsp;
          {horaire?.intitule ?? codeComplementEnSaisie}&nbsp;»
        </p>
        <div className="mb-1.5 flex flex-col gap-1.5">
          {plages.map((plage, index) => {
            const plageInvalide =
              Boolean(plage.debut.trim() && plage.fin.trim()) &&
              !plageComplementValide(plage, plagesTravail ?? []);
            return (
              <div key={index} className="flex items-center gap-2">
                <input
                  autoFocus={index === 0}
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="08:00"
                  value={plage.debut}
                  onChange={(e) => mettreAJourPlage(index, "debut", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && validerComplement()}
                  className={`w-20 rounded border px-2 py-1 text-sm ${
                    plageInvalide ? "border-red-400" : "border-zinc-300"
                  }`}
                />
                <span className="text-zinc-400">→</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="10:00"
                  value={plage.fin}
                  onChange={(e) => mettreAJourPlage(index, "fin", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && validerComplement()}
                  className={`w-20 rounded border px-2 py-1 text-sm ${
                    plageInvalide ? "border-red-400" : "border-zinc-300"
                  }`}
                />
                {plages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => retirerPlage(index)}
                    aria-label="Retirer cette plage"
                    className="ml-auto text-zinc-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={ajouterPlage}
          className="mb-2 self-start text-[11px] font-medium text-blue-600 hover:text-blue-700"
        >
          + Ajouter une plage
        </button>
        {!toutesPlagesValides ? (
          <p className="mb-2 text-[11px] font-medium text-red-600">
            Une plage chevauche partiellement le code de travail : choisissez une plage entièrement
            incluse dedans (heures en moins) ou entièrement en dehors (heures en plus).
          </p>
        ) : (
          <p className="mb-2 text-[11px] text-zinc-400">
            Chevauche le code de travail : heures en moins. Hors du code de travail : heures en plus.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={fermerComplement}
            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={validerComplement}
            disabled={!toutesPlagesCompletes || !toutesPlagesValides}
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
      ref={conteneurRef}
      className="fixed z-50 flex max-h-80 flex-col rounded border border-zinc-200 bg-white shadow-lg"
      style={{ top: positionAffichee.top, left: positionAffichee.left, width: Math.max(position.width, 240) }}
    >
      <input
        autoFocus
        value={recherche}
        onChange={(e) => changerRecherche(e.target.value)}
        onKeyDown={surTouche}
        placeholder="Rechercher un code ou un libellé…"
        className="border-b border-zinc-200 px-2 py-1.5 text-sm outline-none"
      />
      {actionRoulement && !demarrageRoulementOuvert && (
        <button
          type="button"
          onClick={() => {
            if (actionRoulement.nbSemaines > 1) {
              setDemarrageRoulementOuvert(true);
            } else {
              actionRoulement.onAppliquer(1);
            }
          }}
          className="border-b border-zinc-100 bg-blue-50 px-2 py-1.5 text-left text-xs font-medium text-blue-700 hover:bg-blue-100"
        >
          Appliquer le roulement « {actionRoulement.nomRoulement} »
        </button>
      )}
      {actionRoulement && demarrageRoulementOuvert && (
        <div className="border-b border-zinc-100 bg-blue-50 px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-blue-700">Démarrer à la semaine :</span>
            <div className="flex gap-0.5">
              {Array.from({ length: actionRoulement.nbSemaines }, (_, i) => i + 1).map((semaine) => (
                <button
                  key={semaine}
                  type="button"
                  onClick={() => setSemaineDepartRoulement(semaine)}
                  className={`h-5 w-5 rounded text-[11px] font-medium ${
                    semaine === semaineDepartRoulement
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {semaine}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => actionRoulement.onAppliquer(semaineDepartRoulement)}
            className="mt-1.5 rounded bg-blue-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-700"
          >
            {semaineDepartRoulement === 1
              ? "Appliquer"
              : `Appliquer à partir de la semaine ${semaineDepartRoulement}`}
          </button>
        </div>
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
