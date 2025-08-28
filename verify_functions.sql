-- Script de vérification pour s'assurer que toutes les fonctions nécessaires existent
-- et ont les bonnes signatures

-- 1. Vérifier que toutes les fonctions existent
SELECT 
  routine_name, 
  routine_type,
  routine_schema
FROM information_schema.routines 
WHERE routine_name IN (
  'update_task_applications_updated_at',
  'count_active_applications',
  'accept_application',
  'approve_task_start',
  'reject_task_start'
)
ORDER BY routine_name;

-- 2. Vérifier les signatures des fonctions avec leurs paramètres
SELECT 
  r.routine_name,
  r.routine_type,
  p.parameter_name,
  p.parameter_mode,
  p.data_type,
  p.ordinal_position
FROM information_schema.routines r
JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_name IN (
  'count_active_applications',
  'accept_application',
  'approve_task_start',
  'reject_task_start'
)
ORDER BY r.routine_name, p.ordinal_position;

-- 3. Vérifier les permissions d'exécution
SELECT 
  routine_name,
  routine_type,
  routine_schema,
  security_type
FROM information_schema.routines 
WHERE routine_name IN (
  'count_active_applications',
  'accept_application',
  'approve_task_start',
  'reject_task_start'
);

-- 4. Vérifier que la table task_applications existe et a la bonne structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'task_applications'
ORDER BY ordinal_position;

-- 5. Vérifier les contraintes de la table task_applications
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'task_applications';

-- 6. Vérifier que RLS est activé et les politiques existent
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'task_applications';

-- 7. Tester l'appel de la fonction accept_application (simulation)
-- Cette requête simule ce que fait le code JavaScript
SELECT 
  'Function exists' as status,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'accept_application' 
AND routine_schema = 'public'
AND routine_type = 'FUNCTION';
