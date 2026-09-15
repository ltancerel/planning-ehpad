"use client";

type ColorFieldProps = {
  label: string;
  valeur: string;
  onChange: (couleur: string) => void;
  palette: string[];
};

export default function ColorField({ label, valeur, onChange, palette }: ColorFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-700">{label}</label>
      <div className="flex flex-wrap items-center gap-1.5">
        {palette.map((couleur) => (
          <button
            key={couleur}
            type="button"
            onClick={() => onChange(couleur)}
            title={couleur}
            className={`h-6 w-6 rounded border ${
              valeur.toLowerCase() === couleur.toLowerCase()
                ? "border-2 border-blue-500"
                : "border-zinc-300"
            }`}
            style={{ backgroundColor: couleur }}
          />
        ))}
        <div className="ml-1 flex items-center gap-1.5">
          <input
            type="color"
            value={valeur}
            onChange={(e) => onChange(e.target.value)}
            className="h-6 w-7 cursor-pointer rounded border border-zinc-300 p-0"
            title="Couleur personnalisée"
          />
          <input
            type="text"
            value={valeur}
            onChange={(e) => onChange(e.target.value)}
            className="w-20 rounded border border-zinc-300 px-1.5 py-0.5 text-xs font-mono"
          />
        </div>
      </div>
    </div>
  );
}
