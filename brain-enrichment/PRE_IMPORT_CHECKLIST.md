# Checklist avant tout premier import massif

- [ ] Créer la table staging dans l'environnement de test uniquement.
- [ ] Vérifier qu'aucune lecture de jaya-brain.js ne pointe vers cette table.
- [ ] Utiliser une clé serveur uniquement côté backend, jamais dans le navigateur.
- [ ] Importer un lot pilote limité.
- [ ] Contrôler sources, doublons, caractères spéciaux et artistes homonymes.
- [ ] Vérifier que toutes les lignes restent pending + active=false.
- [ ] Tester le rollback du lot.
- [ ] Seulement ensuite augmenter la taille des lots.
- [ ] Aucune promotion vers artists/tracks/knowledge sans validation humaine.
