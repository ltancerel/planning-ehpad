import AppTabs from "@/components/AppTabs";
import TableauBordActions from "@/components/qualite/TableauBordActions";

// EPIC Multi-application (#46), story #47 (maquette) — reprend le tableau
// de bord maquetté sur experiment/qualite-maquette (voir
// TableauBordActions pour le détail des modifications demandées).
export default function ActionsPaqg() {
  return (
    <div className="flex h-screen flex-col bg-white text-sm text-zinc-900">
      <header className="flex shrink-0 flex-col border-b border-zinc-200">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-zinc-200 text-xs font-semibold text-zinc-500">
              E
            </span>
            <div className="leading-tight">
              <h1 className="font-semibold text-zinc-800">EHPAD Démo</h1>
              <p className="text-[10px] text-zinc-400">Actions PAQG</p>
            </div>
            <div className="ml-4 border-l border-zinc-200 pl-4">
              <AppTabs actif="actions-paqg" />
            </div>
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-semibold text-white">
            JD
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <TableauBordActions />
      </div>
    </div>
  );
}
