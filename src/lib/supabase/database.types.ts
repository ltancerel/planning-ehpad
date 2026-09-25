// Généré via `mcp__Supabase__generate_typescript_types` (get_advisors-style
// outil MCP) depuis le schéma réel de PROD. Pas de génération automatisée
// en CI pour l'instant (pas de Supabase CLI utilisable dans ce sandbox,
// cf. AGENTS.md) : à régénérer à la main après toute migration qui change
// le schéma public (nouvelle table/colonne/fonction RPC).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      administrateur_systeme: {
        Row: {
          actif: boolean;
          email: string;
          id: string;
          identifiant: string;
          nom: string;
          prenom: string;
        };
        Insert: {
          actif?: boolean;
          email: string;
          id: string;
          identifiant: string;
          nom: string;
          prenom: string;
        };
        Update: {
          actif?: boolean;
          email?: string;
          id?: string;
          identifiant?: string;
          nom?: string;
          prenom?: string;
        };
        Relationships: [];
      };
      affectation_roulement: {
        Row: {
          date_debut: string;
          date_fin: string | null;
          id: string;
          roulement_id: string;
          salarie_id: string;
        };
        Insert: {
          date_debut: string;
          date_fin?: string | null;
          id?: string;
          roulement_id: string;
          salarie_id: string;
        };
        Update: {
          date_debut?: string;
          date_fin?: string | null;
          id?: string;
          roulement_id?: string;
          salarie_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "affectation_roulement_roulement_id_fkey";
            columns: ["roulement_id"];
            isOneToOne: false;
            referencedRelation: "roulement";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "affectation_roulement_salarie_id_fkey";
            columns: ["salarie_id"];
            isOneToOne: false;
            referencedRelation: "salarie";
            referencedColumns: ["id"];
          },
        ];
      };
      annee_planifiee: {
        Row: {
          annee: number;
          ehpad_id: string;
          id: string;
          jour_demarrage: string;
        };
        Insert: {
          annee: number;
          ehpad_id: string;
          id?: string;
          jour_demarrage: string;
        };
        Update: {
          annee?: number;
          ehpad_id?: string;
          id?: string;
          jour_demarrage?: string;
        };
        Relationships: [
          {
            foreignKeyName: "annee_planifiee_ehpad_id_fkey";
            columns: ["ehpad_id"];
            isOneToOne: false;
            referencedRelation: "ehpad";
            referencedColumns: ["id"];
          },
        ];
      };
      application: {
        Row: {
          code: string;
          id: string;
          nom: string;
        };
        Insert: {
          code: string;
          id?: string;
          nom: string;
        };
        Update: {
          code?: string;
          id?: string;
          nom?: string;
        };
        Relationships: [];
      };
      code_horaire: {
        Row: {
          action: string | null;
          afficher_vue_annuelle: boolean;
          categorie: string;
          code: string;
          commentaire: string | null;
          couleur_fond: string;
          couleur_texte: string;
          duree_heures: number | null;
          ehpad_id: string;
          id: string;
          intitule: string;
          type_evenement: string | null;
        };
        Insert: {
          action?: string | null;
          afficher_vue_annuelle?: boolean;
          categorie: string;
          code: string;
          commentaire?: string | null;
          couleur_fond: string;
          couleur_texte: string;
          duree_heures?: number | null;
          ehpad_id: string;
          id?: string;
          intitule: string;
          type_evenement?: string | null;
        };
        Update: {
          action?: string | null;
          afficher_vue_annuelle?: boolean;
          categorie?: string;
          code?: string;
          commentaire?: string | null;
          couleur_fond?: string;
          couleur_texte?: string;
          duree_heures?: number | null;
          ehpad_id?: string;
          id?: string;
          intitule?: string;
          type_evenement?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "code_horaire_ehpad_id_fkey";
            columns: ["ehpad_id"];
            isOneToOne: false;
            referencedRelation: "ehpad";
            referencedColumns: ["id"];
          },
        ];
      };
      compte: {
        Row: {
          actif: boolean;
          ehpad_id: string;
          email: string;
          id: string;
          identifiant: string;
          nom: string;
          poste: string | null;
          prenom: string;
          service_id: string | null;
          type_compte: string;
        };
        Insert: {
          actif?: boolean;
          ehpad_id: string;
          email: string;
          id: string;
          identifiant: string;
          nom: string;
          poste?: string | null;
          prenom: string;
          service_id?: string | null;
          type_compte: string;
        };
        Update: {
          actif?: boolean;
          ehpad_id?: string;
          email?: string;
          id?: string;
          identifiant?: string;
          nom?: string;
          poste?: string | null;
          prenom?: string;
          service_id?: string | null;
          type_compte?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compte_ehpad_id_fkey";
            columns: ["ehpad_id"];
            isOneToOne: false;
            referencedRelation: "ehpad";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compte_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "service";
            referencedColumns: ["id"];
          },
        ];
      };
      compte_application: {
        Row: {
          application_id: string;
          compte_id: string;
        };
        Insert: {
          application_id: string;
          compte_id: string;
        };
        Update: {
          application_id?: string;
          compte_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compte_application_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "application";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compte_application_compte_id_fkey";
            columns: ["compte_id"];
            isOneToOne: false;
            referencedRelation: "compte";
            referencedColumns: ["id"];
          },
        ];
      };
      contrat: {
        Row: {
          actif: boolean;
          date_debut: string;
          date_fin: string | null;
          id: string;
          salarie_id: string;
          type_contrat: string;
        };
        Insert: {
          actif?: boolean;
          date_debut: string;
          date_fin?: string | null;
          id?: string;
          salarie_id: string;
          type_contrat: string;
        };
        Update: {
          actif?: boolean;
          date_debut?: string;
          date_fin?: string | null;
          id?: string;
          salarie_id?: string;
          type_contrat?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contrat_salarie_id_fkey";
            columns: ["salarie_id"];
            isOneToOne: false;
            referencedRelation: "salarie";
            referencedColumns: ["id"];
          },
        ];
      };
      ehpad: {
        Row: {
          actif: boolean;
          id: string;
          logo_base64: string | null;
          nom: string;
        };
        Insert: {
          actif?: boolean;
          id?: string;
          logo_base64?: string | null;
          nom: string;
        };
        Update: {
          actif?: boolean;
          id?: string;
          logo_base64?: string | null;
          nom?: string;
        };
        Relationships: [];
      };
      ehpad_application: {
        Row: {
          application_id: string;
          ehpad_id: string;
        };
        Insert: {
          application_id: string;
          ehpad_id: string;
        };
        Update: {
          application_id?: string;
          ehpad_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ehpad_application_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "application";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ehpad_application_ehpad_id_fkey";
            columns: ["ehpad_id"];
            isOneToOne: false;
            referencedRelation: "ehpad";
            referencedColumns: ["id"];
          },
        ];
      };
      jour_ferie: {
        Row: {
          actif: boolean;
          annee_planifiee_id: string;
          date: string;
          id: string;
          label: string;
          type: string;
        };
        Insert: {
          actif?: boolean;
          annee_planifiee_id: string;
          date: string;
          id?: string;
          label: string;
          type: string;
        };
        Update: {
          actif?: boolean;
          annee_planifiee_id?: string;
          date?: string;
          id?: string;
          label?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jour_ferie_annee_planifiee_id_fkey";
            columns: ["annee_planifiee_id"];
            isOneToOne: false;
            referencedRelation: "annee_planifiee";
            referencedColumns: ["id"];
          },
        ];
      };
      journee: {
        Row: {
          code_evenementiel_id: string | null;
          code_informatif_id: string | null;
          code_travail_id: string | null;
          date: string;
          id: string;
          salarie_id: string;
        };
        Insert: {
          code_evenementiel_id?: string | null;
          code_informatif_id?: string | null;
          code_travail_id?: string | null;
          date: string;
          id?: string;
          salarie_id: string;
        };
        Update: {
          code_evenementiel_id?: string | null;
          code_informatif_id?: string | null;
          code_travail_id?: string | null;
          date?: string;
          id?: string;
          salarie_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journee_code_evenementiel_id_fkey";
            columns: ["code_evenementiel_id"];
            isOneToOne: false;
            referencedRelation: "code_horaire";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journee_code_informatif_id_fkey";
            columns: ["code_informatif_id"];
            isOneToOne: false;
            referencedRelation: "code_horaire";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journee_code_travail_id_fkey";
            columns: ["code_travail_id"];
            isOneToOne: false;
            referencedRelation: "code_horaire";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journee_salarie_id_fkey";
            columns: ["salarie_id"];
            isOneToOne: false;
            referencedRelation: "salarie";
            referencedColumns: ["id"];
          },
        ];
      };
      journee_evenementiel_plage: {
        Row: {
          heure_debut: string;
          heure_fin: string;
          id: string;
          journee_id: string;
          ordre: number;
        };
        Insert: {
          heure_debut: string;
          heure_fin: string;
          id?: string;
          journee_id: string;
          ordre: number;
        };
        Update: {
          heure_debut?: string;
          heure_fin?: string;
          id?: string;
          journee_id?: string;
          ordre?: number;
        };
        Relationships: [
          {
            foreignKeyName: "journee_evenementiel_plage_journee_id_fkey";
            columns: ["journee_id"];
            isOneToOne: false;
            referencedRelation: "journee";
            referencedColumns: ["id"];
          },
        ];
      };
      journee_historique: {
        Row: {
          code_evenementiel_id: string | null;
          code_travail_id: string | null;
          compte_id_auteur: string | null;
          date: string;
          evenementiel_plage_debut: string | null;
          evenementiel_plage_fin: string | null;
          horodatage: string;
          id: string;
          salarie_id: string;
          type_operation: string;
        };
        Insert: {
          code_evenementiel_id?: string | null;
          code_travail_id?: string | null;
          compte_id_auteur?: string | null;
          date: string;
          evenementiel_plage_debut?: string | null;
          evenementiel_plage_fin?: string | null;
          horodatage?: string;
          id?: string;
          salarie_id: string;
          type_operation: string;
        };
        Update: {
          code_evenementiel_id?: string | null;
          code_travail_id?: string | null;
          compte_id_auteur?: string | null;
          date?: string;
          evenementiel_plage_debut?: string | null;
          evenementiel_plage_fin?: string | null;
          horodatage?: string;
          id?: string;
          salarie_id?: string;
          type_operation?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journee_historique_code_evenementiel_id_fkey";
            columns: ["code_evenementiel_id"];
            isOneToOne: false;
            referencedRelation: "code_horaire";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journee_historique_code_travail_id_fkey";
            columns: ["code_travail_id"];
            isOneToOne: false;
            referencedRelation: "code_horaire";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journee_historique_salarie_id_fkey";
            columns: ["salarie_id"];
            isOneToOne: false;
            referencedRelation: "salarie";
            referencedColumns: ["id"];
          },
        ];
      };
      log_audit: {
        Row: {
          acteur_nom: string;
          acteur_type: string;
          compte_id_auteur: string | null;
          detail: Json | null;
          ehpad_id: string | null;
          entite: string;
          entite_id: string | null;
          event_id: string | null;
          horodatage: string;
          hostname: string | null;
          id: string;
          ip_destination: unknown;
          ip_source: unknown;
          message: string;
          niveau: string;
          port_destination: number | null;
          port_source: number | null;
          source: string;
          statut: string;
          type_operation: string;
        };
        Insert: {
          acteur_nom: string;
          acteur_type: string;
          compte_id_auteur?: string | null;
          detail?: Json | null;
          ehpad_id?: string | null;
          entite: string;
          entite_id?: string | null;
          event_id?: string | null;
          horodatage?: string;
          hostname?: string | null;
          id?: string;
          ip_destination?: unknown;
          ip_source?: unknown;
          message: string;
          niveau?: string;
          port_destination?: number | null;
          port_source?: number | null;
          source: string;
          statut?: string;
          type_operation: string;
        };
        Update: {
          acteur_nom?: string;
          acteur_type?: string;
          compte_id_auteur?: string | null;
          detail?: Json | null;
          ehpad_id?: string | null;
          entite?: string;
          entite_id?: string | null;
          event_id?: string | null;
          horodatage?: string;
          hostname?: string | null;
          id?: string;
          ip_destination?: unknown;
          ip_source?: unknown;
          message?: string;
          niveau?: string;
          port_destination?: number | null;
          port_source?: number | null;
          source?: string;
          statut?: string;
          type_operation?: string;
        };
        Relationships: [
          {
            foreignKeyName: "log_audit_ehpad_id_fkey";
            columns: ["ehpad_id"];
            isOneToOne: false;
            referencedRelation: "ehpad";
            referencedColumns: ["id"];
          },
        ];
      };
      plage_horaire: {
        Row: {
          code_horaire_id: string;
          heure_debut: string;
          heure_fin: string;
          id: string;
          ordre: number;
        };
        Insert: {
          code_horaire_id: string;
          heure_debut: string;
          heure_fin: string;
          id?: string;
          ordre: number;
        };
        Update: {
          code_horaire_id?: string;
          heure_debut?: string;
          heure_fin?: string;
          id?: string;
          ordre?: number;
        };
        Relationships: [
          {
            foreignKeyName: "plage_horaire_code_horaire_id_fkey";
            columns: ["code_horaire_id"];
            isOneToOne: false;
            referencedRelation: "code_horaire";
            referencedColumns: ["id"];
          },
        ];
      };
      roulement: {
        Row: {
          ehpad_id: string;
          id: string;
          nb_semaines: number;
          nom: string;
        };
        Insert: {
          ehpad_id: string;
          id?: string;
          nb_semaines: number;
          nom: string;
        };
        Update: {
          ehpad_id?: string;
          id?: string;
          nb_semaines?: number;
          nom?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roulement_ehpad_id_fkey";
            columns: ["ehpad_id"];
            isOneToOne: false;
            referencedRelation: "ehpad";
            referencedColumns: ["id"];
          },
        ];
      };
      roulement_jour: {
        Row: {
          code_horaire_id: string | null;
          id: string;
          jour_semaine: number;
          roulement_id: string;
          semaine_index: number;
        };
        Insert: {
          code_horaire_id?: string | null;
          id?: string;
          jour_semaine: number;
          roulement_id: string;
          semaine_index: number;
        };
        Update: {
          code_horaire_id?: string | null;
          id?: string;
          jour_semaine?: number;
          roulement_id?: string;
          semaine_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: "roulement_jour_code_horaire_id_fkey";
            columns: ["code_horaire_id"];
            isOneToOne: false;
            referencedRelation: "code_horaire";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roulement_jour_roulement_id_fkey";
            columns: ["roulement_id"];
            isOneToOne: false;
            referencedRelation: "roulement";
            referencedColumns: ["id"];
          },
        ];
      };
      salarie: {
        Row: {
          alignement_roulement: string | null;
          ehpad_id: string;
          id: string;
          manager: string | null;
          matricule: string;
          nom: string;
          prenom: string;
          presence: string;
          service_id: string;
        };
        Insert: {
          alignement_roulement?: string | null;
          ehpad_id: string;
          id?: string;
          manager?: string | null;
          matricule: string;
          nom: string;
          prenom: string;
          presence: string;
          service_id: string;
        };
        Update: {
          alignement_roulement?: string | null;
          ehpad_id?: string;
          id?: string;
          manager?: string | null;
          matricule?: string;
          nom?: string;
          prenom?: string;
          presence?: string;
          service_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salarie_ehpad_id_fkey";
            columns: ["ehpad_id"];
            isOneToOne: false;
            referencedRelation: "ehpad";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "salarie_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "service";
            referencedColumns: ["id"];
          },
        ];
      };
      service: {
        Row: {
          ehpad_id: string;
          id: string;
          nom: string;
          ordre: number;
        };
        Insert: {
          ehpad_id: string;
          id?: string;
          nom: string;
          ordre: number;
        };
        Update: {
          ehpad_id?: string;
          id?: string;
          nom?: string;
          ordre?: number;
        };
        Relationships: [
          {
            foreignKeyName: "service_ehpad_id_fkey";
            columns: ["ehpad_id"];
            isOneToOne: false;
            referencedRelation: "ehpad";
            referencedColumns: ["id"];
          },
        ];
      };
      validation_emargement: {
        Row: {
          annee: number;
          date_validation: string;
          id: string;
          mois: number;
          salarie_id: string;
        };
        Insert: {
          annee: number;
          date_validation?: string;
          id?: string;
          mois: number;
          salarie_id: string;
        };
        Update: {
          annee?: number;
          date_validation?: string;
          id?: string;
          mois?: number;
          salarie_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "validation_emargement_salarie_id_fkey";
            columns: ["salarie_id"];
            isOneToOne: false;
            referencedRelation: "salarie";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      auth_ehpad_id: { Args: Record<PropertyKey, never>; Returns: string };
      auth_type_compte: { Args: Record<PropertyKey, never>; Returns: string };
      est_administrateur_systeme: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
