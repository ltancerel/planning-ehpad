import AppTabs from "@/components/AppTabs";
import UserMenu from "@/components/UserMenu";
import TableauBordPilotage from "@/components/pilotage/TableauBordPilotage";

// EPIC Multi-application (#46), story #47 (maquette) — cahier des charges
// fourni par le client le 20/11 (cf. artefact "Pilotage PAQG — Cahier des
// charges"). Voir TableauBordPilotage pour le périmètre retenu pour cette
// première maquette (vue Administrateur, édition des 3 types de
// fréquence, pas d'écrans d'administration).
//
// UserMenu (avatar + détail Julie Dupont) repris tel quel du Planning pour
// uniformiser l'utilisateur affiché en haut à droite sur les 3 applis
// (retour client du 20/11).
const UTILISATEUR_DEMO = {
  nom: "DUPONT",
  prenom: "Julie",
  typeUtilisateur: "Administrateur",
  service: "Administratif",
  poste: "Directrice",
};

export default function PilotagePaqg() {
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
              <p className="text-[10px] text-zinc-400">Pilotage PAQG</p>
            </div>
            <div className="ml-4 border-l border-zinc-200 pl-4">
              <AppTabs actif="pilotage-paqg" />
            </div>
          </div>
          <UserMenu utilisateur={UTILISATEUR_DEMO} />
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <TableauBordPilotage />
      </div>
    </div>
  );
}
