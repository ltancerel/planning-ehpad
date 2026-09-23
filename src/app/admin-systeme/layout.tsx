import type { ReactNode } from "react";
import AdminSystemeNav from "@/components/admin-systeme/AdminSystemeNav";

export default function AdminSystemeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-[#A7D97A]/50 bg-[#A7D97A]/10 px-4 py-2">
        <span className="rounded bg-[#0F3A35] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
          Administration Système
        </span>
        <span className="text-xs text-[#0F3A35]">
          Supervision globale — tous établissements confondus
        </span>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <AdminSystemeNav />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
