"use client";

import { useState } from "react";
import { HORAIRE_CODES, type HoraireCode } from "@/lib/horaire-codes";
import HoraireCodesTable from "@/components/admin/HoraireCodesTable";
import HoraireCodeForm from "@/components/admin/HoraireCodeForm";

export default function HorairesAdminPage() {
  const [codes, setCodes] = useState<HoraireCode[]>(HORAIRE_CODES);
  const [panneau, setPanneau] = useState<"ferme" | "creation" | "edition">("ferme");
  const [codeEnEdition, setCodeEnEdition] = useState<HoraireCode | undefined>(undefined);

  function ouvrirCreation() {
    setCodeEnEdition(undefined);
    setPanneau("creation");
  }

  function ouvrirEdition(code: HoraireCode) {
    setCodeEnEdition(code);
    setPanneau("edition");
  }

  function fermerPanneau() {
    setPanneau("ferme");
    setCodeEnEdition(undefined);
  }

  function enregistrer(code: HoraireCode) {
    setCodes((prev) => {
      if (codeEnEdition) {
        return prev.map((c) => (c.code === codeEnEdition.code ? code : c));
      }
      return [...prev, code];
    });
    fermerPanneau();
  }

  function supprimer(code: HoraireCode) {
    if (confirm(`Supprimer le code horaire « ${code.code} » ?`)) {
      setCodes((prev) => prev.filter((c) => c.code !== code.code));
    }
  }

  return (
    <div className="relative flex h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-800">Codes horaires</h1>
            <p className="text-xs text-zinc-500">
              Données non persistées (maquette) — {codes.length} code{codes.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={ouvrirCreation}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nouveau code
          </button>
        </div>

        <div className="overflow-hidden rounded border border-zinc-200">
          <HoraireCodesTable codes={codes} onModifier={ouvrirEdition} onSupprimer={supprimer} />
        </div>
      </div>

      {panneau !== "ferme" && (
        <>
          <div className="fixed inset-0 z-20 bg-black/20" onClick={fermerPanneau} />
          <div className="fixed right-0 top-0 z-30 h-full w-full max-w-md border-l border-zinc-200 bg-white shadow-xl">
            <HoraireCodeForm
              valeurInitiale={codeEnEdition}
              codesExistants={codes.map((c) => c.code)}
              onValider={enregistrer}
              onAnnuler={fermerPanneau}
            />
          </div>
        </>
      )}
    </div>
  );
}
