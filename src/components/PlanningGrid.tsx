"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  SALARIES,
  SERVICES_ORDRE,
  MANAGERS,
  JOURS_FERIES_2026,
  PLANNING_DEMO,
  ROULEMENTS_DEMO,
  AFFECTATIONS_ROULEMENT_DEMO,
  CORRESPONDANCE_SALARIE_FICHE_DEMO,
  UTILISATEUR_CONNECTE,
  affectationActuelle,
  ficheDuSalarie,
  type Roulement,
  type Salarie,
} from "@/lib/mock-data";
import {
  FiltreSalariesBouton,
  FiltresActifsChips,
  filtresVides,
  type FiltresAvances,
} from "@/components/FiltreSalariesAvance";
import {
  HORAIRE_CODES_PAR_CODE,
  estCodeSuperposable,
  heuresReellesCellule,
  deltaEvenementielCellule,
  type ValeurCellule,
  type Plage,
} from "@/lib/horaire-codes";
import {
  formatDateISO,
  parseDateISO,
  lettreJour,
  estWeekend,
  formatJourMois,
  lundiDeLaSemaine,
  genererPeriode,
  formatAnneeMois,
} from "@/lib/dates";
import UserMenu from "@/components/UserMenu";
import { useEhpad } from "@/context/EhpadProvider";
import HoraireCodeSelector, { type PositionSelecteur } from "@/components/HoraireCodeSelector";

const NB_SEMAINES = 4;
const NB_JOURS = NB_SEMAINES * 7;
const LARGEUR_COLONNE = 44;
const LARGEUR_COLONNE_SALARIE = 200;
const HAUTEUR_LIGNE_ENTETE = 28;
const CLE_STOCKAGE_PERIODE = "planning-ehpad:periode-debut";

// Vue par défaut : septembre 2026, pour une démo cohérente quelle que soit la
// date réelle de consultation.
const PERIODE_PAR_DEFAUT = new Date(2026, 8, 1);

function estJourGrise(date: Date): boolean {
  return estWeekend(date) || JOURS_FERIES_2026.has(formatDateISO(date));
}

