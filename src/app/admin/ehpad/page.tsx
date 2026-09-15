"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useEhpad, EHPAD_PAR_DEFAUT } from "@/context/EhpadProvider";

export default function IdentiteEhpadPage() {
  const { identite, definirIdentite } = useEhpad();
  const [nom, setNom] = useState(identite.nom);
  const [logo, setLogo] = useState<string | null>(identite.logo);
  const [enregistre, setEnregistre] = useState(false);
  const inputFichierRef = useRef<HTMLInputElement>(null);

  function surChangementFichier(e: ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    const lecteur = new FileReader();
    lecteur.onload = () => {
      setLogo(lecteur.result as string);
      setEnregistre(false);
    };
    lecteur.readAsDataURL(fichier);
  }

  function enregistrer() {
    definirIdentite({ nom: nom.trim() || EHPAD_PAR_DEFAUT.nom, logo });
    setEnregistre(true);
  }

  function reinitialiser() {
    setNom(EHPAD_PAR_DEFAUT.nom);
    setLogo(EHPAD_PAR_DEFAUT.logo);
    setEnregistre(false);
    if (inputFichierRef.current) inputFichierRef.current.value = "";
  }

  return (
    <div className="h-full overflow-auto p-4">
      <h1 className="mb-1 text-lg font-semibold text-zinc-800">Identité de l&apos;EHPAD</h1>
      <p className="mb-4 text-xs text-zinc-500">
        Titre et logo affichés en haut à gauche de l&apos;application. Première brique de la
        segmentation multi-EHPAD.
      </p>

      <div className="max-w-md space-y-4 rounded border border-zinc-200 p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Nom de l&apos;EHPAD</label>
          <input
            value={nom}
            onChange={(e) => {
              setNom(e.target.value);
              setEnregistre(false);
            }}
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
              <p className="mt-1 max-w-xs text-[11px] text-zinc-400">
                PNG, JPG ou SVG. Remplace le logo actuel après enregistrement — utile pour
                changer d&apos;EHPAD une fois le multi-tenant en place.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-zinc-100 pt-3">
          <button
            onClick={enregistrer}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Enregistrer
          </button>
          <button
            onClick={reinitialiser}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            Réinitialiser
          </button>
          {enregistre && <span className="text-xs font-medium text-green-600">Enregistré ✓</span>}
        </div>
      </div>
    </div>
  );
}
