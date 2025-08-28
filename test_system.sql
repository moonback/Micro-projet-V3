-- Script de test pour le système d'acceptation des tâches
-- À exécuter après avoir corrigé les politiques RLS

-- 1. Vérifier que la fonction update_task_applications_updated_at existe
SELECT 
  routine_name, 
  routine_type 
FROM information_schema.routines 
WHERE routine_name = 'update_task_applications_updated_at';

-- 2. Vérifier que les politiques RLS sont en place
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'task_applications';

-- 3. Vérifier la structure de la table task_applications
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'task_applications'
ORDER BY ordinal_position;

-- 4. Vérifier les contraintes
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'task_applications';

-- 5. Tester l'insertion d'une candidature (remplacer les UUIDs par des valeurs réelles)
-- INSERT INTO task_applications (task_id, helper_id, message, status) 
-- VALUES (
--   'uuid-de-la-tache', 
--   'uuid-de-l-helper', 
--   'Test de candidature', 
--   'pending'
-- );

-- 6. Vérifier les candidatures existantes
SELECT 
  ta.id,
  ta.task_id,
  ta.helper_id,
  ta.status,
  ta.message,
  ta.created_at,
  t.title as task_title,
  p.name as helper_name
FROM task_applications ta
JOIN tasks t ON ta.task_id = t.id
JOIN profiles p ON ta.helper_id = p.id
LIMIT 10;
