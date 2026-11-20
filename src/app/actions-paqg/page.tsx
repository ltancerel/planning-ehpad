import TableauBordActions from "@/components/qualite/TableauBordActions";

// EPIC Multi-application (#46), story #47 (maquette) — reprend le tableau
// de bord maquetté sur experiment/qualite-maquette (voir
// TableauBordActions pour le détail des modifications demandées).
//
// TableauBordActions porte tout le gabarit de page (bandeau EHPAD/onglets
// /utilisateur inclus), comme PlanningGrid pour le Planning — retour
// client du 21/11 : un seul bandeau en haut, pas deux rangées séparées.
export default function ActionsPaqg() {
  return <TableauBordActions />;
}
