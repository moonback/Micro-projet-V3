-- Test du Système d'Acceptation des Tâches
-- À exécuter dans l'interface SQL de Supabase après avoir appliqué la migration

-- 1. Vérifier que la table task_applications existe
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'task_applications'
ORDER BY ordinal_position;

-- 2. Vérifier que les vues sont créées
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('task_applications_with_profiles', 'task_history')
ORDER BY table_name;

-- 3. Vérifier que les fonctions sont créées
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN (
    'accept_application',
    'approve_task_start',
    'reject_task_start',
    'count_active_applications'
)
ORDER BY routine_name;

-- 4. Vérifier que les politiques RLS sont actives
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'task_applications';

SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'task_applications';

-- 5. Insérer des données de test (remplacer les UUIDs par des valeurs réelles)
-- Note: Exécuter ces commandes seulement si vous avez des utilisateurs et tâches existants

-- Créer une candidature de test
-- INSERT INTO task_applications (task_id, helper_id, message, proposed_budget) 
-- VALUES (
--     'UUID_DE_LA_TACHE', -- Remplacer par un UUID de tâche existante
--     'UUID_DE_L_UTILISATEUR', -- Remplacer par un UUID d'utilisateur existant
--     'Je suis très motivé pour cette tâche et j\'ai l\'expérience nécessaire.',
--     45.00
-- );

-- 6. Tester la fonction de comptage des candidatures
-- SELECT count_active_applications('UUID_DE_LA_TACHE');

-- 7. Tester la fonction d'acceptation d'une candidature
-- SELECT accept_application('UUID_DE_LA_CANDIDATURE');

-- 8. Vérifier que la tâche est passée en statut "pending_approval"
-- SELECT id, title, status, helper, assigned_at FROM tasks WHERE id = 'UUID_DE_LA_TACHE';

-- 9. Tester la fonction de validation du démarrage
-- SELECT approve_task_start('UUID_DE_LA_TACHE');

-- 10. Vérifier que la tâche est passée en statut "in_progress"
-- SELECT id, title, status, started_at FROM tasks WHERE id = 'UUID_DE_LA_TACHE';

-- 11. Tester la fonction de rejet du démarrage
-- SELECT reject_task_start('UUID_DE_LA_TACHE');

-- 12. Vérifier que la tâche est revenue en statut "open"
-- SELECT id, title, status, helper, assigned_at FROM tasks WHERE id = 'UUID_DE_LA_TACHE';

-- 13. Vérifier les vues
-- SELECT * FROM task_applications_with_profiles LIMIT 5;
-- SELECT * FROM task_history LIMIT 5;

-- 14. Vérifier les contraintes de la table tasks
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%tasks%';

-- 15. Vérifier les index
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'task_applications';

-- 16. Vérifier les triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'task_applications';

-- Résumé des tests à effectuer manuellement :
-- 1. Créer une tâche en tant qu'utilisateur A
-- 2. Se connecter en tant qu'utilisateur B et candidater
-- 3. Se reconnecter en tant qu'utilisateur A et accepter la candidature
-- 4. Vérifier que la tâche passe en "pending_approval"
-- 5. Valider le démarrage de la tâche
-- 6. Vérifier que la tâche passe en "in_progress"
-- 7. Tester le rejet et la remise en "open"
