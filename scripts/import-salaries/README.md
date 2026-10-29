# Import de salariés en masse

Script ajouté le 29/10, suite à un premier fichier test fourni par le
client — pas de script d'import pré-existant avant celui-ci.

## Format attendu (1ère ligne = en-têtes)

| Colonne | Obligatoire | Note |
|---|---|---|
| `NOM` | oui | mis en MAJUSCULES à l'import |
| `Prénom` | oui | capitalisé (1ère lettre) à l'import |
| `Matricule` | oui | 4 lettres, mis en MAJUSCULES — doit être unique dans l'EHPAD |
| `SERVICE` | oui | doit correspondre exactement à un `service.nom` déjà créé (écran Utilisateurs) |
| `Manager` | non (défaut `Aucun`) | `Aucun` / `Maîtresse de maison` / `IDEC` |
| `Type de paie` | non (défaut `Aucun`) | `Aucun` / `25/M` / `30/M` — remplace l'ancien champ `Contrat Actif` (supprimé le 29/10, cf. migration `20261029000001_remplacer_contrat_par_type_paie.sql`) |
| `Alignement roulement` | non (défaut `Équipe A`) | `Équipe A` à `Équipe D`, ou `Paire`/`Impaire` (voir correspondance ci-dessous) |
| `Présence` | oui | `Présent` / `Absent` |

Deux colonnes d'un ancien format sont tolérées dans le fichier mais
**ignorées sans erreur** si présentes :
- `Contrat Actif` — obsolète, remplacée par `Type de paie`.
- `Roulement` — l'affectation d'un roulement à un salarié ne passe pas
  encore par cet import (pas encore relié à la base, story #35 restante) ;
  à faire ensuite depuis l'écran Salarié > « Gérer ».

## Correspondance Paire/Impaire → Équipe A-D

Certains fichiers client portent `Paire`/`Impaire` dans `Alignement
roulement` plutôt que les 4 valeurs attendues en base. Correspondance actée
avec le client le 29/10 : `Paire` → `Équipe A`, `Impaire` → `Équipe B`.
À reconfirmer si un futur fichier utilise réellement les 4 équipes.

## Usage

```bash
python3 import_salaries.py chemin/vers/fichier.xlsx
```

Le script **ne touche pas à la base** : il valide le fichier et imprime les
instructions SQL `insert` correspondantes sur la sortie standard. C'est
toujours l'agent qui exécute ensuite ce SQL contre PROD (cf. AGENTS.md «
Base de données (accès PROD) » — accès PROD piloté par l'agent, jamais par
un script autonome qui embarquerait des identifiants).

## Limite connue

La résolution du service se fait par nom (`service.nom`) sans filtrer par
EHPAD — correct tant qu'un seul EHPAD existe en PROD ; à revoir (filtrer
par `ehpad_id`) si l'import doit un jour s'exécuter dans un contexte
multi-établissement.
