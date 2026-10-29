#!/usr/bin/env python3
"""
Transforme un fichier Excel de salariés (cf. README.md dans ce dossier pour le
format attendu) en instructions SQL `insert` prêtes à exécuter contre PROD.

Volontairement sans accès direct à la base : ce script ne fait que lire le
fichier, valider et transformer — l'application réelle des `insert` reste un
geste explicite de l'agent (cf. AGENTS.md « Base de données (accès PROD) »),
jamais automatique depuis un script qui embarquerait des identifiants.

Usage :
    python3 import_salaries.py chemin/vers/fichier.xlsx
"""

import sys

import openpyxl

MANAGERS_VALIDES = {"Aucun", "Maîtresse de maison", "IDEC"}
TYPES_PAIE_VALIDES = {"Aucun", "25/M", "30/M"}
GROUPES_ROULEMENT_VALIDES = {"Équipe A", "Équipe B", "Équipe C", "Équipe D"}
PRESENCES_VALIDES = {"Présent", "Absent"}

# Ancien champ "Alignement roulement" exprimé en Paire/Impaire dans certains
# fichiers clients (plutôt que les 4 valeurs Équipe A/B/C/D attendues en
# base) — correspondance actée avec le client le 29/10, à chaque import.
ALIGNEMENT_PAIRE_IMPAIRE = {"Paire": "Équipe A", "Impaire": "Équipe B"}

COLONNES_ATTENDUES = [
    "NOM",
    "Prénom",
    "Matricule",
    "SERVICE",
    "Manager",
    "Type de paie",
    "Alignement roulement",
    "Présence",
]


def capitaliser(texte: str) -> str:
    texte = texte.strip()
    return texte[:1].upper() + texte[1:].lower() if texte else texte


def normaliser_alignement(valeur: str | None) -> str:
    if not valeur:
        return "Équipe A"  # défaut applicatif, cf. SalarieForm.tsx
    valeur = valeur.strip()
    if valeur in GROUPES_ROULEMENT_VALIDES:
        return valeur
    if valeur in ALIGNEMENT_PAIRE_IMPAIRE:
        return ALIGNEMENT_PAIRE_IMPAIRE[valeur]
    raise ValueError(
        f"Alignement roulement inconnu : {valeur!r} "
        f"(attendu : Équipe A-D, ou Paire/Impaire)"
    )


def echapper(valeur: str) -> str:
    return valeur.replace("'", "''")


def lire_lignes(chemin_xlsx: str):
    classeur = openpyxl.load_workbook(chemin_xlsx, data_only=True)
    feuille = classeur.worksheets[0]
    lignes = list(feuille.iter_rows(values_only=True))
    if not lignes:
        raise ValueError("Fichier vide.")

    entetes = [str(c).strip() if c else "" for c in lignes[0]]
    index = {nom: entetes.index(nom) for nom in COLONNES_ATTENDUES if nom in entetes}
    manquantes = [c for c in COLONNES_ATTENDUES if c not in index]
    if manquantes:
        raise ValueError(f"Colonnes manquantes dans le fichier : {manquantes}")

    # "Contrat Actif" (ancien modèle, remplacé par Type de paie le 29/10) et
    # "Roulement" (affectation non encore reliée à la base, cf. story #35
    # restante — à faire depuis l'écran Salarié > Gérer) sont ignorées sans
    # erreur si présentes : un fichier client peut encore les porter.

    for num_ligne, ligne in enumerate(lignes[1:], start=2):
        if all(v is None for v in ligne):
            continue

        def valeur(colonne: str) -> str | None:
            v = ligne[index[colonne]]
            return str(v).strip() if v is not None else None

        yield num_ligne, {
            "nom": valeur("NOM"),
            "prenom": valeur("Prénom"),
            "matricule": valeur("Matricule"),
            "service": valeur("SERVICE"),
            "manager": valeur("Manager"),
            "type_paie": valeur("Type de paie"),
            "alignement_roulement": valeur("Alignement roulement"),
            "presence": valeur("Présence"),
        }


def valider(num_ligne: int, brut: dict) -> dict:
    erreurs = []

    nom = (brut["nom"] or "").upper()
    prenom = capitaliser(brut["prenom"] or "")
    matricule = (brut["matricule"] or "").upper()
    service = brut["service"] or ""
    manager = brut["manager"] or "Aucun"
    type_paie = brut["type_paie"] or "Aucun"
    presence = brut["presence"] or ""

    if not nom:
        erreurs.append("NOM manquant")
    if not prenom:
        erreurs.append("Prénom manquant")
    if len(matricule) != 4 or not matricule.isalpha():
        erreurs.append(f"Matricule invalide : {matricule!r} (4 lettres attendues)")
    if not service:
        erreurs.append("SERVICE manquant")
    if manager not in MANAGERS_VALIDES:
        erreurs.append(f"Manager inconnu : {manager!r}")
    if type_paie not in TYPES_PAIE_VALIDES:
        erreurs.append(f"Type de paie inconnu : {type_paie!r}")
    if presence not in PRESENCES_VALIDES:
        erreurs.append(f"Présence invalide : {presence!r}")

    try:
        alignement_roulement = normaliser_alignement(brut["alignement_roulement"])
    except ValueError as exc:
        erreurs.append(str(exc))
        alignement_roulement = None

    if erreurs:
        raise ValueError(f"Ligne {num_ligne} : " + " ; ".join(erreurs))

    return {
        "nom": nom,
        "prenom": prenom,
        "matricule": matricule,
        "service": service,
        "manager": manager,
        "type_paie": type_paie,
        "alignement_roulement": alignement_roulement,
        "presence": presence,
    }


def generer_sql(salaries: list[dict]) -> str:
    lignes_sql = []
    for s in salaries:
        lignes_sql.append(
            "insert into salarie "
            "(ehpad_id, service_id, matricule, nom, prenom, manager, "
            "alignement_roulement, presence, type_paie)\n"
            "select sv.ehpad_id, sv.id, "
            f"'{echapper(s['matricule'])}', '{echapper(s['nom'])}', "
            f"'{echapper(s['prenom'])}', '{echapper(s['manager'])}', "
            f"'{echapper(s['alignement_roulement'])}', '{echapper(s['presence'])}', "
            f"'{echapper(s['type_paie'])}'\n"
            f"from service sv where sv.nom = '{echapper(s['service'])}';"
        )
    return "\n\n".join(lignes_sql)


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)

    salaries = []
    erreurs = []
    for num_ligne, brut in lire_lignes(sys.argv[1]):
        try:
            salaries.append(valider(num_ligne, brut))
        except ValueError as exc:
            erreurs.append(str(exc))

    if erreurs:
        print("Lignes rejetées :", file=sys.stderr)
        for erreur in erreurs:
            print(f"  - {erreur}", file=sys.stderr)
        print(file=sys.stderr)

    if salaries:
        print(f"-- {len(salaries)} salarié(s) validé(s), prêt(s) pour exécution via l'agent.\n")
        print(generer_sql(salaries))

    if erreurs:
        sys.exit(1)


if __name__ == "__main__":
    main()
