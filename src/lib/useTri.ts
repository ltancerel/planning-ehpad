import { useMemo, useState } from "react";

// Tri de tableau générique pour les écrans Admin (Utilisateurs, Salariés,
// Codes horaires, Roulements, Années — retour client du 11/11 : aucun des
// tableaux ne permettait de trier les lignes). Un clic sur une colonne
// trie dans l'ordre croissant ; un second clic sur la même colonne inverse
// le sens ; cliquer une autre colonne repart en croissant sur celle-ci.
// Comparaison alphanumérique "naturelle" (ex. "70A" avant "185", au lieu
// de l'ordre lexical pur qui mettrait "185" avant "70A").

export type SensTri = "asc" | "desc";

export function useTri<Ligne, Colonne extends string>(
  lignes: Ligne[],
  valeurColonne: Record<Colonne, (ligne: Ligne) => string | number | boolean>
) {
  const [colonne, setColonne] = useState<Colonne | null>(null);
  const [sens, setSens] = useState<SensTri>("asc");

  function trierPar(c: Colonne) {
    if (c === colonne) {
      setSens((s) => (s === "asc" ? "desc" : "asc"));
    } else {
      setColonne(c);
      setSens("asc");
    }
  }

  const lignesTriees = useMemo(() => {
    if (!colonne) return lignes;
    const extraire = valeurColonne[colonne];
    const copie = [...lignes];
    copie.sort((a, b) => {
      const va = extraire(a);
      const vb = extraire(b);
      let cmp: number;
      if (typeof va === "number" && typeof vb === "number") {
        cmp = va - vb;
      } else if (typeof va === "boolean" && typeof vb === "boolean") {
        cmp = Number(va) - Number(vb);
      } else {
        cmp = String(va).localeCompare(String(vb), "fr", { numeric: true, sensitivity: "base" });
      }
      return sens === "asc" ? cmp : -cmp;
    });
    return copie;
    // valeurColonne est un objet littéral recréé à chaque rendu par l'appelant :
    // le lister exhaustivement provoquerait un tri à chaque frappe sans raison.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lignes, colonne, sens]);

  return { lignesTriees, colonne, sens, trierPar };
}
