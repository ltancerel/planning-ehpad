"use client";

import { useState } from "react";

const LARGEUR = 480;
const HAUTEUR = 200;
const MARGE = { haut: 16, droite: 16, bas: 28, gauche: 40 };
const LARGEUR_GRAPHE = LARGEUR - MARGE.gauche - MARGE.droite;
const HAUTEUR_GRAPHE = HAUTEUR - MARGE.haut - MARGE.bas;

function echelleTicks(max: number, nombre = 4): number[] {
  const pas = Math.ceil(max / nombre / 10) * 10 || 1;
  const ticks: number[] = [];
  for (let i = 0; i <= nombre; i++) ticks.push(i * pas);
  return ticks;
}

function GrilleY({ ticks, y }: { ticks: number[]; y: (valeur: number) => number }) {
  return (
    <>
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={MARGE.gauche}
            x2={LARGEUR - MARGE.droite}
            y1={y(t)}
            y2={y(t)}
            stroke="#e1e0d9"
            strokeWidth={1}
          />
          <text
            x={MARGE.gauche - 6}
            y={y(t)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-zinc-400"
            fontSize={10}
          >
            {t}
          </text>
        </g>
      ))}
    </>
  );
}

export function TraficLineChart({ points }: { points: { jour: string; connexions: number }[] }) {
  const [survole, setSurvole] = useState<number | null>(null);

  const maxValeur = Math.max(...points.map((p) => p.connexions));
  const ticks = echelleTicks(maxValeur);
  const echelleMax = ticks[ticks.length - 1];

  function x(index: number): number {
    return MARGE.gauche + (index / (points.length - 1)) * LARGEUR_GRAPHE;
  }
  function y(valeur: number): number {
    return MARGE.haut + HAUTEUR_GRAPHE - (valeur / echelleMax) * HAUTEUR_GRAPHE;
  }

  const chemin = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.connexions)}`).join(" ");
  const zone = `${chemin} L ${x(points.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`;
  const pointSurvole = survole !== null ? points[survole] : null;
  const tooltipAGauche = survole !== null && survole > points.length - 3;

  return (
    <div className="relative">
      <svg width={LARGEUR} height={HAUTEUR} viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} className="w-full">
        <GrilleY ticks={ticks} y={y} />

        <path d={zone} fill="#A7D97A" fillOpacity={0.2} stroke="none" />
        <path d={chemin} fill="none" stroke="#0F3A35" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {survole !== null && (
          <line
            x1={x(survole)}
            x2={x(survole)}
            y1={MARGE.haut}
            y2={HAUTEUR - MARGE.bas}
            stroke="#A7D97A"
            strokeWidth={1}
          />
        )}

        {points.map((p, i) => (
          <g key={p.jour}>
            {(i === points.length - 1 || survole === i) && (
              <circle cx={x(i)} cy={y(p.connexions)} r={5} fill="#0F3A35" stroke="white" strokeWidth={2} />
            )}
            <circle
              cx={x(i)}
              cy={y(p.connexions)}
              r={14}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${p.jour} : ${p.connexions} connexions`}
              onMouseEnter={() => setSurvole(i)}
              onMouseLeave={() => setSurvole(null)}
              onFocus={() => setSurvole(i)}
              onBlur={() => setSurvole(null)}
              className="cursor-pointer outline-none"
            />
          </g>
        ))}

        {points.map((p, i) => (
          <text
            key={p.jour}
            x={x(i)}
            y={HAUTEUR - MARGE.bas + 16}
            textAnchor="middle"
            className="fill-zinc-500"
            fontSize={10}
          >
            {p.jour}
          </text>
        ))}
      </svg>

      {pointSurvole && survole !== null && (
        <div
          className="pointer-events-none absolute rounded border border-zinc-200 bg-white px-2 py-1 text-xs whitespace-nowrap shadow-md"
          style={{
            left: tooltipAGauche ? undefined : `${(x(survole) / LARGEUR) * 100}%`,
            right: tooltipAGauche ? `${100 - (x(survole) / LARGEUR) * 100}%` : undefined,
            top: `${(y(pointSurvole.connexions) / HAUTEUR) * 100}%`,
            transform: "translateY(-130%)",
          }}
        >
          <span className="font-semibold text-zinc-800">{pointSurvole.connexions}</span>{" "}
          <span className="text-zinc-500">connexions — {pointSurvole.jour}</span>
        </div>
      )}
    </div>
  );
}

export function VolumeBarChart({
  barres,
}: {
  barres: { label: string; labelComplet: string; valeur: number }[];
}) {
  const [survole, setSurvole] = useState<number | null>(null);

  const maxValeur = Math.max(...barres.map((b) => b.valeur));
  const ticks = echelleTicks(maxValeur);
  const echelleMax = ticks[ticks.length - 1];
  const largeurBande = LARGEUR_GRAPHE / barres.length;
  const largeurBarre = Math.min(28, largeurBande - 16);

  function y(valeur: number): number {
    return MARGE.haut + HAUTEUR_GRAPHE - (valeur / echelleMax) * HAUTEUR_GRAPHE;
  }

  const barreSurvolee = survole !== null ? barres[survole] : null;
  const centreSurvole = survole !== null ? MARGE.gauche + largeurBande * survole + largeurBande / 2 : 0;

  return (
    <div className="relative">
      <svg width={LARGEUR} height={HAUTEUR} viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} className="w-full">
        <GrilleY ticks={ticks} y={y} />

        {barres.map((b, i) => {
          const centre = MARGE.gauche + largeurBande * i + largeurBande / 2;
          const yHaut = y(b.valeur);
          const hauteurBarre = Math.max(MARGE.haut + HAUTEUR_GRAPHE - yHaut, 0);
          return (
            <g key={b.label}>
              <rect
                x={centre - largeurBarre / 2}
                y={yHaut}
                width={largeurBarre}
                height={hauteurBarre}
                rx={4}
                fill={survole === i ? "#0F3A35" : "#2F5B43"}
              />
              <text x={centre} y={yHaut - 6} textAnchor="middle" className="fill-zinc-600" fontSize={10} fontWeight={600}>
                {b.valeur}
              </text>
              <text
                x={centre}
                y={HAUTEUR - MARGE.bas + 16}
                textAnchor="middle"
                className="fill-zinc-500"
                fontSize={10}
              >
                {b.label}
              </text>
              <rect
                x={centre - largeurBande / 2}
                y={MARGE.haut}
                width={largeurBande}
                height={HAUTEUR_GRAPHE}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${b.labelComplet} : ${b.valeur} Mo`}
                onMouseEnter={() => setSurvole(i)}
                onMouseLeave={() => setSurvole(null)}
                onFocus={() => setSurvole(i)}
                onBlur={() => setSurvole(null)}
                className="cursor-pointer outline-none"
              />
            </g>
          );
        })}
      </svg>

      {barreSurvolee && survole !== null && (
        <div
          className="pointer-events-none absolute rounded border border-zinc-200 bg-white px-2 py-1 text-xs whitespace-nowrap shadow-md"
          style={{
            left: `${(centreSurvole / LARGEUR) * 100}%`,
            top: `${(y(barreSurvolee.valeur) / HAUTEUR) * 100}%`,
            transform: "translate(-50%, -140%)",
          }}
        >
          <span className="font-semibold text-zinc-800">{barreSurvolee.valeur} Mo</span>{" "}
          <span className="text-zinc-500">{barreSurvolee.labelComplet}</span>
        </div>
      )}
    </div>
  );
}
