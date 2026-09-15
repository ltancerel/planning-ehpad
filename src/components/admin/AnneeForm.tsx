"use client";

import { useState } from "react";
import type { AnneePlanifiee, JourFerie } from "@/lib/mock-data";
import { genererJoursFeriesDefaut } from "@/lib/mock-data";
import { estAnneeBissextile } from "@/lib/jours-feries";

function formatJourMoisAnnee(dateISO: string): string {
  const [a, m, j] = dateISO.split("-");
  return `${j}/${m}/${a}`;
}

type AnneeFormProps = {
  valeurInitiale?: AnneePlanifiee;
  anneesExistantes: number[];
  onValider: (annee: Omit<AnneePlanifiee, "id">) => void;
  onAnnuler: () => void;
};

export default function AnneeForm({
  valeurInitiale,
  anneesExistantes,
  onValider,
  onAnnuler,
}: AnneeFormProps) {
  const modeEdition = Boolean(valeurInitiale);
  const [annee, setAnnee] = useState(valeurInitiale?.annee ?? 2027);
  const [jourDemarrage, setJourDemarrage] = useState(
    valeurInitiale?.jourDemarrage ?? `${valeurInitiale?.annee ?? 2027}-01-01`
  );
  const [joursFeries, setJoursFeries] = useState<JourFerie[]>(
    valeurInitiale?.joursFeries ?? genererJoursFeriesDefaut(2027)
  );
  const [erreur, setErreur] = useState<string | null>(null);

  function regenererPourAnnee(nouvelleAnnee: number) {
    setAnnee(nouvelleAnnee);
    setJourDemarrage(`${nouvelleAnnee}-01-01`);
    setJoursFeries(genererJoursFeriesDefaut(nouvelleAnnee));
  }

  function basculerActif(index: number) {
    setJoursFeries((prev) => prev.map((j, i) => (i === index ? { ...j, actif: !j.actif } : j)));
  }

  function retirerJourFerie(index: number) {
    setJoursFeries((prev) => prev.filter((_, i) => i !== index));
  }

  function ajouterJourFeriePersonnalise() {
    setJoursFeries((prev) => [
      ...prev,
      { date: `${annee}-01-01`, label: "", type: "personnalise", actif: true },
    ]);
  }

  function modifierJourFeriePersonnalise(index: number, champ: "date" | "label", valeur: string) {
    setJoursFeries((prev) => prev.map((j, i) => (i === index ? { ...j, [champ]: valeur } : j)));
  }

  function valider() {
    const autresAnnees = anneesExistantes.filter((a) => a !== valeurInitiale?.annee);
    if (autresAnnees.includes(annee)) {
      setErreur("Cette année est déjà planifiée.");
      return;
    }
    if (joursFeries.some((j) => j.type === "personnalise" && !j.label.trim())) {
      setErreur("Chaque jour férié personnalisé doit avoir un libellé.");
      return;
    }
    setErreur(null);
    onValider({ annee, jourDemarrage, joursFeries });
  }

  const bissextile = estAnneeBissextile(annee);
  const joursFixes = joursFeries.filter((j) => j.type === "fixe");
  const joursCalcules = joursFeries.filter((j) => j.type === "calcule");
  const joursPersonnalises = joursFeries.filter((j) => j.type === "personnalise");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-800">
          {modeEdition ? "Modifier l'année" : "Nouvelle année"}
        </h2>
        <button onClick={onAnnuler} className="text-zinc-400 hover:text-zinc-600" aria-label="Fermer">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-auto px-4 py-4">
        <div className="flex items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">Année</label>
            <input
              type="number"
              value={annee}
              onChange={(e) => regenererPourAnnee(Number(e.target.value) || annee)}
              className="w-28 rounded border border-zinc-300 px-2 py-1.5 text-sm"
              disabled={modeEdition}
            />
          </div>
          <span
            className={`mb-1.5 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
              bissextile ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {bissextile ? "Bissextile — 366 jours" : "365 jours"}
          </span>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Jour de démarrage</label>
          <input
            type="date"
            value={jourDemarrage}
            onChange={(e) => setJourDemarrage(e.target.value)}
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm"
          />
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-zinc-700">
            Jours fériés fixes <span className="font-normal text-zinc-400">(systématiques)</span>
          </p>
          <ul className="space-y-0.5">
            {joursFixes.map((j) => (
              <li key={j.date} className="flex justify-between rounded bg-zinc-50 px-2 py-1 text-xs">
                <span className="text-zinc-600">{j.label}</span>
                <span className="font-medium text-zinc-500">{formatJourMoisAnnee(j.date)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-zinc-700">
            Jours fériés configurables <span className="font-normal text-zinc-400">(calculés depuis Pâques)</span>
          </p>
          <ul className="space-y-0.5">
            {joursCalcules.map((j) => {
              const index = joursFeries.indexOf(j);
              return (
                <li
                  key={j.date}
                  className="flex items-center justify-between rounded border border-zinc-200 px-2 py-1 text-xs"
                >
                  <label className="flex items-center gap-1.5 text-zinc-600">
                    <input type="checkbox" checked={j.actif} onChange={() => basculerActif(index)} />
                    {j.label}
                  </label>
                  <span className="font-medium text-zinc-500">{formatJourMoisAnnee(j.date)}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-700">Jours fériés personnalisés</p>
            <button
              type="button"
              onClick={ajouterJourFeriePersonnalise}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              + Ajouter
            </button>
          </div>
          <div className="space-y-1.5">
            {joursPersonnalises.map((j) => {
              const index = joursFeries.indexOf(j);
              return (
                <div key={index} className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={j.date}
                    onChange={(e) => modifierJourFeriePersonnalise(index, "date", e.target.value)}
                    className="rounded border border-zinc-300 px-1.5 py-1 text-xs"
                  />
                  <input
                    value={j.label}
                    onChange={(e) => modifierJourFeriePersonnalise(index, "label", e.target.value)}
                    placeholder="Libellé"
                    className="flex-1 rounded border border-zinc-300 px-1.5 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => retirerJourFerie(index)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            {joursPersonnalises.length === 0 && (
              <p className="text-[11px] text-zinc-400">Aucun jour férié personnalisé.</p>
            )}
          </div>
        </div>

        {erreur && <p className="text-xs font-medium text-red-600">{erreur}</p>}
      </div>

      <div className="flex justify-end gap-2 border-t border-zinc-200 px-4 py-3">
        <button
          onClick={onAnnuler}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Annuler
        </button>
        <button
          onClick={valider}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {modeEdition ? "Enregistrer" : "Créer"}
        </button>
      </div>
    </div>
  );
}
