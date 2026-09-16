"use client";

import { useMemo, useState } from "react";
import type {
  HoraireCategorie,
  HoraireCode,
  Plage,
  RegleHeuresEvenement,
  TypeEvenement,
} from "@/lib/horaire-codes";
import { dureeHeures } from "@/lib/horaire-codes";
import { PALETTE_FOND, PALETTE_TEXTE } from "@/lib/palette";
import ColorField from "./ColorField";

const CATEGORIES: { valeur: HoraireCategorie; libelle: string }[] = [
  { valeur: "travail", libelle: "Travail (plages horaires)" },
  { valeur: "informatif", libelle: "Informatif" },
  { valeur: "evenementiel", libelle: "Événementiel" },
  { valeur: "special", libelle: "Particulier (repos / absence)" },
];

const TYPES_EVENEMENT: { valeur: TypeEvenement; libelle: string; description: string }[] = [
  {
    valeur: "superposition",
    libelle: "Superposition",
    description:
      "Se superpose au code de travail et écrase entièrement le décompte d'heures (le code de travail reste visible mais barré).",
  },
  {
    valeur: "complement",
    libelle: "Complément à la volée",
    description:
      "Une plage horaire est saisie au moment de positionner l'évènement sur le planning : elle vient en heures en moins si elle chevauche le code de travail, en heures en plus sinon. Le code de travail n'est pas barré.",
  },
];

const REGLES_HEURES: { valeur: RegleHeuresEvenement; libelle: string }[] = [
  { valeur: "zero", libelle: "0 heure" },
  { valeur: "code_initial", libelle: "Heures du code horaire initial" },
  { valeur: "personnalise", libelle: "Personnalisé" },
];

const PLAGE_VIDE: Plage = { debut: "", fin: "" };

type HoraireCodeFormProps = {
  valeurInitiale?: HoraireCode;
  codesExistants: string[];
  onValider: (code: HoraireCode) => void;
  onAnnuler: () => void;
};

