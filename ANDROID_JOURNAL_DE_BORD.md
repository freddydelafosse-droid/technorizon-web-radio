# Technorizon Android — Journal de bord

## Règles impératives
- Une action = une trace écrite datée et vérifiable.
- Consigner objectif, fichiers concernés, modifications, tests, résultats, incidents, retour arrière et prochaine étape.
- Distinguer **prévu**, **réalisé**, **testé** et **déployé**.
- Ne jamais modifier la branche de production `main` ni la diffusion radio sans validation explicite.
- Ne pas stocker de secrets, mots de passe ou jetons dans ce journal.
- Les commits Git constituent la référence technique durable ; la mémoire conversationnelle seule ne suffit pas.

## Cahier des charges validé — 2026-10-10
- Application Android radio native/hybride réelle, et non simple enveloppe du site.
- Écoute facultative, sans démarrage automatique.
- Lecture audio en arrière-plan et sur écran verrouillé.
- Skins personnalisables mémorisés.
- Infos, météo, Technoroscope, sports, Jaya, programmes, Game Zone, dédicaces et contact.
- Multilingue, distribution internationale dans les pays éligibles, gratuite pour les auditeurs.
- Notifications uniquement avec consentement.
- Architecture préparée pour une future version iOS.
- Ne pas perturber Technorizon.fr, AzuraCast ou Jaya.
- Budget cible : 25 USD d'inscription Google Play, sous réserve d'autres frais et droits de diffusion.
- Publication uniquement après tests Android réels et vérification des droits territoriaux.

## Interventions
### 2026-10-10 — Démarrage du suivi
- **Prévu :** identifier l'architecture existante et préparer un projet Android isolé.
- **Réalisé :** accès au dépôt `freddydelafosse-droid/technorizon-web-radio` confirmé ; branche `android-app-planning` créée à partir de `main`.
- **Constat :** `package.json` et `README.md` introuvables à la racine de la branche par défaut lors des premières vérifications ; architecture non encore identifiée.
- **Tests :** création de branche réussie ; aucun test Android effectué.
- **Production :** aucune modification ni déploiement.
- **Retour arrière :** supprimer la branche de planification si nécessaire ; `main` inchangée.
- **Prochaine étape :** inspecter l'arborescence réelle du dépôt avant tout développement.

### 2026-10-10 — Positionnement produit confirmé
- **Décision utilisateur :** l'application Android Technorizon doit être **haut de gamme / premium** dans son design, son ergonomie, ses animations, sa fluidité, sa stabilité et sa finition.
- **Interprétation :** premium décrit la qualité de l'expérience, sans remettre en cause la gratuité pour les auditeurs.
- **Statut :** exigence produit validée et consignée ; aucune modification de l'application ni de la production.
- **Prochaine étape :** décliner ce niveau d'exigence en critères de conception et de recette vérifiables.

### 2026-10-10 — Engagement et fonctionnalités différenciantes
- **Décision utilisateur :** prévoir des options originales, attractives et donnant envie de revenir régulièrement dans l'application Android Technorizon.
- **Orientation :** engagement positif et volontaire, sans lecture automatique ni notifications envahissantes.
- **Pistes à étudier (non validées individuellement) :** découverte musicale et historique d'écoute, favoris, alertes d'émissions choisies, animations de skins, interactions Jaya, défis Game Zone et personnalisation.
- **Statut :** orientation validée ; fonctionnalités spécifiques à arbitrer ultérieurement. Aucune modification de production.
