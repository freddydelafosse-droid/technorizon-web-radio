-- Rollback d'un lot de STAGING uniquement.
-- Remplacer :batch_id par l'identifiant du lot contrôlé.
-- Ne cible aucune table active de Brain V1.
begin;
delete from public.jaya_knowledge_staging
where batch_id = :batch_id
  and active = false;
commit;
