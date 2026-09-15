import Link from "next/link";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2">
        <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
          Administration
        </span>
        <span className="text-xs text-amber-800">Accès réservé au rôle Administrateur</span>
        <Link href="/" className="ml-auto text-xs font-medium text-amber-900 hover:underline">
          ← Retour au planning
        </Link>
      </header>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
