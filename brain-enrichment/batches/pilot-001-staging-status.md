# Dry-run staging — pilote 001

Le test préparé ici fonctionne **sans connexion à Supabase** et sans écriture.
Il valide le format, les champs requis, les niveaux de confiance et les empreintes anti-doublon.

Le vrai test Supabase restera bloqué tant que la table staging n'aura pas été créée dans un environnement de test distinct et vérifié. Cette étape évite toute écriture accidentelle dans la base active.
