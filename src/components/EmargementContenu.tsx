"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Salarie } from "@/lib/mock-data";
import EmargementMensuel from "./EmargementMensuel";
import EmargementAnnuel from "./EmargementAnnuel";

type Vue = "mensuel" | "annuel";

export default function EmargementContenu({
  salarie,
  joursFeries,
  validations,
}: {
  salarie: Salarie;
  joursFeries: string[];
  validations: string[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const vue: Vue = searchParams.get("vue") === "annuel" ? "annuel" : "mensuel";

  function changerVue(nouvelleVue: Vue) {
    if (nouvelleVue === vue) return;
    const params = new URLSearchParams({ salarie: salarie.id });
    if (nouvelleVue === "annuel") params.set("vue", "annuel");
    router.push(`/emargement?${params.toString()}`);
  }

  return (
    <div className="flex h-screen flex-col bg-white text-sm text-zinc-900">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-2 print:hidden">
        <div>
          <h1 className="font-semibold text-zinc-800">
            Émargement — {salarie.nom} {salarie.prenom}
          </h1>
          <p className="text-[10px] text-zinc-400">
            {vue === "mensuel" ? "Validation mensuelle du planning" : "Vue annuelle des évènements particuliers"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded border border-zinc-300 text-xs">
            <button
              onClick={() => changerVue("mensuel")}
              className={`px-2 py-1 font-medium ${
                vue === "mensuel" ? "bg-blue-600 text-white" : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => changerVue("annuel")}
              className={`border-l border-zinc-300 px-2 py-1 font-medium ${
                vue === "annuel" ? "bg-blue-600 text-white" : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              Annuel
            </button>
          </div>
          <button
            onClick={() => window.print()}
            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
          >
            🖶 Imprimer
          </button>
          <Link href="/" className="text-xs font-medium text-blue-600 hover:underline">
            ← Retour au planning
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="mb-1 hidden print:block">
          <h1 className="text-base font-semibold text-zinc-800">
            Émargement — {salarie.nom} {salarie.prenom}
          </h1>
        </div>

        {vue === "mensuel" ? (
          <EmargementMensuel salarie={salarie} joursFeries={joursFeries} validations={validations} />
        ) : (
          <EmargementAnnuel salarie={salarie} />
        )}
      </div>
    </div>
  );
}
