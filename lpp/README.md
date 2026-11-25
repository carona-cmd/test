# Recherche LPP & décision médicale

Site statique (HTML/CSS/JS, sans serveur) : ouvrir `index.html` dans un navigateur.

1. **Importer la LPP** : bouton « Importer la LPP (CSV) ». Le fichier doit avoir une ligne d'en-tête avec au moins une colonne *code* et une colonne *libellé* (séparateur `;`, `,`, tabulation ou `|`, détecté automatiquement). Colonnes facultatives reconnues : *tarif*, *chapitre/titre*, *entente préalable*, *date de fin*.
   Sans import, 12 codes **fictifs** de démonstration sont utilisés.
2. **Rechercher** un code (7 chiffres, ou le début du code) ou des mots du libellé.
3. **Ajouter la décision médicale** : dossier, date, décision (accord / accord partiel / refus / ajournement), médecin, quantité, durée, motif.
4. **Exporter** les décisions en CSV (pour Excel) ou en JSON (sauvegarde/réimport).

Les données restent dans le navigateur (localStorage) : rien n'est envoyé sur Internet. Utiliser une référence de dossier plutôt que le nom du patient.
