"use client";

import { Fragment, useMemo, useState } from "react";
import {
  ETABLISSEMENTS_DEMO,
  LOGS_DEMO,
  NIVEAUX_LOG,
  formatHorodatageUTC,
  nomEtablissement,
  type LogEntry,
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

const STYLE_STATUT: Record<string, string> = {
  Succès: "bg-green-100 text-green-700",
  Échec: "bg-red-100 text-red-700",
};

function LigneDetail({ log }: { log: LogEntry }) {
  return (
    <tr>
      <td colSpan={6} className="bg-zinc-50 px-3 py-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
          <div>
            <p className="text-zinc-400">Niveau de privilège</p>
            <p className="font-medium text-zinc-700">{log.niveauPrivilege}</p>
          </div>
          <div>
            <p className="text-zinc-400">Statut</p>
            <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${STYLE_STATUT[log.statut]}`}>
              {log.statut}
            </span>
          </div>
          <div>
            <p className="text-zinc-400">Identifiant d&apos;événement</p>
            <p className="font-medium text-zinc-700">{log.eventId}</p>
          </div>
          <div>
            <p className="text-zinc-400">Cible</p>
            <p className="font-medium text-zinc-700">{log.cible}</p>
          </div>
          <div>
            <p className="text-zinc-400">Hostname</p>
            <p className="font-medium text-zinc-700">{log.hostname}</p>
          </div>
          <div>
            <p className="text-zinc-400">IP source → destination</p>
            <p className="font-medium text-zinc-700">
              {log.ipSource} → {log.ipDestination}
            </p>
          </div>
          <div>
            <p className="text-zinc-400">Port source → destination</p>
            <p className="font-medium text-zinc-700">
              {log.portSource} → {log.portDestination}
            </p>
          </div>
          <div>
            <p className="text-zinc-400">Identifiant utilisateur</p>
            <p className="font-medium text-zinc-700">{log.utilisateurId}</p>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function LogsAdminSystemePage() {
  const [niveaux, setNiveaux] = useState<Set<NiveauLog>>(new Set());
  const [etablissementId, setEtablissementId] = useState<string>("");
  const [recherche, setRecherche] = useState("");
  const [ligneDepliee, setLigneDepliee] = useState<string | null>(null);

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
      .sort((a, b) => b.horodatageUTC.localeCompare(a.horodatageUTC))
      .filter((log) => {
        if (niveaux.size > 0 && !niveaux.has(log.niveau)) return false;
        if (etablissementId && log.etablissementId !== etablissementId) return false;
        if (rechercheNormalisee) {
          const hayStack = [log.message, log.source, log.utilisateurNom, log.cible, log.eventId]
            .join(" ")
            .toLowerCase();
          if (!hayStack.includes(rechercheNormalisee)) return false;
        }
        return true;
      });
  }, [niveaux, etablissementId, recherche]);

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3">
        <h1 className="text-lg font-semibold text-zinc-800">Logs</h1>
        <p className="text-xs text-zinc-500">
          Données non persistées (maquette) — {logsFiltres.length} entrée{logsFiltres.length > 1 ? "s" : ""} —
          horodatage stocké en UTC (ISO 8601)
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
          placeholder="Rechercher (utilisateur, source, cible, message, event ID)"
          className="ml-auto w-80 rounded border border-zinc-300 px-2 py-1 text-xs"
        />
      </div>

      <div className="flex-1 overflow-auto rounded border border-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-zinc-50 text-xs text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Horodatage (UTC)</th>
              <th className="px-3 py-2 font-medium">Niveau</th>
              <th className="px-3 py-2 font-medium">Établissement</th>
              <th className="px-3 py-2 font-medium">Utilisateur</th>
              <th className="px-3 py-2 font-medium">Type d&apos;événement</th>
              <th className="px-3 py-2 font-medium">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {logsFiltres.map((log) => {
              const deplie = ligneDepliee === log.id;
              return (
                <Fragment key={log.id}>
                  <tr
                    onClick={() => setLigneDepliee(deplie ? null : log.id)}
                    className="cursor-pointer hover:bg-zinc-50"
                  >
                    <td className="px-3 py-1.5 whitespace-nowrap text-xs text-zinc-500">
                      {formatHorodatageUTC(log.horodatageUTC)}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${STYLE_NIVEAU[log.niveau]}`}>
                        {LIBELLE_NIVEAU[log.niveau]}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-xs text-zinc-600">
                      {nomEtablissement(ETABLISSEMENTS_DEMO, log.etablissementId)}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-zinc-600">{log.utilisateurNom}</td>
                    <td className="px-3 py-1.5 text-xs text-zinc-600">{log.typeEvenement}</td>
                    <td className="px-3 py-1.5 text-xs text-zinc-700">
                      {log.message}
                      <span className="ml-1.5 text-zinc-300">{deplie ? "▲" : "▼"}</span>
                    </td>
                  </tr>
                  {deplie && <LigneDetail log={log} />}
                </Fragment>
              );
            })}
            {logsFiltres.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-xs text-zinc-400">
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
