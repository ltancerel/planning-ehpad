"use client";

import { useState, useTransition } from "react";
import type { HoraireCode } from "@/lib/horaire-codes";
import HoraireCodesTable from "@/components/admin/HoraireCodesTable";
import HoraireCodeForm from "@/components/admin/HoraireCodeForm";
import { enregistrerCodeHoraire, supprimerCodeHoraire } from "./actions";

export type HoraireCodeReel = HoraireCode & { id: string };

export default function HorairesAdminClient({ codes }: { codes: HoraireCodeReel[] }) {
  const [panneau, setPanneau] = useState<"ferme" | "creation" | "edition">("ferme");
  const [codeEnEdition, setCodeEnEdition] = useState<HoraireCodeReel | undefined>(undefined);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, demarrer] = useTransition();

  function ouvrirCreation() {
    setCodeEnEdition(undefined);
    setErreur(null);
    setPanneau("creation");
  }

  function ouvrirEdition(code: HoraireCode) {
    setCodeEnEdition(code as HoraireCodeReel);
    setErreur(null);
    setPanneau("edition");
  }

  function fermerPanneau() {
    setPanneau("ferme");
    setCodeEnEdition(undefined);
    setErreur(null);
  }

  function enregistrer(code: HoraireCode) {
    demarrer(async () => {
      const resultat = await enregistrerCodeHoraire(codeEnEdition?.id, code);
      if (resultat.error) {
        setErreur(resultat.error);
        return;
      }
      fermerPanneau();
    });
  }

  function supprimer(code: HoraireCode) {
    const reel = code as HoraireCodeReel;
    if (!confirm(`Supprimer le code horaire « ${code.code} » ?`)) return;
    demarrer(async () => {
      const resultat = await supprimerCodeHoraire(reel.id);
      if (resultat?.error) alert(resultat.error);
    });
  }

  return (
    <div className="relative flex h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-800">Codes horaires</h1>
            <p className="text-xs text-zinc-500">
              {codes.length} code{codes.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={ouvrirCreation}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nouveau code
          </button>
        </div>

        {erreur && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {erreur}
          </div>
        )}

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
            {pending && (
              <p className="absolute bottom-16 left-4 text-xs text-zinc-400">Enregistrement…</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
