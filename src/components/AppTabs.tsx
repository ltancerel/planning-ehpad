import Link from "next/link";
import type { ReactNode } from "react";

type ApplicationOnglet = {
  code: string;
  label: string;
  href: string;
  couleur: string;
  icone: ReactNode;
};

const tailleIcone = "h-5 w-5";

function IconePlanning() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={tailleIcone}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </svg>
  );
}

function IconePilotage() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={tailleIcone}>
      <path d="M4 15a8 8 0 1 1 16 0" />
      <path d="M12 15l4-4" />
      <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconeActions() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={tailleIcone}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 12l2.5 2.5L16 9" />
    </svg>
  );
}

// EPIC Multi-application (#46) — maquette, story #47. 3 applications
// prévues : Planning (existant), Pilotage PAQG et Actions PAQG (périmètre
// TBD, pages placeholder en attendant). Icônes rondes colorées avec
// libellé plutôt qu'un sélecteur à ouvrir : chaque application reste
// visible et accessible en un clic, l'application active mise en avant
// (icône plus grande, libellé en gras). Intégré dans la rangée d'en-tête,
// à droite du bloc EHPAD, plutôt qu'en rangée séparée (retour client).
const APPLICATIONS: ApplicationOnglet[] = [
  { code: "planning", label: "Planning", href: "/", couleur: "#2563eb", icone: <IconePlanning /> },
  { code: "pilotage-paqg", label: "Programmation", href: "/pilotage-paqg", couleur: "#7c3aed", icone: <IconePilotage /> },
  { code: "actions-paqg", label: "PAQG", href: "/actions-paqg", couleur: "#059669", icone: <IconeActions /> },
];

export default function AppTabs({ actif }: { actif: string }) {
  return (
    <nav className="flex items-center gap-3" aria-label="Applications">
      {APPLICATIONS.map((application) => {
        const estActif = application.code === actif;
        return (
          <Link
            key={application.code}
            href={application.href}
            aria-current={estActif ? "page" : undefined}
            className="flex flex-col items-center gap-0.5 text-center"
          >
            <span
              className={
                "flex items-center justify-center rounded-full text-white shadow-sm transition-all " +
                (estActif ? "h-8 w-8" : "h-6 w-6 opacity-90")
              }
              style={{ backgroundColor: application.couleur }}
            >
              <span className={estActif ? "scale-90" : "scale-[0.6]"}>{application.icone}</span>
            </span>
            <span
              className={
                "text-[9px] uppercase leading-none tracking-wide " +
                (estActif ? "font-semibold text-zinc-800" : "font-medium text-zinc-400")
              }
            >
              {application.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
