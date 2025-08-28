-- Test du Système d'Acceptation des Tâches
-- Exécuter ce fichier après avoir appliqué la migration

-- 1. Vérifier que la table task_applications existe
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'task_applications'
ORDER BY ordinal_position;

-- 2. Vérifier que les vues existent
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name IN ('task_applications_with_profiles', 'task_history')
ORDER BY table_name;

-- 3. Vérifier que les fonctions existent
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN (
  'count_active_applications',
  'accept_application',
  'approve_task_start',
  'reject_task_start'
)
ORDER BY routine_name;

-- 4. Vérifier que les politiques RLS existent
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
WHERE tablename = 'task_applications'
ORDER BY policyname;

-- 5. Vérifier que les index existent
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'task_applications'
ORDER BY indexname;

-- 6. Vérifier que le trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'task_applications'
ORDER BY trigger_name;

-- 7. Vérifier que la contrainte de statut des tâches a été mise à jour
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'tasks_status_check';

-- 8. Vérifier que les nouvelles colonnes ont été ajoutées aux tâches
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('application_deadline', 'min_applications', 'auto_approve')
ORDER BY column_name;

-- 9. Test des permissions (à exécuter avec un utilisateur authentifié)
-- SELECT has_table_privilege('task_applications', 'SELECT');
-- SELECT has_table_privilege('task_applications', 'INSERT');
-- SELECT has_table_privilege('task_applications', 'UPDATE');

-- 10. Test de la vue task_applications_with_profiles (structure)
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'task_applications_with_profiles'
ORDER BY ordinal_position;

-- 11. Test de la vue task_history (structure)
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'task_history'
ORDER BY ordinal_position;

-- 12. Vérifier que les extensions nécessaires sont activées
SELECT 
  extname,
  extversion
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'postgis');

-- ========================================
-- TESTS MANUELS (décommenter pour tester)
-- ========================================

-- Test 1: Créer une candidature de test
/*
INSERT INTO task_applications (
  task_id,
  helper_id,
  message,
  proposed_budget,
  proposed_duration
) VALUES (
  'UUID_DE_LA_TACHE', -- Remplacer par un UUID valide
  'UUID_DE_L_HELPER', -- Remplacer par un UUID valide
  'Je suis très motivé pour cette tâche !',
  50.00,
  '2 hours'
);
*/

-- Test 2: Accepter une candidature
/*
SELECT accept_application('UUID_DE_LA_CANDIDATURE');
*/

-- Test 3: Valider le démarrage d'une tâche
/*
SELECT approve_task_start('UUID_DE_LA_TACHE');
*/

-- Test 4: Rejeter le démarrage d'une tâche
/*
SELECT reject_task_start('UUID_DE_LA_TACHE');
*/

-- Test 5: Compter les candidatures actives
/*
SELECT count_active_applications('UUID_DE_LA_TACHE');
*/

-- ========================================
-- VÉRIFICATIONS POST-TEST
-- ========================================

-- Vérifier l'état des candidatures après les tests
/*
SELECT 
  ta.id,
  ta.status,
  ta.message,
  ta.proposed_budget,
  t.title as task_title,
  t.status as task_status,
  p.name as helper_name
FROM task_applications ta
JOIN tasks t ON ta.task_id = t.id
JOIN profiles p ON ta.helper_id = p.id
ORDER BY ta.created_at DESC
LIMIT 10;
*/

-- Vérifier l'historique des tâches
/*
SELECT 
  title,
  status,
  total_applications,
  accepted_applications,
  pending_applications
FROM task_history
ORDER BY created_at DESC
LIMIT 10;
*/

-- ========================================
-- NETTOYAGE (optionnel)
-- ========================================

-- Supprimer les données de test si nécessaire
/*
DELETE FROM task_applications WHERE message LIKE '%test%';
UPDATE tasks SET status = 'open', helper = NULL WHERE status = 'pending_approval';
*/
