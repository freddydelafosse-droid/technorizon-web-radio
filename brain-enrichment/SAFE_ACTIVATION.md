# Activation réelle sans casser Brain V1

La stratégie retenue est **additive** : aucune modification des tables existantes artists, tracks ou knowledge.

1. Les nouvelles connaissances passent par staging.
2. Seules les lignes explicitement approuvées peuvent être copiées vers `jaya_knowledge_v1_ext`.
3. `api/jaya-brain.js` ne lira cette extension qu'après un test séparé et avec un interrupteur d'environnement.
4. Si l'interrupteur est désactivé, le comportement actuel de Jaya reste strictement identique.
5. Rollback = désactivation de l'interrupteur, sans supprimer les connaissances historiques de Brain V1.

## Interrupteur prévu
`JAYA_KNOWLEDGE_EXT_ENABLED=false` par défaut.

Aucune bascule production ne doit être faite tant qu'un lot réel n'a pas passé les tests de non-régression.
