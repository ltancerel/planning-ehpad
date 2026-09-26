"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type EntreeNav = {
  label: string;
  href: string;
  disponible: boolean;
};

const SECTIONS: EntreeNav[] = [
  { label: "Identité établissement", href: "/admin/ehpad", disponible: true },
  { label: "Utilisateurs", href: "/admin/utilisateurs", disponible: true },
  { label: "Salariés", href: "/admin/salaries", disponible: true },
  { label: "Codes horaires", href: "/admin/horaires", disponible: true },
  { label: "Roulements", href: "/admin/roulements", disponible: true },
  { label: "Années", href: "/admin/annees", disponible: true },
  { label: "Export", href: "/admin/export", disponible: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="w-48 shrink-0 border-r border-zinc-200 bg-zinc-50 p-2">
      <ul className="space-y-0.5">
        {SECTIONS.map((section) => {
          const actif = pathname === section.href;
          if (!section.disponible) {
            return (
              <li key={section.href}>
                <span className="flex cursor-not-allowed items-center justify-between rounded px-2 py-1.5 text-sm text-zinc-400">
                  {section.label}
                  <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                    Bientôt
                  </span>
                </span>
              </li>
            );
          }
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                className={`block rounded px-2 py-1.5 text-sm ${
                  actif ? "bg-zinc-800 text-white" : "text-zinc-700 hover:bg-zinc-200"
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
