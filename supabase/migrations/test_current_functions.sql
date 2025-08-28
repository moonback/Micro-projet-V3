-- Script de test pour vérifier l'état actuel des fonctions
-- Exécutez ce script dans votre base de données Supabase pour diagnostiquer le problème

-- 1. Vérifier si les fonctions existent
SELECT 
  routine_name, 
  routine_type,
  routine_schema,
  routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('approve_task_start', 'reject_task_start')
ORDER BY routine_name;

-- 2. Vérifier les signatures des paramètres
SELECT 
  r.routine_name,
  p.parameter_name,
  p.parameter_mode,
  p.data_type,
  p.ordinal_position
FROM information_schema.routines r
JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_name IN ('approve_task_start', 'reject_task_start')
ORDER BY r.routine_name, p.ordinal_position;

-- 3. Vérifier les permissions
SELECT 
  routine_name,
  routine_type,
  routine_schema,
  security_type
FROM information_schema.routines 
WHERE routine_name IN ('approve_task_start', 'reject_task_start');

-- 4. Tester l'appel de la fonction (simulation)
-- Cette requête simule ce que fait le code JavaScript
SELECT 
  'Function exists' as status,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'approve_task_start' 
AND routine_schema = 'public'
AND routine_type = 'FUNCTION';

-- 5. Vérifier la structure de la table tasks
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- 6. Vérifier les statuts possibles pour les tâches
SELECT DISTINCT status FROM tasks LIMIT 10;
