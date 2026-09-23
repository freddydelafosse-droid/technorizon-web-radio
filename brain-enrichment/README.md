# Jaya Brain — Enrichment sécurisé

Ce répertoire prépare l'enrichissement massif du cerveau existant de Jaya sans modifier le fonctionnement de production.

## Règles de sécurité
- aucune donnée importée n'est active par défaut ;
- validation humaine avant promotion vers les tables utilisées par Jaya ;
- provenance, date de collecte et niveau de confiance obligatoires ;
- déduplication avant import ;
- rollback possible par lot ;
- aucune modification de `api/jaya-brain.js`, Jaya H24, AzuraCast ou des rendez-vous antenne pendant la phase d'enrichissement.

## Domaines prévus
Musique (artistes, titres, albums, genres, labels, dates, pays, anecdotes sourcées), histoire des musiques électroniques et dance, Technorizon, radio/audio, culture générale utile à l'antenne, géographie, langues, sciences et technologies, cinéma/TV/culture populaire, calendrier et événements non sensibles.

## Pipeline
SOURCE -> STAGING -> NORMALISATION -> DEDUPLICATION -> CONTRÔLE -> VALIDATION -> BRAIN V1

Les données dynamiques (actualité, météo, sport, etc.) ne doivent pas être figées comme connaissances permanentes.

## Statut
Phase 1 : structure d'enrichissement isolée. Production inchangée.