export default function HoraireCodeForm({
  valeurInitiale,
  codesExistants,
  onValider,
  onAnnuler,
}: HoraireCodeFormProps) {
  const modeEdition = Boolean(valeurInitiale);
  const [code, setCode] = useState(valeurInitiale?.code ?? "");
  const [intitule, setIntitule] = useState(valeurInitiale?.intitule ?? "");
  const [categorie, setCategorie] = useState<HoraireCategorie>(valeurInitiale?.categorie ?? "travail");
  const [couleurFond, setCouleurFond] = useState(valeurInitiale?.couleurFond ?? PALETTE_FOND[0]);
  const [couleurTexte, setCouleurTexte] = useState(valeurInitiale?.couleurTexte ?? PALETTE_TEXTE[0]);
  const [commentaire, setCommentaire] = useState(valeurInitiale?.commentaire ?? "");
  const [plages, setPlages] = useState<Plage[]>(
    valeurInitiale?.plages?.length ? valeurInitiale.plages : [PLAGE_VIDE]
  );
  const [action, setAction] = useState(valeurInitiale?.action ?? "Se superpose au code horaire");
  const [typeEvenement, setTypeEvenement] = useState<TypeEvenement>(
    valeurInitiale?.typeEvenement ?? "superposition"
  );
  const [regleHeures, setRegleHeures] = useState<RegleHeuresEvenement>(valeurInitiale?.regleHeures ?? "zero");
  const [heuresPersonnalisees, setHeuresPersonnalisees] = useState(
    valeurInitiale?.heuresPersonnalisees?.toString() ?? ""
  );
  const [erreur, setErreur] = useState<string | null>(null);

  const heuresCalculees = useMemo(
    () => dureeHeures(plages.filter((p) => p.debut && p.fin)),
    [plages]
  );

  function changerCode(saisie: string) {
    // Les codes existants ne sont pas tous des lettres pures (ex. "60S",
    // "70A", "185", ".", "?", "??") et peuvent aller jusqu'à 5 caractères
    // (ex. "NDISP") — cf. retour client du 17/09 ("60S" refusé à l'édition).
    setCode(saisie.toUpperCase().replace(/[^A-Z0-9.?]/g, "").slice(0, 5));
  }

  function changerPlage(index: number, champ: keyof Plage, valeur: string) {
    setPlages((prev) => prev.map((p, i) => (i === index ? { ...p, [champ]: valeur } : p)));
  }

  function ajouterPlage() {
    if (plages.length < 4) setPlages((prev) => [...prev, PLAGE_VIDE]);
  }

  function retirerPlage(index: number) {
    setPlages((prev) => prev.filter((_, i) => i !== index));
  }

  function valider() {
    if (!/^[A-Z0-9.?]{1,5}$/.test(code)) {
      setErreur("Le code doit contenir 1 à 5 caractères (lettres majuscules, chiffres, . ou ?).");
      return;
    }
    const autresCode = codesExistants.filter((c) => c !== valeurInitiale?.code.toUpperCase());
    if (autresCode.includes(code)) {
      setErreur("Ce code existe déjà.");
      return;
    }
    if (!intitule.trim()) {
      setErreur("L'intitulé est obligatoire.");
      return;
    }

    const nouveauCode: HoraireCode = {
      code,
      intitule: intitule.trim(),
      categorie,
      couleurFond,
      couleurTexte,
      commentaire: commentaire.trim() || undefined,
    };

    if (categorie === "travail") {
      nouveauCode.plages = plages.filter((p) => p.debut && p.fin);
    }
    if (categorie === "evenementiel") {
      nouveauCode.action = action.trim() || undefined;
      nouveauCode.typeEvenement = typeEvenement;
      if (typeEvenement === "superposition") {
        nouveauCode.regleHeures = regleHeures;
        if (regleHeures === "personnalise") {
          nouveauCode.heuresPersonnalisees = Number(heuresPersonnalisees) || 0;
        }
      }
    }

    setErreur(null);
    onValider(nouveauCode);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-800">
          {modeEdition ? "Modifier le code horaire" : "Nouveau code horaire"}
        </h2>
        <button onClick={onAnnuler} className="text-zinc-400 hover:text-zinc-600" aria-label="Fermer">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-auto px-4 py-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Catégorie</label>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value as HoraireCategorie)}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.valeur} value={c.valeur}>
                {c.libelle}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <div className="w-24">
            <label className="mb-1 block text-xs font-medium text-zinc-700">Code (5 caractères max)</label>
            <input
              value={code}
              onChange={(e) => changerCode(e.target.value)}
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm font-semibold uppercase"
              placeholder="ABC"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-700">Intitulé</label>
            <input
              value={intitule}
              onChange={(e) => setIntitule(e.target.value)}
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
              placeholder="Ex : Congés"
            />
          </div>
        </div>

        <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
          <div className="mb-2 text-xs font-medium text-zinc-500">Aperçu</div>
          <span
            className="inline-block rounded px-2 py-1 text-sm font-semibold"
            style={{ backgroundColor: couleurFond, color: couleurTexte }}
          >
            {code || "ABC"}
          </span>
        </div>

        <ColorField label="Couleur de fond" valeur={couleurFond} onChange={setCouleurFond} palette={PALETTE_FOND} />
        <ColorField label="Couleur du texte" valeur={couleurTexte} onChange={setCouleurTexte} palette={PALETTE_TEXTE} />

        {categorie === "travail" && (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-zinc-700">Plages horaires (max 4)</label>
              <span className="text-xs text-zinc-500">Total calculé : {heuresCalculees}h</span>
            </div>
            <div className="space-y-2">
              {plages.map((plage, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={plage.debut}
                    onChange={(e) => changerPlage(index, "debut", e.target.value)}
                    className="rounded border border-zinc-300 px-2 py-1 text-sm"
                  />
                  <span className="text-zinc-400">→</span>
                  <input
                    type="time"
                    value={plage.fin}
                    onChange={(e) => changerPlage(index, "fin", e.target.value)}
                    className="rounded border border-zinc-300 px-2 py-1 text-sm"
                  />
                  {plages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => retirerPlage(index)}
                      className="ml-1 text-xs text-red-500 hover:text-red-700"
                    >
                      Retirer
                    </button>
                  )}
                </div>
              ))}
              {plages.length < 4 && (
                <button
                  type="button"
                  onClick={ajouterPlage}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  + Ajouter une plage
                </button>
              )}
            </div>
          </div>
        )}

        {categorie === "special" && (
          <p className="rounded bg-zinc-50 p-2 text-xs text-zinc-500">
            Code particulier : pas de plage horaire, 0h de travail comptabilisée.
          </p>
        )}

        {categorie === "evenementiel" && (
          <div className="space-y-3 rounded border border-zinc-200 p-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">Action</label>
              <input
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">Type d&apos;évènement</label>
              <div className="space-y-2">
                {TYPES_EVENEMENT.map((t) => (
                  <label
                    key={t.valeur}
                    className={`flex cursor-pointer items-start gap-2 rounded border p-2 ${
                      typeEvenement === t.valeur ? "border-blue-400 bg-blue-50" : "border-zinc-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="typeEvenement"
                      checked={typeEvenement === t.valeur}
                      onChange={() => setTypeEvenement(t.valeur)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block text-sm font-medium text-zinc-700">{t.libelle}</span>
                      <span className="block text-[11px] text-zinc-500">{t.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {typeEvenement === "superposition" ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Total d&apos;heures comptabilisées
                </label>
                <select
                  value={regleHeures}
                  onChange={(e) => setRegleHeures(e.target.value as RegleHeuresEvenement)}
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                >
                  {REGLES_HEURES.map((r) => (
                    <option key={r.valeur} value={r.valeur}>
                      {r.libelle}
                    </option>
                  ))}
                </select>
                {regleHeures === "personnalise" && (
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={heuresPersonnalisees}
                    onChange={(e) => setHeuresPersonnalisees(e.target.value)}
                    className="mt-2 w-24 rounded border border-zinc-300 px-2 py-1 text-sm"
                    placeholder="Heures"
                  />
                )}
              </div>
            ) : (
              <p className="rounded bg-zinc-50 p-2 text-xs text-zinc-500">
                Les heures sont calculées automatiquement à partir de la plage saisie au moment de
                positionner l&apos;évènement sur le planning (chevauchement du code de travail = heures en
                moins, hors travail = heures en plus).
              </p>
            )}
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Commentaire</label>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={2}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          />
        </div>

        {erreur && <p className="text-xs font-medium text-red-600">{erreur}</p>}
      </div>

      <div className="flex justify-end gap-2 border-t border-zinc-200 px-4 py-3">
        <button
          onClick={onAnnuler}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Annuler
        </button>
        <button
          onClick={valider}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {modeEdition ? "Enregistrer" : "Créer"}
        </button>
      </div>
    </div>
  );
}
