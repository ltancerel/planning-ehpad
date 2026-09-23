"use client";

import { useMemo, useState } from "react";
import {
  ETABLISSEMENTS_DEMO,
  LOGS_DEMO,
  NIVEAUX_LOG,
  nomEtablissement,
  type NiveauLog,
} from "@/lib/admin-systeme-mock-data";

const STYLE_NIVEAU: Record<NiveauLog, string> = {
  info: "bg-zinc-100 text-zinc-600",
  avertissement: "bg-amber-100 text-amber-700",
  erreur: "bg-red-100 text-red-700",
};

const LIBELLE_NIVEAU: Record<NiveauLog, string> = {
  info: "Info",
  avertissement: "Avertissement",
  erreur: "Erreur",
};

export default function LogsAdminSystemePage() {
  const [niveaux, setNiveaux] = useState<Set<NiveauLog>>(new Set());
  const [etablissementId, setEtablissementId] = useState<string>("");
  const [recherche, setRecherche] = useState("");

  function basculerNiveau(niveau: NiveauLog) {
    setNiveaux((prev) => {
      const copie = new Set(prev);
      if (copie.has(niveau)) copie.delete(niveau);
      else copie.add(niveau);
      return copie;
    });
  }

  const logsFiltres = useMemo(() => {
    const rechercheNormalisee = recherche.trim().toLowerCase();
    return [...LOGS_DEMO]
      .sort((a, b) => b.dateHeureISO.localeCompare(a.dateHeureISO))
      .filter((log) => {
        if (niveaux.size > 0 && !niveaux.has(log.niveau)) return false;
        if (etablissementId && log.etablissementId !== etablissementId) return false;
        if (
          rechercheNormalisee &&
          !log.message.toLowerCase().includes(rechercheNormalisee) &&
          !log.source.toLowerCase().includes(rechercheNormalisee)
        ) {
          return false;
        }
        return true;
      });
  }, [niveaux, etablissementId, recherche]);

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3">
        <h1 className="text-lg font-semibold text-zinc-800">Logs</h1>
        <p className="text-xs text-zinc-500">
          Données non persistées (maquette) — {logsFiltres.length} entrée{logsFiltres.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 rounded border border-zinc-200 bg-zinc-50 px-3 py-2">
        <div className="flex items-center gap-2">
          {NIVEAUX_LOG.map((niveau) => (
            <label key={niveau} className="flex cursor-pointer items-center gap-1 text-xs text-zinc-700">
              <input type="checkbox" checked={niveaux.has(niveau)} onChange={() => basculerNiveau(niveau)} />
              {LIBELLE_NIVEAU[niveau]}
            </label>
          ))}
        </div>
        <select
          value={etablissementId}
          onChange={(e) => setEtablissementId(e.target.value)}
          className="rounded border border-zinc-300 px-2 py-1 text-xs"
        >
          <option value="">Tous les établissements</option>
          {ETABLISSEMENTS_DEMO.map((etablissement) => (
            <option key={etablissement.id} value={etablissement.id}>
              {etablissement.nom}
            </option>
          ))}
        </select>
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher (source, message)"
          className="ml-auto rounded border border-zinc-300 px-2 py-1 text-xs"
        />
      </div>

      <div className="flex-1 overflow-auto rounded border border-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-zinc-50 text-xs text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Date/heure</th>
              <th className="px-3 py-2 font-medium">Niveau</th>
              <th className="px-3 py-2 font-medium">Établissement</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {logsFiltres.map((log) => (
              <tr key={log.id}>
                <td className="px-3 py-1.5 whitespace-nowrap text-xs text-zinc-500">
                  {new Date(log.dateHeureISO).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-1.5">
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${STYLE_NIVEAU[log.niveau]}`}>
                    {LIBELLE_NIVEAU[log.niveau]}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-xs text-zinc-600">
                  {nomEtablissement(ETABLISSEMENTS_DEMO, log.etablissementId)}
                </td>
                <td className="px-3 py-1.5 text-xs text-zinc-600">{log.source}</td>
                <td className="px-3 py-1.5 text-xs text-zinc-700">{log.message}</td>
              </tr>
            ))}
            {logsFiltres.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-xs text-zinc-400">
                  Aucun log ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
