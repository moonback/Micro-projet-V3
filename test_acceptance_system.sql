-- Script de test pour le système d'acceptation des tâches
-- À exécuter après avoir créé les tables avec database_schema.sql

-- 1. Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'tasks', 'task_acceptances', 'messages', 'notifications');

-- 2. Vérifier que les fonctions existent
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('accept_task', 'start_task', 'complete_task', 'create_notification');

-- 3. Vérifier que les vues existent
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('user_task_stats', 'task_details');

-- 4. Insérer des données de test (si pas déjà fait)
-- Note: Assurez-vous d'avoir un utilisateur avec l'UUID spécifié

-- Vérifier les utilisateurs existants
SELECT id, email FROM auth.users LIMIT 5;

-- 5. Tester la fonction d'acceptation
-- Remplacez 'USER_UUID' par un vrai UUID d'utilisateur existant
-- Remplacez 'TASK_UUID' par un vrai UUID de tâche existante

-- Exemple d'utilisation (à décommenter et adapter) :
/*
SELECT accept_task(
  'TASK_UUID'::uuid,  -- UUID de la tâche à accepter
  'USER_UUID'::uuid,  -- UUID de l'utilisateur qui accepte
  'Je peux commencer demain matin'  -- Notes optionnelles
);
*/

-- 6. Vérifier les tâches et leurs statuts
SELECT 
  t.id,
  t.title,
  t.status,
  t.author,
  t.helper,
  p1.name as author_name,
  p2.name as helper_name,
  t.created_at,
  t.updated_at
FROM tasks t
LEFT JOIN profiles p1 ON t.author = p1.id
LEFT JOIN profiles p2 ON t.helper = p2.id
ORDER BY t.created_at DESC
LIMIT 10;

-- 7. Vérifier l'historique des acceptations
SELECT 
  ta.id,
  ta.task_id,
  ta.helper_id,
  ta.status as acceptance_status,
  ta.accepted_at,
  ta.notes,
  t.title as task_title,
  t.status as task_status,
  p.name as helper_name
FROM task_acceptances ta
JOIN tasks t ON ta.task_id = t.id
JOIN profiles p ON ta.helper_id = p.id
ORDER BY ta.created_at DESC
LIMIT 10;

-- 8. Vérifier les notifications
SELECT 
  n.id,
  n.user_id,
  n.type,
  n.title,
  n.message,
  n.is_read,
  n.created_at,
  p.name as user_name
FROM notifications n
JOIN profiles p ON n.user_id = p.id
ORDER BY n.created_at DESC
LIMIT 10;

-- 9. Tester la vue user_task_stats
SELECT * FROM user_task_stats LIMIT 5;

-- 10. Tester la vue task_details
SELECT 
  id,
  title,
  status,
  author_name,
  helper_name,
  accepted_at,
  message_count
FROM task_details 
ORDER BY created_at DESC 
LIMIT 5;

-- 11. Vérifier les politiques RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'tasks', 'task_acceptances', 'messages', 'notifications');

-- 12. Vérifier les index
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'tasks', 'task_acceptances', 'messages', 'notifications')
ORDER BY tablename, indexname;

-- 13. Statistiques des tables
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'tasks', 'task_acceptances', 'messages', 'notifications');

-- 14. Vérifier les triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table IN ('profiles', 'tasks');

-- 15. Test de performance - Compter les tâches par statut
SELECT 
  status,
  COUNT(*) as count,
  AVG(budget) as avg_budget,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM tasks 
GROUP BY status 
ORDER BY count DESC;

-- 16. Test de performance - Compter les acceptations par statut
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (NOW() - accepted_at))/3600) as avg_hours_since_acceptance
FROM task_acceptances 
GROUP BY status 
ORDER BY count DESC;

-- 17. Vérifier l'intégrité référentielle
SELECT 
  'tasks.author -> profiles.id' as constraint_name,
  COUNT(*) as orphaned_tasks
FROM tasks t
LEFT JOIN profiles p ON t.author = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
  'tasks.helper -> profiles.id' as constraint_name,
  COUNT(*) as orphaned_tasks
FROM tasks t
LEFT JOIN profiles p ON t.helper = p.id
WHERE t.helper IS NOT NULL AND p.id IS NULL

UNION ALL

SELECT 
  'task_acceptances.task_id -> tasks.id' as constraint_name,
  COUNT(*) as orphaned_acceptances
FROM task_acceptances ta
LEFT JOIN tasks t ON ta.task_id = t.id
WHERE t.id IS NULL

UNION ALL

SELECT 
  'task_acceptances.helper_id -> profiles.id' as constraint_name,
  COUNT(*) as orphaned_acceptances
FROM task_acceptances ta
LEFT JOIN profiles p ON ta.helper_id = p.id
WHERE p.id IS NULL;

-- 18. Vérifier les contraintes CHECK
SELECT 
  constraint_name,
  table_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public'
AND table_name IN ('tasks', 'task_acceptances', 'notifications');

-- 19. Test de la géolocalisation PostGIS
SELECT 
  id,
  title,
  ST_AsText(location) as coordinates,
  ST_Distance(
    location::geography, 
    ST_GeomFromText('POINT(2.3522 48.8566)', 4326)::geography
  ) as distance_from_paris_center_meters
FROM tasks 
WHERE location IS NOT NULL
ORDER BY distance_from_paris_center_meters
LIMIT 5;

-- 20. Résumé du système
SELECT 
  'Système d''acceptation des tâches' as system_name,
  (SELECT COUNT(*) FROM tasks) as total_tasks,
  (SELECT COUNT(*) FROM task_acceptances) as total_acceptances,
  (SELECT COUNT(*) FROM notifications) as total_notifications,
  (SELECT COUNT(*) FROM messages) as total_messages,
  (SELECT COUNT(*) FROM profiles) as total_profiles;
