import Image from "next/image";
import type { ReactNode } from "react";
import logoAiotConseil from "../../../public/logo-aiot-conseil.png";

// Couleurs extraites du logo AioT-Conseil : #24543c (vert sapin foncé,
// dominant) et #9cd878 (vert clair, accent) — palette de toute la zone
// Administrateur Système (/compte/*), demandée le 25/09. N'affecte que
// cette zone, pas le reste de l'application (encore en mock/palette ambre).
export default function CompteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-[#eef7ea]">
      <header className="flex shrink-0 items-center gap-3 bg-[#24543c] px-4 py-2 text-white shadow-sm">
        <Image src={logoAiotConseil} alt="AioT-Conseil" className="h-9 w-auto" priority />
        <span className="rounded bg-[#9cd878] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#183c28]">
          Administration Système
        </span>
      </header>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
