"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type IdentiteEhpad = {
  nom: string;
  logo: string | null; // data URL
};

export const EHPAD_PAR_DEFAUT: IdentiteEhpad = {
  nom: "Les Jardins de Rambam",
  logo: null,
};

const CLE_STOCKAGE = "planning-ehpad:identite-ehpad";

type EhpadContextValue = {
  identite: IdentiteEhpad;
  definirIdentite: (identite: IdentiteEhpad) => void;
};

const EhpadContext = createContext<EhpadContextValue | null>(null);

export function EhpadProvider({ children }: { children: ReactNode }) {
  const [identite, setIdentite] = useState<IdentiteEhpad>(EHPAD_PAR_DEFAUT);

  // Hydratation depuis localStorage au montage (cf. justification sur le sélecteur de période)
  useEffect(() => {
    try {
      const enregistree = localStorage.getItem(CLE_STOCKAGE);
      if (!enregistree) return;
      const valeur = JSON.parse(enregistree) as IdentiteEhpad;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIdentite(valeur);
    } catch {
      // localStorage indisponible ou donnée corrompue : on garde la valeur par défaut
    }
  }, []);

  function definirIdentite(nouvelle: IdentiteEhpad) {
    setIdentite(nouvelle);
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(nouvelle));
    } catch {
      // ignoré : la persistance est un confort, pas une exigence bloquante
    }
  }

  return (
    <EhpadContext.Provider value={{ identite, definirIdentite }}>{children}</EhpadContext.Provider>
  );
}

export function useEhpad(): EhpadContextValue {
  const ctx = useContext(EhpadContext);
  if (!ctx) throw new Error("useEhpad doit être utilisé à l'intérieur d'un EhpadProvider");
  return ctx;
}
