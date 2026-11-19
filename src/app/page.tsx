import AppTabs from "@/components/AppTabs";

// Maquette multi-application (EPIC #46, story #47, urgent) — branche
// exploratoire, jamais fusionnée (même logique que l'EPIC "Maquette
// graphique v0" à l'origine du vrai Planning) : données fictives, aucune
// authentification ni dépendance à Supabase, pour pouvoir être ouverte sans
// configuration d'environnement. Ne remplace pas le vrai `page.tsx` de
// `main`/`staging`, qui reste connecté au backend réel.

const SALARIES_APERCU = [
  { nom: "BERNARD Claire", service: "IDE" },
  { nom: "LAURENT Inès", service: "ASH" },
  { nom: "MARTIN Paul", service: "ASH" },
  { nom: "DUBOIS Julie", service: "IDE" },
  { nom: "PETIT Marc", service: "Administratif" },
];

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type CelluleApercu = { code: string; fond: string; texte: string };

const CODES: Record<string, CelluleApercu> = {
  repos: { code: ".", fond: "#f4f4f5", texte: "#71717a" },
  ash: { code: "70A", fond: "#dbeafe", texte: "#1e3a8a" },
  ide: { code: "SEC", fond: "#dcfce7", texte: "#14532d" },
  abs: { code: "ABS", fond: "#e4e4e7", texte: "#3f3f46" },
};

// Motif fictif, juste pour illustrer visuellement la grille — pas de vraie
// logique de roulement ici.
const MOTIF: CelluleApercu[][] = [
  [CODES.ide, CODES.ide, CODES.ide, CODES.repos, CODES.repos, CODES.ide, CODES.ide],
  [CODES.ash, CODES.ash, CODES.repos, CODES.ash, CODES.ash, CODES.repos, CODES.repos],
  [CODES.repos, CODES.ash, CODES.ash, CODES.ash, CODES.repos, CODES.ash, CODES.ash],
  [CODES.ide, CODES.repos, CODES.ide, CODES.ide, CODES.ide, CODES.repos, CODES.repos],
  [CODES.abs, CODES.abs, CODES.abs, CODES.repos, CODES.repos, CODES.repos, CODES.repos],
];

export default function PlanningApercu() {
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
              <p className="text-[10px] text-zinc-400">Planning</p>
            </div>
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-semibold text-white">
            JD
          </div>
        </div>
        <AppTabs actif="planning" />
      </header>

      <div className="flex-1 overflow-auto p-4">
        <p className="mb-3 text-xs text-zinc-400">
          Aperçu — application Planning existante (données fictives, non interactif dans cette maquette).
        </p>
        <table className="w-full max-w-2xl border-collapse overflow-hidden rounded border border-zinc-200 text-xs">
          <thead>
            <tr className="bg-zinc-50 text-zinc-500">
              <th className="border-b border-zinc-200 px-2 py-1.5 text-left font-medium">Salarié</th>
              {JOURS.map((j) => (
                <th key={j} className="border-b border-zinc-200 px-2 py-1.5 text-center font-medium">
                  {j}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SALARIES_APERCU.map((salarie, i) => (
              <tr key={salarie.nom} className="border-b border-zinc-100 last:border-b-0">
                <td className="px-2 py-1.5">
                  <div className="font-medium text-zinc-800">{salarie.nom}</div>
                  <div className="text-[10px] text-zinc-400">{salarie.service}</div>
                </td>
                {MOTIF[i].map((cellule, j) => (
                  <td key={j} className="p-1 text-center">
                    <span
                      className="inline-block w-full rounded px-1 py-1 font-semibold"
                      style={{ backgroundColor: cellule.fond, color: cellule.texte }}
                    >
                      {cellule.code}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
