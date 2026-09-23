"use client";

import Link from "next/link";
import {
  ETABLISSEMENTS_DEMO,
  LOGS_DEMO,
  calculerKpis,
  formatHorodatageUTC,
  logsRecents,
  nomEtablissement,
} from "@/lib/admin-systeme-mock-data";

function StatTile({ label, valeur, sousTexte }: { label: string; valeur: string; sousTexte?: string }) {
  return (
    <div className="rounded border border-zinc-200 p-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-800">{valeur}</p>
      {sousTexte && <p className="mt-0.5 text-[11px] text-zinc-400">{sousTexte}</p>}
    </div>
  );
}

const STYLE_NIVEAU: Record<string, string> = {
  info: "bg-zinc-100 text-zinc-600",
  avertissement: "bg-amber-100 text-amber-700",
  erreur: "bg-red-100 text-red-700",
};

const LIBELLE_NIVEAU: Record<string, string> = {
  info: "Info",
  avertissement: "Avertissement",
  erreur: "Erreur",
};

export default function AdminSystemeDashboardPage() {
  const kpis = calculerKpis(ETABLISSEMENTS_DEMO, LOGS_DEMO);
  const derniersLogs = logsRecents(LOGS_DEMO, 8);

  return (
    <div className="h-full overflow-auto p-4">
      <h1 className="mb-1 text-lg font-semibold text-zinc-800">Tableau de bord</h1>
      <p className="mb-4 text-xs text-zinc-500">
        Données non persistées (maquette) — vue agrégée de tous les établissements.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          label="Établissements"
          valeur={String(kpis.nbEtablissements)}
          sousTexte={`${kpis.nbEtablissementsActifs} actif${kpis.nbEtablissementsActifs > 1 ? "s" : ""}`}
        />
        <StatTile label="Utilisateurs" valeur={String(kpis.nbUtilisateurs)} sousTexte="tous établissements" />
        <StatTile label="Salariés" valeur={String(kpis.nbSalaries)} sousTexte="tous établissements" />
        <StatTile label="Volume de données" valeur={`${kpis.volumeDonneesMo.toLocaleString("fr-FR")} Mo`} />
        <StatTile label="Trafic (7 jours)" valeur={String(kpis.traficConnexions7j)} sousTexte="connexions" />
        <StatTile
          label="Erreurs (24h)"
          valeur={String(kpis.nbErreurs24h)}
          sousTexte={kpis.nbErreurs24h > 0 ? "à examiner" : "aucune"}
        />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-800">Derniers logs</h2>
          <Link
            href="/admin-systeme/logs"
            className="text-xs font-medium text-[#0F3A35] hover:text-[#2F5B43]"
          >
            Voir tous les logs →
          </Link>
        </div>
        <div className="overflow-hidden rounded border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Horodatage (UTC)</th>
                <th className="px-3 py-2 font-medium">Niveau</th>
                <th className="px-3 py-2 font-medium">Établissement</th>
                <th className="px-3 py-2 font-medium">Utilisateur</th>
                <th className="px-3 py-2 font-medium">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {derniersLogs.map((log) => (
                <tr key={log.id}>
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
                  <td className="px-3 py-1.5 text-xs text-zinc-700">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
