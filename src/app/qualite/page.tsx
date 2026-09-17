import {
  ACTIONS_DEMO,
  RISQUES_DEMO,
  CRITERES_HAS,
  criticite,
} from "@/lib/qualite-mock-data";
import ActionPlanTable from "@/components/qualite/ActionPlanTable";

function KpiTile({ valeur, label, accent }: { valeur: number; label: string; accent: string }) {
  return (
    <div className="rounded border border-zinc-200 bg-white p-4">
      <div className={`text-3xl font-bold ${accent}`}>{valeur}</div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </div>
  );
}

export default function QualiteTableauDeBord() {
  const risquesCritiques = RISQUES_DEMO.filter((r) => criticite(r) >= 12).length;
  const criteresImperatifsNonConformes = CRITERES_HAS.filter(
    (c) => c.imperatif && c.cotation !== "conforme"
  ).length;
  const actionsAFaire = ACTIONS_DEMO.filter((a) => a.statut !== "fait").length;
  const actionsEnRetard = ACTIONS_DEMO.filter(
    (a) => a.statut !== "fait" && new Date(a.echeance) < new Date("2026-09-17")
  ).length;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-zinc-900">Tableau de bord qualité</h1>
      <p className="mt-1 max-w-2xl text-sm text-zinc-500">
        Vue unifiée du plan d&apos;action qualité de l&apos;établissement, alimenté par le
        document unique d&apos;évaluation des risques professionnels (DUERP) et le référentiel
        d&apos;évaluation HAS.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile valeur={risquesCritiques} label="Risques DUERP critiques" accent="text-red-600" />
        <KpiTile
          valeur={criteresImperatifsNonConformes}
          label="Critères impératifs à traiter"
          accent="text-red-600"
        />
        <KpiTile valeur={actionsAFaire} label="Actions non terminées" accent="text-blue-700" />
        <KpiTile valeur={actionsEnRetard} label="Actions en retard" accent="text-orange-600" />
      </div>

      <h2 className="mt-8 mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Plan d&apos;action
      </h2>
      <ActionPlanTable />
    </div>
  );
}
