-- Script de vérification de la migration d'acceptation des tâches
-- Exécutez ce script après avoir appliqué migration_acceptation_taches.sql

-- 1. Vérifier que les nouvelles colonnes ont été ajoutées
SELECT 
    'profiles.updated_at' as column_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN '✅ Ajoutée' ELSE '❌ Manquante' END as status
UNION ALL
SELECT 
    'tasks.updated_at' as column_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'updated_at'
    ) THEN '✅ Ajoutée' ELSE '❌ Manquante' END as status;

-- 2. Vérifier que les nouvelles tables existent
SELECT 
    table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = table_name
    ) THEN '✅ Existe' ELSE '❌ Manquante' END as status
FROM (VALUES 
    ('task_acceptances'),
    ('notifications')
) as t(table_name);

-- 3. Vérifier que les fonctions PostgreSQL existent
SELECT 
    routine_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = routine_name
    ) THEN '✅ Existe' ELSE '❌ Manquante' END as status
FROM (VALUES 
    ('accept_task'),
    ('start_task'),
    ('complete_task'),
    ('create_notification'),
    ('update_updated_at_column')
) as f(routine_name);

-- 4. Vérifier que les vues existent
SELECT 
    table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = table_name
    ) THEN '✅ Existe' ELSE '❌ Manquante' END as status
FROM (VALUES 
    ('user_task_stats'),
    ('task_details')
) as v(table_name);

-- 5. Vérifier que les triggers existent
SELECT 
    trigger_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = trigger_name
    ) THEN '✅ Existe' ELSE '❌ Manquante' END as status
FROM (VALUES 
    ('update_profiles_updated_at'),
    ('update_tasks_updated_at')
) as tr(trigger_name);

-- 6. Vérifier que les index existent
SELECT 
    index_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = index_name
    ) THEN '✅ Existe' ELSE '❌ Manquante' END as status
FROM (VALUES 
    ('tasks_author_idx'),
    ('tasks_helper_idx'),
    ('tasks_category_idx'),
    ('tasks_created_at_idx'),
    ('task_acceptances_task_id_idx'),
    ('task_acceptances_helper_id_idx'),
    ('task_acceptances_status_idx'),
    ('notifications_user_id_idx'),
    ('notifications_is_read_idx'),
    ('notifications_created_at_idx')
) as idx(index_name);

-- 7. Vérifier que les politiques RLS existent
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE WHEN policyname IS NOT NULL THEN '✅ Existe' ELSE '❌ Manquante' END as status
FROM pg_tables pt
LEFT JOIN pg_policies pp ON pt.tablename = pp.tablename
WHERE pt.tablename IN ('task_acceptances', 'notifications')
ORDER BY pt.tablename, pp.policyname;

-- 8. Vérifier la structure des nouvelles tables
-- Structure de task_acceptances
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'task_acceptances'
ORDER BY ordinal_position;

-- Structure de notifications
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 9. Vérifier les contraintes de validation
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('tasks', 'task_acceptances', 'notifications')
ORDER BY tc.table_name, tc.constraint_type;

-- 10. Test de performance des nouvelles vues
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM user_task_stats LIMIT 10;
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM task_details LIMIT 10;

-- 11. Vérifier les permissions des fonctions
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name IN ('accept_task', 'start_task', 'complete_task', 'create_notification')
ORDER BY routine_name;

-- Message de résumé
DO $$
DECLARE
    total_checks INTEGER := 0;
    passed_checks INTEGER := 0;
BEGIN
    -- Compter les vérifications
    SELECT COUNT(*) INTO total_checks FROM (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at'
        UNION ALL
        SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'updated_at'
        UNION ALL
        SELECT 1 FROM information_schema.tables WHERE table_name = 'task_acceptances'
        UNION ALL
        SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications'
        UNION ALL
        SELECT 1 FROM information_schema.routines WHERE routine_name = 'accept_task'
        UNION ALL
        SELECT 1 FROM information_schema.routines WHERE routine_name = 'start_task'
        UNION ALL
        SELECT 1 FROM information_schema.routines WHERE routine_name = 'complete_task'
        UNION ALL
        SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_notification'
        UNION ALL
        SELECT 1 FROM information_schema.views WHERE table_name = 'user_task_stats'
        UNION ALL
        SELECT 1 FROM information_schema.views WHERE table_name = 'task_details'
    ) checks;
    
    -- Compter les vérifications réussies
    SELECT COUNT(*) INTO passed_checks FROM (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at'
        UNION ALL
        SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'updated_at'
        UNION ALL
        SELECT 1 FROM information_schema.tables WHERE table_name = 'task_acceptances'
        UNION ALL
        SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications'
        UNION ALL
        SELECT 1 FROM information_schema.routines WHERE routine_name = 'accept_task'
        UNION ALL
        SELECT 1 FROM information_schema.routines WHERE routine_name = 'start_task'
        UNION ALL
        SELECT 1 FROM information_schema.routines WHERE routine_name = 'complete_task'
        UNION ALL
        SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_notification'
        UNION ALL
        SELECT 1 FROM information_schema.views WHERE table_name = 'user_task_stats'
        UNION ALL
        SELECT 1 FROM information_schema.views WHERE table_name = 'task_details'
    ) passed;
    
    RAISE NOTICE '=== RÉSUMÉ DE LA VÉRIFICATION ===';
    RAISE NOTICE 'Vérifications totales: %', total_checks;
    RAISE NOTICE 'Vérifications réussies: %', passed_checks;
    RAISE NOTICE 'Taux de succès: %%%', ROUND((passed_checks::DECIMAL / total_checks) * 100, 1);
    
    IF passed_checks = total_checks THEN
        RAISE NOTICE '✅ TOUTES LES VÉRIFICATIONS ONT RÉUSSI ! La migration est complète.';
    ELSE
        RAISE NOTICE '⚠️  Certaines vérifications ont échoué. Vérifiez les erreurs ci-dessus.';
    END IF;
END $$;
