# Règles de promotion vers Brain V1

Aucune donnée de staging ne doit rejoindre les tables actives automatiquement.

Une connaissance n'est éligible que si :
- review_status = approved ;
- active = false tant que la promotion n'est pas exécutée ;
- source et provenance sont présentes ;
- le niveau de confiance est suffisant ;
- aucun doublon ou conflit non résolu n'existe ;
- les faits temporels/dynamiques ne sont pas stockés comme vérités permanentes ;
- un lot peut être identifié et annulé.

## Déploiement progressif
1. pilote ;
2. 50 connaissances ;
3. 250 ;
4. 1 000 ;
5. lots suivants.

À chaque palier : contrôle avant passage au suivant.
