"use client";

import type { ReactNode } from "react";
import UserMenu from "@/components/UserMenu";
import AppSwitcher from "@/components/AppSwitcher";
import QualiteNav from "@/components/qualite/QualiteNav";
import { useEhpad } from "@/context/EhpadProvider";

export default function QualiteLayout({ children }: { children: ReactNode }) {
  const { identite } = useEhpad();

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-teal-200 bg-teal-50 px-4 py-2">
        <AppSwitcher applicationActive="qualite" />
        {identite.logo && (
          // eslint-disable-next-line @next/next/no-img-element -- logo dynamique (data URL uploadé), incompatible avec next/image
          <img src={identite.logo} alt={identite.nom} className="h-9 w-auto object-contain" />
        )}
        <span className="rounded bg-teal-700 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
          Qualité
        </span>
        <span className="text-xs text-teal-800">
          Maquette exploratoire — DUERP &amp; référentiel qualité HAS
        </span>
        <span className="ml-auto" />
        <UserMenu />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <QualiteNav />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
