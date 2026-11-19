import Link from "next/link";

type ApplicationOnglet = {
  code: string;
  label: string;
  href: string;
};

// EPIC Multi-application (#46) — maquette, story #47. 3 applications
// prévues : Planning (existant), Pilotage PAQG et Actions PAQG (périmètre
// TBD, pages placeholder en attendant). Onglets plutôt qu'un sélecteur à
// ouvrir : chaque application reste visible et accessible en un clic.
const APPLICATIONS: ApplicationOnglet[] = [
  { code: "planning", label: "Planning", href: "/" },
  { code: "pilotage-paqg", label: "Pilotage PAQG", href: "/pilotage-paqg" },
  { code: "actions-paqg", label: "Actions PAQG", href: "/actions-paqg" },
];

export default function AppTabs({ actif }: { actif: string }) {
  return (
    <nav className="flex gap-1 border-t border-zinc-200 bg-zinc-50 px-4" aria-label="Applications">
      {APPLICATIONS.map((application) => {
        const estActif = application.code === actif;
        return (
          <Link
            key={application.code}
            href={application.href}
            aria-current={estActif ? "page" : undefined}
            className={
              estActif
                ? "border-b-2 border-amber-500 px-3 py-2 text-xs font-semibold text-zinc-900"
                : "border-b-2 border-transparent px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800"
            }
          >
            {application.label}
          </Link>
        );
      })}
    </nav>
  );
}
