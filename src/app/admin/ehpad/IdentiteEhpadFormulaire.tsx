"use client";

import { useActionState, useRef, useState, type ChangeEvent } from "react";
import { mettreAJourIdentiteEhpad } from "./actions";

export default function IdentiteEhpadFormulaire({
  nomInitial,
  logoInitial,
}: {
  nomInitial: string;
  logoInitial: string | null;
}) {
  const [state, action, pending] = useActionState(mettreAJourIdentiteEhpad, undefined);
  const [nom, setNom] = useState(nomInitial);
  const [logo, setLogo] = useState<string | null>(logoInitial);
  const inputFichierRef = useRef<HTMLInputElement>(null);

  function surChangementFichier(e: ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    const lecteur = new FileReader();
    lecteur.onload = () => setLogo(lecteur.result as string);
    lecteur.readAsDataURL(fichier);
  }

  return (
    <form action={action} className="max-w-md space-y-4 rounded border border-zinc-200 p-4">
      <input type="hidden" name="logo_base64" value={logo ?? ""} />

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-700">Nom de l&apos;établissement</label>
        <input
          name="nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          placeholder="Ex : Les Jardins de Rambam"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-700">Logo</label>
        <div className="flex items-center gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu d'une image uploadée (data URL)
            <img src={logo} alt="Logo" className="h-16 w-16 rounded border border-zinc-200 object-contain p-1" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-zinc-300 text-[10px] text-zinc-400">
              Aucun logo
            </div>
          )}
          <div>
            <input
              ref={inputFichierRef}
              type="file"
              accept="image/*"
              onChange={surChangementFichier}
              className="block text-xs text-zinc-600"
            />
            <p className="mt-1 max-w-xs text-[11px] text-zinc-400">PNG, JPG ou SVG.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-zinc-100 pt-3">
        <button
          disabled={pending}
          type="submit"
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {state?.ok && <span className="text-xs font-medium text-green-600">Enregistré ✓</span>}
        {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
