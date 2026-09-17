import Link from "next/link";
import type { ReactNode } from "react";
import UserMenu from "@/components/UserMenu";
import QualiteNav from "@/components/qualite/QualiteNav";

export default function QualiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-teal-200 bg-teal-50 px-4 py-2">
        <span className="rounded bg-teal-700 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
          Qualité
        </span>
        <span className="text-xs text-teal-800">
          Maquette exploratoire — DUERP &amp; référentiel qualité HAS
        </span>
        <Link href="/" className="ml-auto text-xs font-medium text-teal-900 hover:underline">
          ← Application Planning
        </Link>
        <UserMenu />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <QualiteNav />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
