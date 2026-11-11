"use client";

import type { ReactNode } from "react";
import type { SensTri } from "@/lib/useTri";

type ThTriableProps<Colonne extends string> = {
  colonne: Colonne;
  colonneActive: Colonne | null;
  sens: SensTri;
  onTrier: (colonne: Colonne) => void;
  children: ReactNode;
  className?: string;
};

export default function ThTriable<Colonne extends string>({
  colonne,
  colonneActive,
  sens,
  onTrier,
  children,
  className,
}: ThTriableProps<Colonne>) {
  const actif = colonneActive === colonne;
  return (
    <th className={`px-3 py-2 ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => onTrier(colonne)}
        className="flex items-center gap-1 whitespace-nowrap font-medium text-zinc-500 hover:text-zinc-700"
      >
        {children}
        <span className={actif ? "text-zinc-600" : "text-zinc-300"}>
          {actif ? (sens === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}
