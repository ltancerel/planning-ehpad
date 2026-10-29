# Outils d'import en masse

`planning-ehpad-tool.py` : import en masse de salariés et/ou de codes
horaires depuis un fichier Excel, directement dans `planning-ehpad-prod`
(Supabase). Pensé pour être lancé par le client lui-même, depuis son propre
poste/serveur — aucune donnée n'est envoyée ailleurs que vers sa base.

```bash
pip3 install openpyxl requests   # une seule fois
export SUPABASE_SERVICE_ROLE_KEY='...'   # Supabase dashboard > Settings > API

# test à blanc (par défaut) — rien n'est écrit
python3 planning-ehpad-tool.py --ehpad "Nom de l'EHPAD" --salaries salaries.xlsx

# import réel
python3 planning-ehpad-tool.py --ehpad "Nom de l'EHPAD" --salaries salaries.xlsx --import
```

Format des fichiers, correspondance Paire/Impaire, règles de validation :
voir l'en-tête de `planning-ehpad-tool.py` (`--help` ou lecture directe du
fichier).

Historique : remplace `scripts/import-salaries/` (généré le 29/10, qui ne
produisait que du SQL à coller manuellement) — le client a repartagé le
29/10 un script d'origine du 28/10 (jamais committé au dépôt), qui écrit
directement en base via l'API Supabase ; `planning-ehpad-tool.py` le reprend
et l'étend (remplacement contrat → type_paie du 29/10, ajout de l'import des
codes horaires).