export default function PlanningGrid() {
  const [debutPeriode, setDebutPeriode] = useState(() => lundiDeLaSemaine(PERIODE_PAR_DEFAUT));
  const jours = useMemo(() => genererPeriode(debutPeriode, NB_JOURS), [debutPeriode]);
  // undefined = case hachurée (jamais remplie), y compris quand une case est
  // effacée : l'effacement remet la case en attente de planification plutôt
  // que de la marquer comme "vidée" (retour client du 17/09).
  const [editions, setEditions] = useState<Record<string, ValeurCellule | undefined>>({});
  const [cellEnEdition, setCellEnEdition] = useState<string | null>(null);
  const [positionEdition, setPositionEdition] = useState<PositionSelecteur | null>(null);
  const [selecteurOuvert, setSelecteurOuvert] = useState(false);
  const [filtres, setFiltres] = useState<FiltresAvances>(filtresVides);
  // Sélection multi-salariés par glisser sur des cases hachurées (jamais remplies)
  // pour appliquer en une fois le roulement actuel de chaque salarié sélectionné.
  const [enTrainDeGlisser, setEnTrainDeGlisser] = useState(false);
  const [selectionEnCours, setSelectionEnCours] = useState<{
    dateISO: string;
    salarieIds: string[];
  } | null>(null);
  const [positionConfirmation, setPositionConfirmation] = useState<{ top: number; left: number } | null>(
    null
  );
  // Sélection rectangulaire (glisser sur des cases déjà remplies) pour effacer
  // des codes horaires sur une ou plusieurs lignes/jours — fonctionnalité admin.
  const [enTrainDeSelectionnerEffacement, setEnTrainDeSelectionnerEffacement] = useState(false);
  const [ancreEffacement, setAncreEffacement] = useState<{ salarieId: string; dateISO: string } | null>(
    null
  );
  const [survolEffacement, setSurvolEffacement] = useState<{ salarieId: string; dateISO: string } | null>(
    null
  );
  const [positionActionEffacement, setPositionActionEffacement] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Mémorisation de la période affichée d'une ouverture à l'autre (cf. CDC)
  useEffect(() => {
    try {
      const enregistree = localStorage.getItem(CLE_STOCKAGE_PERIODE);
      if (!enregistree) return;
      const periodeEnregistree = lundiDeLaSemaine(parseDateISO(enregistree));
      // Hydratation depuis localStorage au montage : nécessairement post-render côté client
      // pour éviter un mismatch SSR (le serveur n'a pas accès à localStorage).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDebutPeriode((actuelle) =>
        formatDateISO(actuelle) === formatDateISO(periodeEnregistree) ? actuelle : periodeEnregistree
      );
    } catch {
      // localStorage indisponible (navigation privée...) : on garde la période par défaut
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CLE_STOCKAGE_PERIODE, formatDateISO(debutPeriode));
    } catch {
      // ignoré : la mémorisation est un confort, pas une exigence bloquante
    }
  }, [debutPeriode]);

  // "Avec/sans planning" dépend de la période actuellement affichée (retour
  // client du 17/09) : au moins un jour de la période a un code travail ou
  // évènementiel, en tenant compte des éditions en cours (même résolution
  // que le rendu des cases : édition locale prioritaire sur la démo).
  function salarieAUnPlanningSurPeriode(salarieId: string): boolean {
    return jours.some((jour) => {
      const cle = `${salarieId}__${formatDateISO(jour)}`;
      const valeur = cle in editions ? editions[cle] : PLANNING_DEMO[cle];
      return valeur !== undefined;
    });
  }

  // Filtre avancé (retour client du 22/09) : chaque critère (contrat,
  // présence, manager, service, planning) est indépendant et se combine en
  // ET avec les autres ; plusieurs valeurs cochées dans un même critère se
  // combinent en OU. Un salarié sans fiche (ex. lignes "Besoin") n'a ni
  // contrat, ni présence, ni manager : il est exclu dès qu'un de ces
  // critères est actif, mais reste filtrable par service (disponible
  // directement sur la ligne du planning, sans fiche).
  function salarieCorrespondAuxFiltres(salarie: Salarie): boolean {
    if (filtres.service.size > 0 && !filtres.service.has(salarie.service)) return false;

    const besoinDeFiche = filtres.contrat.size > 0 || filtres.presence.size > 0 || filtres.manager.size > 0;
    const fiche = besoinDeFiche ? ficheDuSalarie(salarie.id) : undefined;
    if (besoinDeFiche && !fiche) return false;

    if (fiche) {
      if (filtres.contrat.size > 0 && !filtres.contrat.has(fiche.contratActif ? "actif" : "inactif")) {
        return false;
      }
      if (
        filtres.presence.size > 0 &&
        !filtres.presence.has(fiche.presence === "Présent" ? "present" : "absent")
      ) {
        return false;
      }
      if (filtres.manager.size > 0 && !filtres.manager.has(fiche.manager)) return false;
    }

    if (filtres.planning.size > 0) {
      const etat = salarieAUnPlanningSurPeriode(salarie.id) ? "avec" : "sans";
      if (!filtres.planning.has(etat)) return false;
    }

    return true;
  }

  const groupes = useMemo(() => {
    const salariesFiltres = SALARIES.filter(salarieCorrespondAuxFiltres);
    const parService = new Map<string, typeof SALARIES>();
    for (const salarie of salariesFiltres) {
      const liste = parService.get(salarie.service) ?? [];
      liste.push(salarie);
      parService.set(salarie.service, liste);
    }
    return SERVICES_ORDRE.filter((s) => parService.has(s)).map((service) => ({
      service,
      salaries: parService.get(service)!,
    }));
    // salarieCorrespondAuxFiltres est recréée à chaque rendu mais lit filtres/
    // jours/editions au moment de l'appel : les lister explicitement suffit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtres, jours, editions]);

  // Ordre à plat des lignes salarié tel qu'affiché (groupé par service) et
  // index par jour affiché : nécessaires pour calculer le rectangle d'une
  // sélection d'effacement (lignes × colonnes) à partir de deux coins.
  const salariesOrdonnes = useMemo(() => groupes.flatMap((g) => g.salaries), [groupes]);
  const indexSalarie = useMemo(
    () => new Map(salariesOrdonnes.map((s, i) => [s.id, i])),
    [salariesOrdonnes]
  );
  const indexJour = useMemo(
    () => new Map(jours.map((j, i) => [formatDateISO(j), i])),
    [jours]
  );
  const estAdministrateur = UTILISATEUR_CONNECTE.typeUtilisateur === "Administrateur";
  // Le Manager peut modifier le planning (poser/effacer un code sur une case)
  // mais pas la sélection multiple / l'application groupée de roulement, ni
  // le menu Administration — réservés à l'Administrateur (retour client du
  // 23/09 : nouveau rôle Manager). L'Utilisateur reste en lecture seule.
  const peutEditerPlanning = estAdministrateur || UTILISATEUR_CONNECTE.typeUtilisateur === "Manager";

  function ouvrirEdition(cle: string, cellule: HTMLElement) {
    const rect = cellule.getBoundingClientRect();
    setPositionEdition({ top: rect.bottom + 2, left: rect.left, width: rect.width });
    setCellEnEdition(cle);
  }

  function fermerEdition() {
    setCellEnEdition(null);
    setPositionEdition(null);
  }

  function choisirCode(cle: string, codeChoisi: string | null) {
    setEditions((prev) => {
      if (codeChoisi === null) {
        // Remet la case en hachurée (jamais remplie) plutôt que "vidée" :
        // l'effacement doit rendre la case disponible pour la planification.
        return { ...prev, [cle]: undefined };
      }
      const actuelle = (cle in prev ? prev[cle] : PLANNING_DEMO[cle]) ?? {};
      const horaireChoisi = HORAIRE_CODES_PAR_CODE[codeChoisi.toUpperCase()];
      let nouvelle: ValeurCellule;
      if (horaireChoisi?.categorie === "informatif") {
        nouvelle = { ...actuelle, informatif: codeChoisi };
      } else if (estCodeSuperposable(codeChoisi)) {
        nouvelle = { ...actuelle, evenementiel: codeChoisi, evenementielPlages: undefined };
      } else {
        nouvelle = { travail: codeChoisi }; // code travail : remplace tout (travail, informatif, évènementiel)
      }
      return { ...prev, [cle]: nouvelle };
    });
    fermerEdition();
  }

  // Évènement "complement" (à la volée) : la ou les plages horaires
  // viennent d'être saisies au moment de positionner l'évènement — cf.
  // retour client du 17/09 (une plage), étendu le 22/09 (plusieurs plages
  // possibles le même jour, ex. arrivée anticipée + départ tardif).
  function choisirCodeComplement(cle: string, codeChoisi: string, plages: Plage[]) {
    setEditions((prev) => {
      const actuelle = (cle in prev ? prev[cle] : PLANNING_DEMO[cle]) ?? {};
      const nouvelle: ValeurCellule = { ...actuelle, evenementiel: codeChoisi, evenementielPlages: plages };
      return { ...prev, [cle]: nouvelle };
    });
    fermerEdition();
  }

  function roulementActuelDuSalarie(salarieId: string): Roulement | undefined {
    const ficheId = CORRESPONDANCE_SALARIE_FICHE_DEMO[salarieId];
    if (!ficheId) return undefined;
    const affectations = AFFECTATIONS_ROULEMENT_DEMO[ficheId] ?? [];
    const actuelle = affectationActuelle(affectations, formatDateISO(new Date()));
    return actuelle ? ROULEMENTS_DEMO.find((r) => r.id === actuelle.roulementId) : undefined;
  }

  function demarrerSelection(salarieId: string, dateISO: string) {
    setEnTrainDeGlisser(true);
    setSelectionEnCours({ dateISO, salarieIds: [salarieId] });
  }

  function etendreSelection(salarieId: string, dateISO: string) {
    if (!enTrainDeGlisser) return;
    setSelectionEnCours((prev) => {
      if (!prev || prev.dateISO !== dateISO || prev.salarieIds.includes(salarieId)) return prev;
      return { ...prev, salarieIds: [...prev.salarieIds, salarieId] };
    });
  }

  function annulerSelection() {
    setSelectionEnCours(null);
    setPositionConfirmation(null);
  }

  // Évalue (sans rien modifier) le motif d'un roulement pour un salarié, sur
  // exactement les nbSemaines du roulement à partir du lundi donné (retour
  // client du 17/09 : la planification démarre sur la semaine du jour choisi
  // et ne porte que sur la durée propre du roulement, pas au-delà) — que ces
  // semaines soient ou non actuellement affichées à l'écran (retour client :
  // une application sur 2 semaines ne montrait que la 1ère si la période
  // visible au moment du clic ne couvrait pas la 2nde, sans aucun message).
  // Tout ou rien : si une seule de ces semaines contient déjà un code
  // horaire, rien n'est appliqué du tout, et la semaine bloquante est
  // renvoyée pour pouvoir le signaler à l'utilisateur.
  //
  // semaineDepart (1-indexée, retour client du 22/09) : permet de ne pas
  // repartir systématiquement de la semaine 1 du motif. Ex. un roulement sur
  // 4 semaines avec semaineDepart=3 applique uniquement les semaines 3 et 4
  // du motif, sur les 2 semaines calendaires à partir du lundi choisi.
  function evaluerProjectionRoulement(
    editionsBase: Record<string, ValeurCellule | undefined>,
    salarieId: string,
    lundiDebut: Date,
    roulement: Roulement,
    semaineDepart: number = 1
  ): {
    editions: Record<string, ValeurCellule | undefined>;
    bloque: boolean;
    semaineBloqueeISO?: string;
  } {
    const indexDepart = Math.min(Math.max(semaineDepart - 1, 0), roulement.nbSemaines - 1);
    const nbSemainesAAppliquer = roulement.nbSemaines - indexDepart;

    const valeurDe = (jour: Date) => {
      const cle = `${salarieId}__${formatDateISO(jour)}`;
      return cle in editionsBase ? editionsBase[cle] : PLANNING_DEMO[cle];
    };

    const semaines: Date[][] = [];
    for (let semaine = 0; semaine < nbSemainesAAppliquer; semaine++) {
      const lundiSemaine = new Date(lundiDebut);
      lundiSemaine.setDate(lundiSemaine.getDate() + semaine * 7);
      semaines.push(
        Array.from({ length: 7 }, (_, j) => {
          const jour = new Date(lundiSemaine);
          jour.setDate(jour.getDate() + j);
          return jour;
        })
      );
    }

    for (const joursDeLaSemaine of semaines) {
      if (joursDeLaSemaine.some((jour) => Boolean(valeurDe(jour)?.travail))) {
        return { editions: editionsBase, bloque: true, semaineBloqueeISO: formatDateISO(joursDeLaSemaine[0]) };
      }
    }

    let nouvelles = editionsBase;
    semaines.forEach((joursDeLaSemaine, i) => {
      const semaineIndex = indexDepart + i;
      for (const jour of joursDeLaSemaine) {
        const jourIndex = (jour.getDay() + 6) % 7; // 0 = lundi
        const code = roulement.motif[semaineIndex][jourIndex];
        const cle = `${salarieId}__${formatDateISO(jour)}`;
        const existante = valeurDe(jour);
        nouvelles = { ...nouvelles, [cle]: code ? { ...existante, travail: code } : {} };
      }
    });
    return { editions: nouvelles, bloque: false };
  }

  function appliquerSelection() {
    if (!selectionEnCours) return;
    const lundi = lundiDeLaSemaine(parseDateISO(selectionEnCours.dateISO));

    // Toujours depuis la semaine 1 du motif de chacun (pas de sélecteur de
    // semaine de départ ici, contrairement au raccourci mono-salarié) : les
    // salariés sélectionnés peuvent avoir des roulements de longueurs
    // différentes, un même choix de semaine de départ serait ambigu d'un
    // salarié à l'autre — retour client du 22/09.
    setEditions((prev) => {
      let nouvelles = prev;
      for (const salarieId of selectionEnCours.salarieIds) {
        const roulement = roulementActuelDuSalarie(salarieId);
        if (!roulement) continue;
        nouvelles = evaluerProjectionRoulement(nouvelles, salarieId, lundi, roulement).editions;
      }
      return nouvelles;
    });

    annulerSelection();
  }

  function appliquerRoulementDepuisEdition(semaineDepart: number) {
    if (!cellEnEdition) return;
    const [salarieId, dateISO] = cellEnEdition.split("__");
    const roulement = roulementActuelDuSalarie(salarieId);
    if (!roulement) return;
    const lundi = lundiDeLaSemaine(parseDateISO(dateISO));
    const resultat = evaluerProjectionRoulement(editions, salarieId, lundi, roulement, semaineDepart);
    if (resultat.bloque) {
      alert(
        `Impossible d'appliquer le roulement : la semaine du ${formatJourMois(
          parseDateISO(resultat.semaineBloqueeISO!)
        )} contient déjà un code horaire. Effacez-le d'abord (sélectionnez les cases concernées puis Suppr, ou le bouton « Supprimer »).`
      );
      return;
    }
    setEditions(resultat.editions);
    fermerEdition();
  }

  function demarrerEffacement(salarieId: string, dateISO: string) {
    setEnTrainDeSelectionnerEffacement(true);
    setAncreEffacement({ salarieId, dateISO });
    setSurvolEffacement({ salarieId, dateISO });
  }

  function etendreEffacement(salarieId: string, dateISO: string) {
    if (!enTrainDeSelectionnerEffacement) return;
    setSurvolEffacement({ salarieId, dateISO });
  }

  function annulerEffacement() {
    setAncreEffacement(null);
    setSurvolEffacement(null);
    setPositionActionEffacement(null);
  }

  // Coins → rectangle : toutes les cases (salarié, jour) comprises entre
  // l'ancre et le point survolé au relâchement.
  function celluleEnSelectionEffacement(): { salarieId: string; dateISO: string }[] {
    if (!ancreEffacement || !survolEffacement) return [];
    const rA = indexSalarie.get(ancreEffacement.salarieId);
    const rB = indexSalarie.get(survolEffacement.salarieId);
    const cA = indexJour.get(ancreEffacement.dateISO);
    const cB = indexJour.get(survolEffacement.dateISO);
    if (rA === undefined || rB === undefined || cA === undefined || cB === undefined) return [];
    const [rMin, rMax] = [Math.min(rA, rB), Math.max(rA, rB)];
    const [cMin, cMax] = [Math.min(cA, cB), Math.max(cA, cB)];
    const resultat: { salarieId: string; dateISO: string }[] = [];
    for (let r = rMin; r <= rMax; r++) {
      for (let c = cMin; c <= cMax; c++) {
        resultat.push({ salarieId: salariesOrdonnes[r].id, dateISO: formatDateISO(jours[c]) });
      }
    }
    return resultat;
  }

  function demanderConfirmationEffacement() {
    const cellules = celluleEnSelectionEffacement();
    // Toute case pas déjà hachurée compte : un jour de repos "vidé" par un
    // roulement (pas de code travail/évènementiel, donc rien à "supprimer" au
    // sens strict) doit quand même redevenir hachuré avec le reste de la
    // plage effacée, plutôt que de rester blanc (retour client du 17/09).
    const remplies = cellules.filter(({ salarieId, dateISO }) => {
      const cle = `${salarieId}__${dateISO}`;
      const valeur = cle in editions ? editions[cle] : PLANNING_DEMO[cle];
      return valeur !== undefined;
    });
    if (remplies.length === 0) {
      annulerEffacement();
      return;
    }
    const confirme = confirm(
      `Effacer ${remplies.length} case${remplies.length > 1 ? "s" : ""} (codes horaires et jours de repos) ?`
    );
    if (confirme) {
      setEditions((prev) => {
        const nouvelles = { ...prev };
        for (const { salarieId, dateISO } of remplies) {
          // Remet la case en hachurée (jamais remplie), disponible pour la
          // planification — retour client du 17/09.
          nouvelles[`${salarieId}__${dateISO}`] = undefined;
        }
        return nouvelles;
      });
    }
    annulerEffacement();
  }

  useEffect(() => {
    function surRelachementSouris(e: MouseEvent) {
      setEnTrainDeGlisser((etaitEnTrain) => {
        if (!etaitEnTrain) return false;
        setSelectionEnCours((sel) => {
          if (sel && sel.salarieIds.length > 1) {
            setPositionConfirmation({ top: e.clientY + 4, left: e.clientX });
            return sel;
          }
          return null; // simple clic (pas de glisser) : rien à confirmer
        });
        return false;
      });
    }
    document.addEventListener("mouseup", surRelachementSouris);
    return () => document.removeEventListener("mouseup", surRelachementSouris);
  }, []);

  // Fin du glisser d'une sélection d'effacement : si l'ancre et le point
  // relâché diffèrent (vrai glisser), on garde la sélection et on affiche
  // l'action « Supprimer » ; sinon (simple clic) on l'annule et on laisse le
  // clic normal ouvrir le sélecteur de code.
  useEffect(() => {
    function surRelachementSourisEffacement(e: MouseEvent) {
      if (!enTrainDeSelectionnerEffacement) return;
      setEnTrainDeSelectionnerEffacement(false);
      const memeCase =
        ancreEffacement &&
        survolEffacement &&
        ancreEffacement.salarieId === survolEffacement.salarieId &&
        ancreEffacement.dateISO === survolEffacement.dateISO;
      if (memeCase) {
        annulerEffacement();
      } else {
        setPositionActionEffacement({ top: e.clientY + 4, left: e.clientX });
      }
    }
    document.addEventListener("mouseup", surRelachementSourisEffacement);
    return () => document.removeEventListener("mouseup", surRelachementSourisEffacement);
  }, [enTrainDeSelectionnerEffacement, ancreEffacement, survolEffacement]);

  // Touche Suppr/Retour arrière : efface la sélection en cours (si elle porte
  // sur plus d'une case), sauf si l'utilisateur est en train de saisir du
  // texte ailleurs (recherche de code, champ de date...).
  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (!ancreEffacement || !survolEffacement) return;
      if (ancreEffacement.salarieId === survolEffacement.salarieId && ancreEffacement.dateISO === survolEffacement.dateISO)
        return;
      const cible = e.target as HTMLElement | null;
      if (cible && (cible.tagName === "INPUT" || cible.tagName === "TEXTAREA")) return;
      e.preventDefault();
      demanderConfirmationEffacement();
    }
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
    // demanderConfirmationEffacement est recréée à chaque rendu mais lit l'état
    // courant : la ré-abonner sur les mêmes dépendances suffit, pas besoin de useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancreEffacement, survolEffacement]);

  function changerPeriode(deltaSemaines: number) {
    setDebutPeriode((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + deltaSemaines * 7);
      return d;
    });
  }

  const premierJour = jours[0];
  const dernierJour = jours[jours.length - 1];
  const { identite } = useEhpad();
  const valeurActuelleEdition: ValeurCellule | undefined = cellEnEdition
    ? (cellEnEdition in editions ? editions[cellEnEdition] : PLANNING_DEMO[cellEnEdition])
    : undefined;
  const editionAUneValeur = Boolean(
    valeurActuelleEdition?.travail || valeurActuelleEdition?.evenementiel || valeurActuelleEdition?.informatif
  );
  const plagesTravailEdition = valeurActuelleEdition?.travail
    ? (HORAIRE_CODES_PAR_CODE[valeurActuelleEdition.travail.toUpperCase()]?.plages ?? [])
    : [];
  // Cellule jamais remplie dont le salarié a un roulement actuel : proposer de
  // l'appliquer directement depuis le sélecteur de code, sans bloquer la saisie
  // manuelle qui reste l'action la plus courante.
  const roulementPourEdition =
    estAdministrateur && cellEnEdition && valeurActuelleEdition === undefined
      ? roulementActuelDuSalarie(cellEnEdition.split("__")[0])
      : undefined;

  return (
    <div className="flex h-screen flex-col bg-white text-sm text-zinc-900">
      <header className="flex shrink-0 flex-col border-b border-zinc-200">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            {identite.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo dynamique (data URL uploadé), incompatible avec next/image
              <img src={identite.logo} alt="" className="h-7 w-7 rounded object-contain" />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded bg-zinc-200 text-xs font-semibold text-zinc-500">
                {identite.nom.charAt(0)}
              </span>
            )}
            <div className="leading-tight">
              <h1 className="font-semibold text-zinc-800">{identite.nom}</h1>
              <p className="text-[10px] text-zinc-400">Planning</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiltreSalariesBouton
              filtres={filtres}
              onChange={setFiltres}
              services={SERVICES_ORDRE}
              managers={MANAGERS}
              nbResultats={salariesOrdonnes.length}
            />
            <button
              onClick={() => changerPeriode(-1)}
              className="ml-2 rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
              aria-label="Période précédente"
              title="Période précédente"
            >
              ←
            </button>
            <div className="relative">
              <button
                onClick={() => setSelecteurOuvert((v) => !v)}
                className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50"
              >
                {formatJourMois(premierJour)} – {formatJourMois(dernierJour)} {dernierJour.getFullYear()} ▾
              </button>
              {selecteurOuvert && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSelecteurOuvert(false)} />
                  <div className="absolute left-0 top-full z-40 mt-1 rounded border border-zinc-200 bg-white p-3 shadow-lg">
                    <label className="mb-1 block text-xs font-medium text-zinc-600">
                      Choisir une date de début de période
                    </label>
                    <input
                      type="date"
                      defaultValue={formatDateISO(debutPeriode)}
                      onChange={(e) => {
                        if (e.target.value) {
                          setDebutPeriode(lundiDeLaSemaine(parseDateISO(e.target.value)));
                          setSelecteurOuvert(false);
                        }
                      }}
                      className="rounded border border-zinc-300 px-2 py-1 text-sm"
                    />
                    <p className="mt-2 max-w-[16rem] text-xs text-zinc-500">
                      La période affichée ({NB_SEMAINES} semaines) est mémorisée d&apos;une ouverture à
                      l&apos;autre.
                    </p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => changerPeriode(1)}
              className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
              aria-label="Période suivante"
              title="Période suivante"
            >
              →
            </button>
            {estAdministrateur && (
              <Link
                href="/admin/horaires"
                className="ml-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
              >
                Administration
              </Link>
            )}
            <UserMenu />
          </div>
        </div>
        <FiltresActifsChips filtres={filtres} onChange={setFiltres} />
      </header>

      <div className="flex-1 overflow-auto">
        <table className="border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: LARGEUR_COLONNE_SALARIE }} />
            {jours.map((j) => (
              <col key={formatDateISO(j)} style={{ width: LARGEUR_COLONNE }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                className="sticky left-0 top-0 z-30 border border-zinc-200 bg-zinc-100"
                style={{ height: HAUTEUR_LIGNE_ENTETE * 2 }}
                rowSpan={2}
              />
              {jours.map((jour) => {
                const grise = estJourGrise(jour);
                return (
                  <th
                    key={formatDateISO(jour)}
                    className={`sticky top-0 z-10 border border-zinc-200 text-xs font-medium leading-none ${
                      grise ? "bg-zinc-300 text-zinc-600" : "bg-zinc-100 text-zinc-700"
                    }`}
                    style={{ height: HAUTEUR_LIGNE_ENTETE, boxSizing: "border-box" }}
                  >
                    {lettreJour(jour)}
                  </th>
                );
              })}
            </tr>
            <tr>
              {jours.map((jour) => {
                const grise = estJourGrise(jour);
                return (
                  <th
                    key={formatDateISO(jour)}
                    className={`sticky z-10 border border-zinc-200 text-xs font-normal leading-none ${
                      grise ? "bg-zinc-300 text-zinc-600" : "bg-zinc-50 text-zinc-500"
                    }`}
                    style={{
                      top: HAUTEUR_LIGNE_ENTETE,
                      height: HAUTEUR_LIGNE_ENTETE,
                      boxSizing: "border-box",
                    }}
                  >
                    {formatJourMois(jour)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {groupes.map((groupe) => (
              <Fragment key={groupe.service}>
                <tr>
                  <td
                    colSpan={NB_JOURS + 1}
                    className="sticky left-0 z-10 border border-zinc-200 bg-zinc-200 px-2 py-1 text-xs font-bold text-zinc-700"
                  >
                    {groupe.service}
                  </td>
                </tr>
                {groupe.salaries.map((salarie) => (
                  <tr key={salarie.id}>
                    <td className="sticky left-0 z-10 truncate border border-zinc-200 bg-white px-2 py-1 text-xs font-medium">
                      <Link
                        href={`/emargement?salarie=${salarie.id}&mois=${formatAnneeMois(debutPeriode)}`}
                        className="hover:underline"
                        title="Voir la vue émargement de ce salarié"
                      >
                        {salarie.nom} {salarie.prenom}
                      </Link>
                    </td>
                    {jours.map((jour) => {
                      const dateISO = formatDateISO(jour);
                      const cle = `${salarie.id}__${dateISO}`;
                      // {} = jour de repos issu d'un roulement appliqué (motif sans code ce
                      // jour-là) : distinct de undefined (hachurée), qui signifie qu'aucun
                      // code n'est planifié — jamais rempli, ou effacé par l'utilisateur
                      // (Vider la cellule / suppression d'une plage), qui redevient hachurée
                      // plutôt que "vidée" pour rester disponible à la planification.
                      const valeur = cle in editions ? editions[cle] : PLANNING_DEMO[cle];
                      const jamaisRemplie = valeur === undefined;
                      const horaireTravail = valeur?.travail ? HORAIRE_CODES_PAR_CODE[valeur.travail] : undefined;
                      const horaireInformatif = valeur?.informatif
                        ? HORAIRE_CODES_PAR_CODE[valeur.informatif]
                        : undefined;
                      const horaireEvenementiel = valeur?.evenementiel
                        ? HORAIRE_CODES_PAR_CODE[valeur.evenementiel]
                        : undefined;
                      // Type "special" : le travail est effacé de l'affichage (pleine
                      // cellule), ses heures restent comptées. Type "normal" : le travail
                      // reste visible mais barré, sa durée est remplacée par celle de
                      // l'évènement. Type "partiel" : le travail reste normal, le delta
                      // (+/-) est calculé depuis la ou les plages saisies à la volée.
                      const evenementielSpecial = horaireEvenementiel?.typeEvenement === "special";
                      const travailBarre = horaireEvenementiel?.typeEvenement === "normal";
                      const deltaComplement = valeur ? deltaEvenementielCellule(valeur) : undefined;
                      // Couleur de fond/texte de la cellule : le spécial prend le dessus
                      // sur le travail (qu'il efface visuellement) ; à défaut de travail,
                      // l'informatif porte la couleur (cellule sans code de travail).
                      const horaireFond = evenementielSpecial ? horaireEvenementiel : (horaireTravail ?? horaireInformatif);
                      const enEdition = cellEnEdition === cle;
                      const enSelection =
                        jamaisRemplie &&
                        selectionEnCours?.dateISO === dateISO &&
                        selectionEnCours.salarieIds.includes(salarie.id);
                      const enEffacement =
                        estAdministrateur &&
                        ancreEffacement &&
                        survolEffacement &&
                        (() => {
                          const rA = indexSalarie.get(ancreEffacement.salarieId);
                          const rB = indexSalarie.get(survolEffacement.salarieId);
                          const cA = indexJour.get(ancreEffacement.dateISO);
                          const cB = indexJour.get(survolEffacement.dateISO);
                          const r = indexSalarie.get(salarie.id);
                          const c = indexJour.get(dateISO);
                          if (
                            rA === undefined ||
                            rB === undefined ||
                            cA === undefined ||
                            cB === undefined ||
                            r === undefined ||
                            c === undefined
                          )
                            return false;
                          return (
                            r >= Math.min(rA, rB) &&
                            r <= Math.max(rA, rB) &&
                            c >= Math.min(cA, cB) &&
                            c <= Math.max(cA, cB)
                          );
                        })();
                      const infoBulle = valeur?.travail
                        ? `${horaireTravail?.intitule ?? valeur.travail}${
                            horaireEvenementiel ? ` + ${horaireEvenementiel.intitule}` : ""
                          }${horaireInformatif ? ` + ${horaireInformatif.intitule}` : ""}${
                            deltaComplement !== undefined
                              ? ` (${deltaComplement >= 0 ? "+" : ""}${deltaComplement}h)`
                              : ""
                          } — ${heuresReellesCellule(valeur)}h`
                        : jamaisRemplie && estAdministrateur
                          ? "Jamais planifiée — cliquer-glisser sur plusieurs salariés pour appliquer leur roulement"
                          : undefined;

                      return (
                        <td
                          key={cle}
                          onClick={peutEditerPlanning ? (e) => ouvrirEdition(cle, e.currentTarget) : undefined}
                          onMouseDown={
                            !estAdministrateur
                              ? undefined
                              : (e) => {
                                  e.preventDefault();
                                  if (jamaisRemplie) demarrerSelection(salarie.id, dateISO);
                                  else demarrerEffacement(salarie.id, dateISO);
                                }
                          }
                          onMouseEnter={
                            !estAdministrateur
                              ? undefined
                              : () => {
                                  if (jamaisRemplie) etendreSelection(salarie.id, dateISO);
                                  etendreEffacement(salarie.id, dateISO);
                                }
                          }
                          className={`select-none border border-zinc-200 p-0 text-center align-middle ${
                            peutEditerPlanning ? "cursor-pointer" : "cursor-default"
                          }`}
                          style={{
                            backgroundColor: enEdition
                              ? "#eff6ff"
                              : enEffacement
                                ? "#fee2e2"
                                : enSelection
                                  ? "#dbeafe"
                                  : jamaisRemplie
                                    ? "#fafafa"
                                    : horaireFond?.couleurFond ?? "#fff",
                            backgroundImage:
                              !enEdition && !enSelection && jamaisRemplie
                                ? "repeating-linear-gradient(45deg, #e4e4e7 0px, #e4e4e7 4px, transparent 4px, transparent 10px)"
                                : undefined,
                            color: horaireFond?.couleurTexte ?? "#000",
                            outline: enEdition
                              ? "2px solid #60a5fa"
                              : enEffacement
                                ? "2px solid #ef4444"
                                : enSelection
                                  ? "2px solid #3b82f6"
                                  : undefined,
                            outlineOffset: enEdition || enEffacement || enSelection ? "-2px" : undefined,
                          }}
                          title={infoBulle}
                        >
                          {evenementielSpecial ? (
                            <span className="block px-1 pt-0.5 text-xs font-semibold leading-tight">
                              {valeur?.evenementiel}
                            </span>
                          ) : (
                            <>
                              {valeur?.travail && (
                                <span
                                  className="block px-1 pt-0.5 text-xs font-semibold leading-tight"
                                  style={travailBarre ? { textDecoration: "line-through" } : undefined}
                                >
                                  {valeur.travail}
                                </span>
                              )}
                              {valeur?.evenementiel && (
                                <span
                                  className="mx-auto mt-0.5 block w-fit rounded-sm px-1 text-[10px] font-bold leading-tight"
                                  style={{
                                    backgroundColor: horaireEvenementiel?.couleurFond,
                                    color: horaireEvenementiel?.couleurTexte,
                                  }}
                                >
                                  {valeur.evenementiel}
                                </span>
                              )}
                            </>
                          )}
                          {valeur?.informatif &&
                            (valeur.travail ? (
                              <span
                                className="mx-auto mt-0.5 block w-fit rounded-sm px-1 text-[10px] font-bold leading-tight"
                                style={{
                                  backgroundColor: horaireInformatif?.couleurFond,
                                  color: horaireInformatif?.couleurTexte,
                                }}
                              >
                                {valeur.informatif}
                              </span>
                            ) : (
                              <span className="block px-1 pt-0.5 text-xs font-semibold leading-tight">
                                {valeur.informatif}
                              </span>
                            ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {cellEnEdition && positionEdition && (
        <>
          <div className="fixed inset-0 z-40" onClick={fermerEdition} />
          <HoraireCodeSelector
            position={positionEdition}
            aUneValeur={editionAUneValeur}
            valeurActuelle={valeurActuelleEdition}
            actionRoulement={
              roulementPourEdition
                ? {
                    nomRoulement: roulementPourEdition.nom,
                    nbSemaines: roulementPourEdition.nbSemaines,
                    onAppliquer: appliquerRoulementDepuisEdition,
                  }
                : undefined
            }
            onChoisir={(code) => choisirCode(cellEnEdition, code)}
            onChoisirComplement={(code, plages) => choisirCodeComplement(cellEnEdition, code, plages)}
            plagesTravail={plagesTravailEdition}
            onFermer={fermerEdition}
          />
        </>
      )}

      {selectionEnCours && positionConfirmation && selectionEnCours.salarieIds.length > 1 && (
        <>
          <div className="fixed inset-0 z-40" onClick={annulerSelection} />
          <div
            className="fixed z-50 w-72 rounded border border-zinc-200 bg-white p-3 text-xs shadow-lg"
            style={{ top: positionConfirmation.top, left: positionConfirmation.left }}
          >
            <p className="mb-2 font-medium text-zinc-700">
              {selectionEnCours.salarieIds.length} salarié(s) sélectionné(s) — semaine du{" "}
              {formatJourMois(lundiDeLaSemaine(parseDateISO(selectionEnCours.dateISO)))}
            </p>
            {(() => {
              const lundi = lundiDeLaSemaine(parseDateISO(selectionEnCours.dateISO));
              // Toujours à partir de la semaine 1 du motif de chacun : pas de
              // sélecteur de semaine de départ ici (contrairement au raccourci
              // mono-salarié), les roulements des salariés sélectionnés
              // pouvant avoir des longueurs différentes — retour client du
              // 22/09.
              const evaluation = selectionEnCours.salarieIds.map((id) => {
                const salarie = SALARIES.find((s) => s.id === id)!;
                const roulement = roulementActuelDuSalarie(id);
                const resultat = roulement
                  ? evaluerProjectionRoulement(editions, id, lundi, roulement)
                  : undefined;
                return { salarie, roulement, bloque: resultat?.bloque ?? false };
              });
              const applicables = evaluation.filter((e) => e.roulement && !e.bloque);
              const bloques = evaluation.filter((e) => e.roulement && e.bloque);
              const sansRoulement = evaluation.filter((e) => !e.roulement);
              return (
                <>
                  {applicables.length > 0 && (
                    <ul className="mb-2 space-y-0.5 text-zinc-600">
                      {applicables.map(({ salarie, roulement }) => (
                        <li key={salarie.id}>
                          {salarie.nom} {salarie.prenom} —{" "}
                          <span className="font-medium">{roulement!.nom}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {bloques.length > 0 && (
                    <p className="mb-2 text-[11px] text-red-600">
                      Semaine déjà planifiée, effacez d&apos;abord (ignorés) :{" "}
                      {bloques.map(({ salarie }) => `${salarie.nom} ${salarie.prenom}`).join(", ")}
                    </p>
                  )}
                  {sansRoulement.length > 0 && (
                    <p className="mb-2 text-[11px] text-amber-600">
                      Sans roulement assigné (ignorés) :{" "}
                      {sansRoulement.map(({ salarie }) => `${salarie.nom} ${salarie.prenom}`).join(", ")}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={annulerSelection}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={appliquerSelection}
                      disabled={applicables.length === 0}
                      className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Appliquer le roulement de chacun
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </>
      )}

      {estAdministrateur && ancreEffacement && survolEffacement && positionActionEffacement && (
        <>
          <div className="fixed inset-0 z-40" onClick={annulerEffacement} />
          <div
            className="fixed z-50 w-56 rounded border border-zinc-200 bg-white p-3 text-xs shadow-lg"
            style={{ top: positionActionEffacement.top, left: positionActionEffacement.left }}
          >
            <p className="mb-2 font-medium text-zinc-700">
              {celluleEnSelectionEffacement().length} case(s) sélectionnée(s)
            </p>
            <p className="mb-2 text-[11px] text-zinc-400">
              Touche Suppr/Retour arrière, ou bouton ci-dessous.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={annulerEffacement}
                className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
              >
                Annuler
              </button>
              <button
                onClick={demanderConfirmationEffacement}
                className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
