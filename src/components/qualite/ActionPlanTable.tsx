import {
  ACTIONS_DEMO,
  RISQUES_DEMO,
  CRITERES_HAS,
  type ActionQualite,
} from "@/lib/qualite-mock-data";
import { StatutBadge } from "./Badges";

function origineLabel(action: ActionQualite): { texte: string; badge: string; badgeClass: string } {
  if (action.origine === "duerp") {
    const risque = RISQUES_DEMO.find((r) => r.id === action.origineId);
    return {
      texte: risque?.intitule ?? "Risque DUERP",
      badge: "DUERP",
      badgeClass: "bg-amber-100 text-amber-800",
    };
  }
  const critere = CRITERES_HAS.find((c) => c.id === action.origineId);
  return {
    texte: critere ? `${critere.numero} — ${critere.libelle}` : "Critère HAS",
    badge: "HAS",
    badgeClass: "bg-teal-100 text-teal-800",
  };
}

function estEnRetard(action: ActionQualite): boolean {
  if (action.statut === "fait") return false;
  return new Date(action.echeance) < new Date("2026-09-17");
}

export default function ActionPlanTable({ actions = ACTIONS_DEMO }: { actions?: ActionQualite[] }) {
  const triees = [...actions].sort((a, b) => a.echeance.localeCompare(b.echeance));

  return (
    <div className="overflow-x-auto rounded border border-zinc-200">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2">Origine</th>
            <th className="px-3 py-2">Action</th>
            <th className="px-3 py-2">Responsable</th>
            <th className="px-3 py-2">Échéance</th>
            <th className="px-3 py-2">Statut</th>
          </tr>
        </thead>
        <tbody>
          {triees.map((action) => {
            const origine = origineLabel(action);
            const retard = estEnRetard(action);
            return (
              <tr key={action.id} className="border-t border-zinc-100 align-top">
                <td className="px-3 py-2">
                  <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${origine.badgeClass}`}>
                    {origine.badge}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium text-zinc-800">{action.intitule}</div>
                  <div className="text-xs text-zinc-500">{origine.texte}</div>
                </td>
                <td className="px-3 py-2 text-zinc-700">{action.responsable}</td>
                <td className={`px-3 py-2 ${retard ? "font-semibold text-red-600" : "text-zinc-700"}`}>
                  {new Date(action.echeance).toLocaleDateString("fr-FR")}
                  {retard && <span className="ml-1 text-[10px] uppercase">en retard</span>}
                </td>
                <td className="px-3 py-2">
                  <StatutBadge statut={action.statut} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
