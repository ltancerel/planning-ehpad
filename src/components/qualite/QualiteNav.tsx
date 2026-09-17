"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { label: "Tableau de bord", href: "/qualite" },
  { label: "DUERP", href: "/qualite/duerp" },
  { label: "Référentiel HAS", href: "/qualite/referentiel" },
];

export default function QualiteNav() {
  const pathname = usePathname();

  return (
    <nav className="w-52 shrink-0 border-r border-zinc-200 bg-zinc-50 p-2">
      <ul className="space-y-0.5">
        {SECTIONS.map((section) => {
          const actif = pathname === section.href;
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                className={`block rounded px-2 py-1.5 text-sm ${
                  actif ? "bg-teal-700 text-white" : "text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
