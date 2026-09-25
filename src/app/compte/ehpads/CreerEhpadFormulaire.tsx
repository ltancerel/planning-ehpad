"use client";

import { useActionState } from "react";
import { creerEhpad } from "./actions";

export default function CreerEhpadFormulaire() {
  const [state, action, pending] = useActionState(creerEhpad, undefined);

  return (
    <form action={action} className="flex items-end gap-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="nom">
          Nouvel EHPAD
        </label>
        <input
          id="nom"
          name="nom"
          required
          placeholder="Ex : Les Jardins de Rambam"
          className="rounded border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        disabled={pending}
        type="submit"
        className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {pending ? "Création…" : "Créer"}
      </button>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
