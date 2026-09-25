"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="flex h-full items-center justify-center bg-amber-50">
      <form
        action={action}
        className="w-full max-w-sm rounded border border-amber-200 bg-white p-6 shadow-sm"
      >
        <h1 className="mb-1 text-lg font-semibold text-amber-900">Connexion</h1>
        <p className="mb-4 text-sm text-amber-800">Planning EHPAD</p>

        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="identifiant">
          Identifiant
        </label>
        <input
          id="identifiant"
          name="identifiant"
          autoComplete="username"
          required
          className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="mot_de_passe">
          Mot de passe
        </label>
        <input
          id="mot_de_passe"
          name="mot_de_passe"
          type="password"
          autoComplete="current-password"
          required
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />

        {state?.error && (
          <p role="alert" className="mb-3 text-sm text-red-600">
            {state.error}
          </p>
        )}

        <button
          disabled={pending}
          type="submit"
          className="w-full rounded bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
