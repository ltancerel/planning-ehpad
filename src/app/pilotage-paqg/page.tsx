import TableauBordPilotage from "@/components/pilotage/TableauBordPilotage";

// EPIC Multi-application (#46), story #47 (maquette) — cahier des charges
// fourni par le client le 20/11 (cf. artefact "Pilotage PAQG — Cahier des
// charges"). Voir TableauBordPilotage pour le périmètre retenu pour cette
// première maquette (vue Administrateur, édition des 3 types de
// fréquence, pas d'écrans d'administration).
//
// TableauBordPilotage porte tout le gabarit de page (bandeau EHPAD/onglets
// /utilisateur inclus), comme PlanningGrid pour le Planning — retour
// client du 21/11 : un seul bandeau en haut, pas deux rangées séparées.
export default function PilotagePaqg() {
  return <TableauBordPilotage />;
}
