"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  MANAGERS,
  GROUPES_ROULEMENT,
  ROULEMENTS_DEMO,
  AFFECTATIONS_ROULEMENT_DEMO,
  CORRESPONDANCE_SALARIE_FICHE_DEMO,
  affectationActuelle,
  ficheDuSalarie,
  type Roulement,
  type Salarie,
  type ProfilUtilisateur,
} from "@/lib/mock-data";
import {
  FiltreSalariesBouton,
  FiltresActifsChips,
  filtresVides,
  type FiltresAvances,
} from "@/components/FiltreSalariesAvance";
import {
  estCodeSuperposable,
  heuresReellesCellule,
  deltaEvenementielCellule,
  type HoraireCode,
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
import HoraireCodeSelector, { type PositionSelecteur } from "@/components/HoraireCodeSelector";
import { chargerPlanningReel, enregistrerJournees, effacerJournees } from "@/app/planning-actions";

// Fenêtre visible toujours à 4 semaines (retour client du 24/09) ; le
// nombre de semaines chargées (au-delà, avec ascenseur horizontal) est lui
// configurable — cf. NB_SEMAINES_CHARGEES_MIN/MAX ci-dessous. Objectif :
// limiter la fréquence des accès BDD une fois le backend réel branché, en
// chargeant plusieurs semaines d'un coup plutôt qu'une seule à chaque clic
// sur une flèche de navigation.
const NB_SEMAINES_VISIBLES = 4;
const NB_SEMAINES_CHARGEES_DEFAUT = 4;
const NB_SEMAINES_CHARGEES_MIN = 4;
const NB_SEMAINES_CHARGEES_MAX = 26;
const LARGEUR_COLONNE = 44;
const LARGEUR_COLONNE_SALARIE = 200;
const LARGEUR_SEMAINE = 7 * LARGEUR_COLONNE;
const LARGEUR_VISIBLE = LARGEUR_COLONNE_SALARIE + NB_SEMAINES_VISIBLES * LARGEUR_SEMAINE;
const HAUTEUR_LIGNE_ENTETE = 28;
const CLE_STOCKAGE_PERIODE = "planning-ehpad:periode-debut";
const CLE_STOCKAGE_NB_SEMAINES = "planning-ehpad:nb-semaines-chargees";

// Vue par défaut : septembre 2026, pour une démo cohérente quelle que soit la
// date réelle de consultation.
const PERIODE_PAR_DEFAUT = new Date(2026, 8, 1);

// Distinction visuelle jour férié / week-end (retour client du 24/09) : un
// jour férié tombant un week-end reste marqué férié (priorité), pas juste
// grisé comme un week-end ordinaire.
type ClasseJour = "ferie" | "weekend" | "normal";

// Branché sur le vrai backend le 25/09 (story #35) : salariés, services,
// identité EHPAD, utilisateur connecté, codes horaires et jours fériés
// viennent maintenant de la vraie base (via le Server Component
// src/app/page.tsx), scopés par RLS à l'établissement de l'utilisateur — un
// EHPAD tout juste créé affiche donc une grille vide, sans salarié, plutôt
// que la démo mock. Le contenu des cases (édition/lecture) est branché sur
// la table journee (chargement client via chargerPlanningReel, écriture via
// enregistrerJournees/effacerJournees, cf. src/app/planning-actions.ts —
// nécessairement client, pas côté serveur au premier rendu : la période
// affichée par défaut dépend de préférences mémorisées en localStorage,
// jamais connues avant l'hydratation). Seule l'application d'un roulement
// (raccourci sur une case vide, action groupée) tourne encore sur les
// données de démo (`ROULEMENTS_DEMO`/`AFFECTATIONS_ROULEMENT_DEMO`) : dépend
// de l'assignation réelle d'un roulement à un salarié, pas encore branchée
// (écran Salariés), et d'une nouvelle RPC `appliquer_roulement` à écrire —
// incrément suivant.
export default function PlanningGrid({
  salaries,
  servicesOrdre,
  codesHoraires,
  joursFeries,
  ehpad,
  utilisateur,
}: {
  salaries: Salarie[];
  servicesOrdre: string[];
  codesHoraires: HoraireCode[];
  joursFeries: string[];
  ehpad: { nom: string; logo: string | null };
  utilisateur: ProfilUtilisateur;
}) {
  const codesParCode = useMemo(
    () => Object.fromEntries(codesHoraires.map((h) => [h.code.toUpperCase(), h])),
    [codesHoraires]
  );
  const joursFeriesSet = useMemo(() => new Set(joursFeries), [joursFeries]);
  function classeEnTeteJour(date: Date): ClasseJour {
    if (joursFeriesSet.has(formatDateISO(date))) return "ferie";
    if (estWeekend(date)) return "weekend";
    return "normal";
  }
  const [debutPeriode, setDebutPeriode] = useState(() => lundiDeLaSemaine(PERIODE_PAR_DEFAUT));
  // Nombre de semaines chargées d'un coup (≥ semaines visibles) — réglable
  // de 4 à n, cf. NB_SEMAINES_CHARGEES_MIN/MAX. Par défaut égal aux semaines
  // visibles : pas d'ascenseur horizontal tant que l'utilisateur n'a pas
  // délibérément augmenté ce nombre.
  const [nbSemainesChargees, setNbSemainesChargees] = useState(NB_SEMAINES_CHARGEES_DEFAUT);
  const jours = useMemo(
    () => genererPeriode(debutPeriode, nbSemainesChargees * 7),
    [debutPeriode, nbSemainesChargees]
  );

  // Contenu réel des cases (table journee), chargé par fenêtre affichée —
  // jamais côté serveur au premier rendu (cf. commentaire plus haut). Un
  // Map de fenêtres déjà chargées évite de recharger deux fois la même
  // période en naviguant dans les deux sens ; ne grandit jamais au-delà de
  // la session, mais reste borné par le nombre de périodes réellement
  // visitées.
  const [planningBase, setPlanningBase] = useState<Record<string, ValeurCellule>>({});
  const fenetresChargeesRef = useRef<Set<string>>(new Set());
  const [chargementPlanning, setChargementPlanning] = useState(false);
  const [erreurPersistance, setErreurPersistance] = useState<string | null>(null);
  const [, demarrerPersistance] = useTransition();

  useEffect(() => {
    const cleFenetre = `${formatDateISO(debutPeriode)}_${nbSemainesChargees}`;
    if (fenetresChargeesRef.current.has(cleFenetre)) return;
    fenetresChargeesRef.current.add(cleFenetre);
    const debut = formatDateISO(debutPeriode);
    const fin = formatDateISO(genererPeriode(debutPeriode, nbSemainesChargees * 7).at(-1)!);
    setChargementPlanning(true);
    chargerPlanningReel(debut, fin)
      .then((resultat) => {
        if (resultat.planning) {
          setPlanningBase((prev) => ({ ...prev, ...resultat.planning }));
        } else if (resultat.error) {
          setErreurPersistance(resultat.error);
        }
      })
      .finally(() => setChargementPlanning(false));
  }, [debutPeriode, nbSemainesChargees]);

  // Conteneur scrollable horizontalement : les flèches de navigation
  // avancent/reculent d'une semaine dans le lot déjà chargé (gratuit, pas de
  // rechargement) tant que c'est possible, et ne déclenchent un changement
  // de période (nouveau lot) qu'une fois le bord du lot atteint — cf.
  // allerSemaine ci-dessous. scrollIntentionRef mémorise, juste avant un tel
  // changement, si le nouveau lot doit s'afficher depuis son début (flèche
  // suivante) ou sa fin (flèche précédente).
  const conteneurScrollRef = useRef<HTMLDivElement>(null);
  const scrollIntentionRef = useRef<"debut" | "fin">("debut");
  useEffect(() => {
    const conteneur = conteneurScrollRef.current;
    if (!conteneur) return;
    conteneur.scrollLeft = scrollIntentionRef.current === "fin" ? conteneur.scrollWidth : 0;
    scrollIntentionRef.current = "debut";
  }, [debutPeriode, nbSemainesChargees]);
  // undefined = case hachurée (jamais remplie), y compris quand une case est
  // effacée : l'effacement remet la case en attente de planification plutôt
  // que de la marquer comme "vidée" (retour client du 17/09).
  const [editions, setEditions] = useState<Record<string, ValeurCellule | undefined>>({});
  const [cellEnEdition, setCellEnEdition] = useState<string | null>(null);
  const [positionEdition, setPositionEdition] = useState<PositionSelecteur | null>(null);
  const [selecteurOuvert, setSelecteurOuvert] = useState(false);
  const [filtres, setFiltres] = useState<FiltresAvances>(filtresVides);
  // Sélection rectangulaire par glisser, sur tout type de case (vide ou déjà
  // remplie) — fonctionnalité admin. Le menu qui en résulte propose
  // d'appliquer un code, d'effacer, et (si la sélection ne porte que sur un
  // seul jour) d'appliquer le roulement actuel de chaque salarié sélectionné
  // — retour client du 23/09 : unifie les deux mécanismes distincts qui
  // existaient auparavant (l'un ne fonctionnant que sur les cases vides,
  // l'autre que sur les cases remplies).
  const [enTrainDeSelectionner, setEnTrainDeSelectionner] = useState(false);
  const [ancreSelection, setAncreSelection] = useState<{ salarieId: string; dateISO: string } | null>(
    null
  );
  const [survolSelection, setSurvolSelection] = useState<{ salarieId: string; dateISO: string } | null>(
    null
  );
  const [positionActionSelection, setPositionActionSelection] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [selecteurCodeMultipleOuvert, setSelecteurCodeMultipleOuvert] = useState(false);

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

  // Mémorisation du nombre de semaines chargées, même logique que la période.
  useEffect(() => {
    try {
      const enregistre = localStorage.getItem(CLE_STOCKAGE_NB_SEMAINES);
      if (!enregistre) return;
      const borne = Math.min(
        NB_SEMAINES_CHARGEES_MAX,
        Math.max(NB_SEMAINES_CHARGEES_MIN, Number(enregistre))
      );
      if (Number.isFinite(borne)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNbSemainesChargees(borne);
      }
    } catch {
      // localStorage indisponible : on garde la valeur par défaut
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CLE_STOCKAGE_NB_SEMAINES, String(nbSemainesChargees));
    } catch {
      // ignoré : la mémorisation est un confort, pas une exigence bloquante
    }
  }, [nbSemainesChargees]);

  // "Avec/sans planning" dépend de la période actuellement affichée (retour
  // client du 17/09) : au moins un jour de la période a un code travail ou
  // évènementiel, en tenant compte des éditions en cours (même résolution
  // que le rendu des cases : édition locale prioritaire sur la démo).
  function salarieAUnPlanningSurPeriode(salarieId: string): boolean {
    return jours.some((jour) => {
      const cle = `${salarieId}__${formatDateISO(jour)}`;
      const valeur = cle in editions ? editions[cle] : planningBase[cle];
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

    const besoinDeFiche =
      filtres.contrat.size > 0 ||
      filtres.presence.size > 0 ||
      filtres.manager.size > 0 ||
      filtres.groupeRoulement.size > 0;
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
      if (filtres.groupeRoulement.size > 0 && !filtres.groupeRoulement.has(fiche.groupeRoulement)) return false;
    }

    if (filtres.planning.size > 0) {
      const etat = salarieAUnPlanningSurPeriode(salarie.id) ? "avec" : "sans";
      if (!filtres.planning.has(etat)) return false;
    }

    return true;
  }

  const groupes = useMemo(() => {
    const salariesFiltres = salaries.filter(salarieCorrespondAuxFiltres);
    const parService = new Map<string, Salarie[]>();
    for (const salarie of salariesFiltres) {
      const liste = parService.get(salarie.service) ?? [];
      liste.push(salarie);
      parService.set(salarie.service, liste);
    }
    return servicesOrdre.filter((s) => parService.has(s)).map((service) => ({
      service,
      salaries: parService.get(service)!,
    }));
    // salarieCorrespondAuxFiltres est recréée à chaque rendu mais lit filtres/
    // jours/editions au moment de l'appel : les lister explicitement suffit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtres, jours, editions, salaries, servicesOrdre]);

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
  const estAdministrateur = utilisateur.typeUtilisateur === "Administrateur";
  // Le Manager peut modifier le planning (poser/effacer un code sur une case)
  // mais pas la sélection multiple / l'application groupée de roulement, ni
  // le menu Administration — réservés à l'Administrateur (retour client du
  // 23/09 : nouveau rôle Manager). L'Utilisateur reste en lecture seule.
  const peutEditerPlanning = estAdministrateur || utilisateur.typeUtilisateur === "Manager";

  function ouvrirEdition(cle: string, cellule: HTMLElement) {
    const rect = cellule.getBoundingClientRect();
    setPositionEdition({ top: rect.bottom + 2, left: rect.left, width: rect.width });
    setCellEnEdition(cle);
  }

  function fermerEdition() {
    setCellEnEdition(null);
    setPositionEdition(null);
  }

  // Fusionne un code choisi sur une valeur de case existante — logique
  // partagée entre l'édition d'une seule case et l'application groupée sur
  // une sélection multiple (retour client du 23/09).
  function fusionnerCode(actuelle: ValeurCellule, codeChoisi: string): ValeurCellule {
    const horaireChoisi = codesParCode[codeChoisi.toUpperCase()];
    if (horaireChoisi?.categorie === "informatif") {
      return { ...actuelle, informatif: codeChoisi };
    }
    if (estCodeSuperposable(codeChoisi, codesParCode)) {
      return { ...actuelle, evenementiel: codeChoisi, evenementielPlages: undefined };
    }
    return { travail: codeChoisi }; // code travail : remplace tout (travail, informatif, évènementiel)
  }

  // Écriture optimiste : la case change à l'écran immédiatement, la
  // persistance réelle part en tâche de fond ; en cas d'échec (droits
  // insuffisants, erreur réseau...) la case revient à sa valeur d'avant
  // l'édition et un message d'erreur s'affiche — jamais d'état affiché qui
  // ne reflète pas, à terme, ce qui est réellement en base.
  function choisirCode(cle: string, codeChoisi: string | null) {
    const [salarieId, dateISO] = cle.split("__");
    let precedente: ValeurCellule | undefined;
    let nouvelle: ValeurCellule | undefined;
    setEditions((prev) => {
      precedente = cle in prev ? prev[cle] : planningBase[cle];
      if (codeChoisi === null) {
        // Remet la case en hachurée (jamais remplie) plutôt que "vidée" :
        // l'effacement doit rendre la case disponible pour la planification.
        nouvelle = undefined;
        return { ...prev, [cle]: undefined };
      }
      const actuelle = precedente ?? {};
      nouvelle = fusionnerCode(actuelle, codeChoisi);
      return { ...prev, [cle]: nouvelle };
    });
    fermerEdition();
    demarrerPersistance(async () => {
      const resultat =
        nouvelle === undefined
          ? await effacerJournees([{ salarieId, dateISO }])
          : await enregistrerJournees([{ salarieId, dateISO, valeur: nouvelle }]);
      if (resultat.error) {
        setErreurPersistance(resultat.error);
        setEditions((prev) => ({ ...prev, [cle]: precedente }));
      }
    });
  }

  // Évènement "complement" (à la volée) : la ou les plages horaires
  // viennent d'être saisies au moment de positionner l'évènement — cf.
  // retour client du 17/09 (une plage), étendu le 22/09 (plusieurs plages
  // possibles le même jour, ex. arrivée anticipée + départ tardif).
  function choisirCodeComplement(cle: string, codeChoisi: string, plages: Plage[]) {
    const [salarieId, dateISO] = cle.split("__");
    let precedente: ValeurCellule | undefined;
    let nouvelle!: ValeurCellule;
    setEditions((prev) => {
      precedente = cle in prev ? prev[cle] : planningBase[cle];
      const actuelle = precedente ?? {};
      nouvelle = { ...actuelle, evenementiel: codeChoisi, evenementielPlages: plages };
      return { ...prev, [cle]: nouvelle };
    });
    fermerEdition();
    demarrerPersistance(async () => {
      const resultat = await enregistrerJournees([{ salarieId, dateISO, valeur: nouvelle }]);
      if (resultat.error) {
        setErreurPersistance(resultat.error);
        setEditions((prev) => ({ ...prev, [cle]: precedente }));
      }
    });
  }

  function roulementActuelDuSalarie(salarieId: string): Roulement | undefined {
    const ficheId = CORRESPONDANCE_SALARIE_FICHE_DEMO[salarieId];
    if (!ficheId) return undefined;
    const affectations = AFFECTATIONS_ROULEMENT_DEMO[ficheId] ?? [];
    const actuelle = affectationActuelle(affectations, formatDateISO(new Date()));
    return actuelle ? ROULEMENTS_DEMO.find((r) => r.id === actuelle.roulementId) : undefined;
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
      return cle in editionsBase ? editionsBase[cle] : planningBase[cle];
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

  function demarrerSelection(salarieId: string, dateISO: string) {
    setEnTrainDeSelectionner(true);
    setAncreSelection({ salarieId, dateISO });
    setSurvolSelection({ salarieId, dateISO });
  }

  function etendreSelection(salarieId: string, dateISO: string) {
    if (!enTrainDeSelectionner) return;
    setSurvolSelection({ salarieId, dateISO });
  }

  function annulerSelection() {
    setAncreSelection(null);
    setSurvolSelection(null);
    setPositionActionSelection(null);
    setSelecteurCodeMultipleOuvert(false);
  }

  // Coins → rectangle : toutes les cases (salarié, jour) comprises entre
  // l'ancre et le point survolé au relâchement. Fonctionne sur tout type de
  // case (vide ou remplie) — retour client du 23/09.
  function celluleEnSelection(): { salarieId: string; dateISO: string }[] {
    if (!ancreSelection || !survolSelection) return [];
    const rA = indexSalarie.get(ancreSelection.salarieId);
    const rB = indexSalarie.get(survolSelection.salarieId);
    const cA = indexJour.get(ancreSelection.dateISO);
    const cB = indexJour.get(survolSelection.dateISO);
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

  function valeurActuelleDe(salarieId: string, dateISO: string): ValeurCellule {
    const cle = `${salarieId}__${dateISO}`;
    return (cle in editions ? editions[cle] : planningBase[cle]) ?? {};
  }

  // Applique un même code à toutes les cases de la sélection — logique de
  // fusion identique à l'édition d'une seule case, cellule par cellule
  // (retour client du 23/09). Les garde-fous informatif/évènementiel sont
  // vérifiés en amont par le sélecteur (options masquées si la sélection
  // n'est pas homogène), donc cette fonction peut fusionner sans reste de
  // contrôle à faire ici.
  function appliquerCodeSelectionMultiple(codeChoisi: string) {
    const precedentes: Record<string, ValeurCellule | undefined> = {};
    const lignes: { salarieId: string; dateISO: string; valeur: ValeurCellule }[] = [];
    setEditions((prev) => {
      let nouvelles = prev;
      for (const { salarieId, dateISO } of celluleEnSelection()) {
        const cle = `${salarieId}__${dateISO}`;
        precedentes[cle] = cle in nouvelles ? nouvelles[cle] : planningBase[cle];
        const actuelle = precedentes[cle] ?? {};
        const nouvelle = fusionnerCode(actuelle, codeChoisi);
        lignes.push({ salarieId, dateISO, valeur: nouvelle });
        nouvelles = { ...nouvelles, [cle]: nouvelle };
      }
      return nouvelles;
    });
    annulerSelection();
    demarrerPersistance(async () => {
      const resultat = await enregistrerJournees(lignes);
      if (resultat.error) {
        setErreurPersistance(resultat.error);
        setEditions((prev) => ({ ...prev, ...precedentes }));
      }
    });
  }

  // N'a de sens que si la sélection ne porte que sur un seul jour (plusieurs
  // salariés, même colonne) : applique le roulement actuel de chacun,
  // toujours depuis sa semaine 1 (pas de sélecteur de semaine de départ ici,
  // contrairement au raccourci mono-salarié) — les salariés sélectionnés
  // peuvent avoir des roulements de longueurs différentes, un même choix de
  // semaine de départ serait ambigu d'un salarié à l'autre (retour client du
  // 22/09).
  function appliquerRoulementGroupe() {
    if (!ancreSelection || !survolSelection || ancreSelection.dateISO !== survolSelection.dateISO) return;
    const lundi = lundiDeLaSemaine(parseDateISO(ancreSelection.dateISO));
    const salarieIds = celluleEnSelection().map((c) => c.salarieId);
    setEditions((prev) => {
      let nouvelles = prev;
      for (const salarieId of salarieIds) {
        const roulement = roulementActuelDuSalarie(salarieId);
        if (!roulement) continue;
        nouvelles = evaluerProjectionRoulement(nouvelles, salarieId, lundi, roulement).editions;
      }
      return nouvelles;
    });
    annulerSelection();
  }

  // Pas de confirmation : ni l'effacement d'une seule case (bouton "Vider la
  // cellule") ni le remplacement par un code travail n'en demandent, la
  // sélection multiple ne fait pas exception (retour client du 23/09).
  function effacerSelection() {
    const cellules = celluleEnSelection();
    // Toute case pas déjà hachurée compte : un jour de repos "vidé" par un
    // roulement (pas de code travail/évènementiel, donc rien à "supprimer" au
    // sens strict) doit quand même redevenir hachuré avec le reste de la
    // plage effacée, plutôt que de rester blanc (retour client du 17/09).
    const remplies = cellules.filter(({ salarieId, dateISO }) => {
      const cle = `${salarieId}__${dateISO}`;
      const valeur = cle in editions ? editions[cle] : planningBase[cle];
      return valeur !== undefined;
    });
    if (remplies.length > 0) {
      const precedentes: Record<string, ValeurCellule | undefined> = {};
      setEditions((prev) => {
        const nouvelles = { ...prev };
        for (const { salarieId, dateISO } of remplies) {
          const cle = `${salarieId}__${dateISO}`;
          precedentes[cle] = cle in nouvelles ? nouvelles[cle] : planningBase[cle];
          // Remet la case en hachurée (jamais remplie), disponible pour la
          // planification — retour client du 17/09.
          nouvelles[cle] = undefined;
        }
        return nouvelles;
      });
      demarrerPersistance(async () => {
        const resultat = await effacerJournees(remplies);
        if (resultat.error) {
          setErreurPersistance(resultat.error);
          setEditions((prev) => ({ ...prev, ...precedentes }));
        }
      });
    }
    annulerSelection();
  }

  // Fin du glisser d'une sélection : si l'ancre et le point relâché
  // diffèrent (vrai glisser), on garde la sélection et on affiche le menu
  // d'action ; sinon (simple clic) on l'annule et on laisse le clic normal
  // ouvrir le sélecteur de code sur cette seule case.
  useEffect(() => {
    function surRelachementSouris(e: MouseEvent) {
      if (!enTrainDeSelectionner) return;
      setEnTrainDeSelectionner(false);
      const memeCase =
        ancreSelection &&
        survolSelection &&
        ancreSelection.salarieId === survolSelection.salarieId &&
        ancreSelection.dateISO === survolSelection.dateISO;
      if (memeCase) {
        annulerSelection();
      } else {
        setPositionActionSelection({ top: e.clientY + 4, left: e.clientX });
      }
    }
    document.addEventListener("mouseup", surRelachementSouris);
    return () => document.removeEventListener("mouseup", surRelachementSouris);
  }, [enTrainDeSelectionner, ancreSelection, survolSelection]);

  // Touche Suppr/Retour arrière : efface la sélection en cours (si elle porte
  // sur plus d'une case), sauf si l'utilisateur est en train de saisir du
  // texte ailleurs (recherche de code, champ de date...).
  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (!ancreSelection || !survolSelection) return;
      if (ancreSelection.salarieId === survolSelection.salarieId && ancreSelection.dateISO === survolSelection.dateISO)
        return;
      const cible = e.target as HTMLElement | null;
      if (cible && (cible.tagName === "INPUT" || cible.tagName === "TEXTAREA")) return;
      e.preventDefault();
      effacerSelection();
    }
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
    // effacerSelection est recréée à chaque rendu mais lit l'état courant :
    // la ré-abonner sur les mêmes dépendances suffit, pas besoin de useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancreSelection, survolSelection]);

  function changerPeriode(deltaSemaines: number) {
    setDebutPeriode((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + deltaSemaines * 7);
      return d;
    });
  }

  // Avance/recule d'une semaine : défile dans le lot déjà chargé quand c'est
  // possible (gratuit, aucun rechargement), et ne change de période (nouveau
  // lot, cf. changerPeriode) qu'une fois le bord du lot atteint — c'est ce
  // qui rend le chargement de plusieurs semaines à la fois utile une fois le
  // backend réel branché.
  function allerSemaine(direction: 1 | -1) {
    const conteneur = conteneurScrollRef.current;
    if (!conteneur) {
      changerPeriode(direction);
      return;
    }
    const scrollMax = conteneur.scrollWidth - conteneur.clientWidth;
    if (direction === 1) {
      if (conteneur.scrollLeft < scrollMax - 1) {
        conteneur.scrollBy({ left: LARGEUR_SEMAINE, behavior: "smooth" });
      } else {
        scrollIntentionRef.current = "debut";
        changerPeriode(nbSemainesChargees);
      }
    } else {
      if (conteneur.scrollLeft > 1) {
        conteneur.scrollBy({ left: -LARGEUR_SEMAINE, behavior: "smooth" });
      } else {
        scrollIntentionRef.current = "fin";
        changerPeriode(-nbSemainesChargees);
      }
    }
  }

  const premierJour = jours[0];
  const dernierJour = jours[jours.length - 1];
  const valeurActuelleEdition: ValeurCellule | undefined = cellEnEdition
    ? (cellEnEdition in editions ? editions[cellEnEdition] : planningBase[cellEnEdition])
    : undefined;
  const editionAUneValeur = Boolean(
    valeurActuelleEdition?.travail || valeurActuelleEdition?.evenementiel || valeurActuelleEdition?.informatif
  );
  const plagesTravailEdition = valeurActuelleEdition?.travail
    ? (codesParCode[valeurActuelleEdition.travail.toUpperCase()]?.plages ?? [])
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
            {ehpad.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo dynamique (data URL uploadé), incompatible avec next/image
              <img src={ehpad.logo} alt="" className="h-7 w-7 rounded object-contain" />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded bg-zinc-200 text-xs font-semibold text-zinc-500">
                {ehpad.nom.charAt(0)}
              </span>
            )}
            <div className="leading-tight">
              <h1 className="font-semibold text-zinc-800">{ehpad.nom}</h1>
              <p className="text-[10px] text-zinc-400">
                {chargementPlanning ? "Planning — chargement…" : "Planning"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiltreSalariesBouton
              filtres={filtres}
              onChange={setFiltres}
              services={servicesOrdre}
              managers={MANAGERS}
              groupesRoulement={GROUPES_ROULEMENT}
              nbResultats={salariesOrdonnes.length}
            />
            <button
              onClick={() => allerSemaine(-1)}
              className="ml-2 rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
              aria-label="Semaine précédente"
              title="Semaine précédente"
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
                    <label className="mb-1 mt-3 block text-xs font-medium text-zinc-600">
                      Nombre de semaines chargées
                    </label>
                    <input
                      type="number"
                      min={NB_SEMAINES_CHARGEES_MIN}
                      max={NB_SEMAINES_CHARGEES_MAX}
                      value={nbSemainesChargees}
                      onChange={(e) => {
                        const brut = Number(e.target.value);
                        if (!Number.isFinite(brut)) return;
                        const borne = Math.min(
                          NB_SEMAINES_CHARGEES_MAX,
                          Math.max(NB_SEMAINES_CHARGEES_MIN, Math.round(brut))
                        );
                        setNbSemainesChargees(borne);
                      }}
                      className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                    />
                    <p className="mt-2 max-w-[16rem] text-xs text-zinc-500">
                      La fenêtre visible reste toujours à {NB_SEMAINES_VISIBLES} semaines, avec un
                      ascenseur horizontal pour parcourir les semaines chargées en plus. Ces réglages
                      sont mémorisés d&apos;une ouverture à l&apos;autre.
                    </p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => allerSemaine(1)}
              className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
              aria-label="Semaine suivante"
              title="Semaine suivante"
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
            <UserMenu utilisateur={utilisateur} />
          </div>
        </div>
        <FiltresActifsChips filtres={filtres} onChange={setFiltres} />
      </header>

      {erreurPersistance && (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <span>{erreurPersistance}</span>
            <button
              onClick={() => setErreurPersistance(null)}
              className="shrink-0 text-red-400 hover:text-red-600"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div ref={conteneurScrollRef} className="flex-1 overflow-auto" style={{ maxWidth: LARGEUR_VISIBLE }}>
        <table
          className="border-collapse"
          style={{
            tableLayout: "fixed",
            // Largeur explicite indispensable ici : sans elle, table-layout
            // fixed comprime quand même les colonnes pour tenir dans le
            // conteneur (au lieu de déborder), ce qui empêchait l'ascenseur
            // horizontal d'apparaître quand plus de semaines sont chargées
            // que de semaines visibles.
            width: LARGEUR_COLONNE_SALARIE + jours.length * LARGEUR_COLONNE,
          }}
        >
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
                const classe = classeEnTeteJour(jour);
                return (
                  <th
                    key={formatDateISO(jour)}
                    className={`sticky top-0 z-10 border border-zinc-200 text-xs font-medium leading-none ${
                      classe === "ferie"
                        ? "bg-amber-200 text-amber-900"
                        : classe === "weekend"
                          ? "bg-zinc-300 text-zinc-600"
                          : "bg-zinc-100 text-zinc-700"
                    }`}
                    style={{ height: HAUTEUR_LIGNE_ENTETE, boxSizing: "border-box" }}
                    title={classe === "ferie" ? "Jour férié" : undefined}
                  >
                    {lettreJour(jour)}
                  </th>
                );
              })}
            </tr>
            <tr>
              {jours.map((jour) => {
                const classe = classeEnTeteJour(jour);
                return (
                  <th
                    key={formatDateISO(jour)}
                    className={`sticky z-10 border border-zinc-200 text-xs font-normal leading-none ${
                      classe === "ferie"
                        ? "bg-amber-100 text-amber-800"
                        : classe === "weekend"
                          ? "bg-zinc-300 text-zinc-600"
                          : "bg-zinc-50 text-zinc-500"
                    }`}
                    style={{
                      top: HAUTEUR_LIGNE_ENTETE,
                      height: HAUTEUR_LIGNE_ENTETE,
                      boxSizing: "border-box",
                    }}
                    title={classe === "ferie" ? "Jour férié" : undefined}
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
                    colSpan={jours.length + 1}
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
                      const valeur = cle in editions ? editions[cle] : planningBase[cle];
                      const jamaisRemplie = valeur === undefined;
                      const horaireTravail = valeur?.travail ? codesParCode[valeur.travail] : undefined;
                      const horaireInformatif = valeur?.informatif
                        ? codesParCode[valeur.informatif]
                        : undefined;
                      const horaireEvenementiel = valeur?.evenementiel
                        ? codesParCode[valeur.evenementiel]
                        : undefined;
                      // Type "special" : le travail est effacé de l'affichage (pleine
                      // cellule), ses heures restent comptées. Type "normal" : le travail
                      // reste visible mais barré, sa durée est remplacée par celle de
                      // l'évènement. Type "partiel" : le travail reste normal, le delta
                      // (+/-) est calculé depuis la ou les plages saisies à la volée.
                      const evenementielSpecial = horaireEvenementiel?.typeEvenement === "special";
                      const travailBarre = horaireEvenementiel?.typeEvenement === "normal";
                      const deltaComplement = valeur ? deltaEvenementielCellule(valeur, codesParCode) : undefined;
                      // Couleur de fond/texte de la cellule : le spécial prend le dessus
                      // sur le travail (qu'il efface visuellement) ; à défaut de travail,
                      // l'informatif porte la couleur (cellule sans code de travail).
                      const horaireFond = evenementielSpecial ? horaireEvenementiel : (horaireTravail ?? horaireInformatif);
                      const enEdition = cellEnEdition === cle;
                      const enSelection =
                        estAdministrateur &&
                        ancreSelection &&
                        survolSelection &&
                        (() => {
                          const rA = indexSalarie.get(ancreSelection.salarieId);
                          const rB = indexSalarie.get(survolSelection.salarieId);
                          const cA = indexJour.get(ancreSelection.dateISO);
                          const cB = indexJour.get(survolSelection.dateISO);
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
                          } — ${heuresReellesCellule(valeur, codesParCode)}h`
                        : jamaisRemplie && estAdministrateur
                          ? "Jamais planifiée — cliquer-glisser pour sélectionner plusieurs cases (appliquer un code, un roulement, ou effacer)"
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
                                  demarrerSelection(salarie.id, dateISO);
                                }
                          }
                          onMouseEnter={!estAdministrateur ? undefined : () => etendreSelection(salarie.id, dateISO)}
                          className={`select-none border border-zinc-200 p-0 text-center align-middle ${
                            peutEditerPlanning ? "cursor-pointer" : "cursor-default"
                          }`}
                          style={{
                            backgroundColor: enEdition
                              ? "#eff6ff"
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
                              : enSelection
                                ? "2px solid #3b82f6"
                                : undefined,
                            outlineOffset: enEdition || enSelection ? "-2px" : undefined,
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

      {estAdministrateur &&
        ancreSelection &&
        survolSelection &&
        positionActionSelection &&
        (() => {
          const cellulesSelection = celluleEnSelection();
          const selectionMonoJour = ancreSelection.dateISO === survolSelection.dateISO;
          const lundi = lundiDeLaSemaine(parseDateISO(ancreSelection.dateISO));
          // Le roulement groupé n'a de sens que sur une sélection mono-jour
          // (plusieurs salariés, même colonne) — sinon "semaine 1 de chacun"
          // serait ambigu pour une sélection à cheval sur plusieurs semaines.
          const evaluationRoulement = selectionMonoJour
            ? cellulesSelection.map(({ salarieId }) => {
                const salarie = salaries.find((s) => s.id === salarieId)!;
                const roulement = roulementActuelDuSalarie(salarieId);
                const resultat = roulement
                  ? evaluerProjectionRoulement(editions, salarieId, lundi, roulement)
                  : undefined;
                return { salarie, roulement, bloque: resultat?.bloque ?? false };
              })
            : [];
          const applicablesRoulement = evaluationRoulement.filter((e) => e.roulement && !e.bloque);
          const bloquesRoulement = evaluationRoulement.filter((e) => e.roulement && e.bloque);
          const sansRoulement = evaluationRoulement.filter((e) => !e.roulement);
          const valeursSelection = cellulesSelection.map(({ salarieId, dateISO }) =>
            valeurActuelleDe(salarieId, dateISO)
          );

          return (
            <>
              <div className="fixed inset-0 z-40" onClick={annulerSelection} />
              {selecteurCodeMultipleOuvert ? (
                <HoraireCodeSelector
                  position={{ top: positionActionSelection.top, left: positionActionSelection.left, width: 220 }}
                  valeursActuelles={valeursSelection}
                  onChoisir={(code) => code && appliquerCodeSelectionMultiple(code)}
                  onFermer={annulerSelection}
                />
              ) : (
                <div
                  className="fixed z-50 w-72 rounded border border-zinc-200 bg-white p-3 text-xs shadow-lg"
                  style={{ top: positionActionSelection.top, left: positionActionSelection.left }}
                >
                  <p className="mb-2 font-medium text-zinc-700">
                    {cellulesSelection.length} case(s) sélectionnée(s)
                    {selectionMonoJour && ` — semaine du ${formatJourMois(lundi)}`}
                  </p>

                  {applicablesRoulement.length > 0 && (
                    <ul className="mb-2 space-y-0.5 text-zinc-600">
                      {applicablesRoulement.map(({ salarie, roulement }) => (
                        <li key={salarie.id}>
                          {salarie.nom} {salarie.prenom} —{" "}
                          <span className="font-medium">{roulement!.nom}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {bloquesRoulement.length > 0 && (
                    <p className="mb-2 text-[11px] text-red-600">
                      Roulement bloqué (semaine déjà planifiée) :{" "}
                      {bloquesRoulement.map(({ salarie }) => `${salarie.nom} ${salarie.prenom}`).join(", ")}
                    </p>
                  )}
                  {sansRoulement.length > 0 && (
                    <p className="mb-2 text-[11px] text-amber-600">
                      Sans roulement assigné (ignorés) :{" "}
                      {sansRoulement.map(({ salarie }) => `${salarie.nom} ${salarie.prenom}`).join(", ")}
                    </p>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setSelecteurCodeMultipleOuvert(true)}
                      className="rounded bg-blue-600 px-2 py-1 text-left text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Appliquer un code…
                    </button>
                    {applicablesRoulement.length > 0 && (
                      <button
                        onClick={appliquerRoulementGroupe}
                        className="rounded border border-blue-300 bg-blue-50 px-2 py-1 text-left text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Appliquer le roulement de chacun
                      </button>
                    )}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <button
                        onClick={effacerSelection}
                        className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Effacer
                      </button>
                      <button
                        onClick={annulerSelection}
                        className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
                      >
                        Annuler
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-400">Touche Suppr/Retour arrière pour effacer directement.</p>
                  </div>
                </div>
              )}
            </>
          );
        })()}
    </div>
  );
}
