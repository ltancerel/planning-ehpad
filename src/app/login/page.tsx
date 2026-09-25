"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login } from "./actions";
import logoAiotConseil from "../../../public/logo-aiot-conseil.png";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="flex h-full items-center justify-center bg-[#eef7ea]">
      <form
        action={action}
        className="w-full max-w-sm rounded border border-[#c7e3ba] bg-white p-6 shadow-sm"
      >
        <Image src={logoAiotConseil} alt="AioT-Conseil" className="mb-4 h-10 w-auto" priority />

        <h1 className="mb-1 text-lg font-semibold text-[#183c28]">Connexion</h1>
        <p className="mb-4 text-sm text-[#3c6c48]">Planning EHPAD</p>

        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
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
          className="w-full rounded bg-[#24543c] px-3 py-2 text-sm font-medium text-white hover:bg-[#1a3f2c] disabled:opacity-60"
        >
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
