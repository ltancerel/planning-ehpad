"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type EntreeNav = {
  label: string;
  href: string;
};

const SECTIONS: EntreeNav[] = [
  { label: "Tableau de bord", href: "/admin-systeme" },
  { label: "Établissements", href: "/admin-systeme/etablissements" },
  { label: "Logs", href: "/admin-systeme/logs" },
];

export default function AdminSystemeNav() {
  const pathname = usePathname();

  return (
    <nav className="w-48 shrink-0 border-r border-zinc-200 bg-zinc-50 p-2">
      <ul className="space-y-0.5">
        {SECTIONS.map((section) => {
          const actif = pathname === section.href;
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                className={`block rounded px-2 py-1.5 text-sm ${
                  actif ? "bg-[#0F3A35] text-white" : "text-zinc-700 hover:bg-zinc-200"
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
