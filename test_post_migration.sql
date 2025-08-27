-- Script de test post-migration pour vérifier le bon fonctionnement
-- Exécutez ce script après avoir appliqué la migration et vérifié qu'elle s'est bien passée

-- 1. Test des nouvelles colonnes
SELECT 
    'Test colonnes updated_at' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'updated_at')
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result;

-- 2. Test des nouvelles tables
SELECT 
    'Test nouvelles tables' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_acceptances')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result;

-- 3. Test des nouvelles fonctions
SELECT 
    'Test fonctions PostgreSQL' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'accept_task')
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'start_task')
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'complete_task')
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_notification')
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result;

-- 4. Test des nouvelles vues
SELECT 
    'Test nouvelles vues' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_task_stats')
        AND EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'task_details')
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result;

-- 5. Test des triggers
SELECT 
    'Test triggers updated_at' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_profiles_updated_at')
        AND EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_tasks_updated_at')
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result;

-- 6. Test des index
SELECT 
    'Test nouveaux index' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'tasks_author_idx')
        AND EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'task_acceptances_task_id_idx')
        AND EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'notifications_user_id_idx')
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result;

-- 7. Test des politiques RLS
SELECT 
    'Test politiques RLS' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_acceptances')
        AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications')
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result;

-- 8. Test de la fonction create_notification (sans paramètres réels)
SELECT 
    'Test fonction create_notification' as test_name,
    CASE 
        WHEN pg_get_function_identity_arguments(oid) = 'p_user_id uuid, p_task_id uuid, p_type text, p_title text, p_message text'
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result
FROM pg_proc WHERE proname = 'create_notification';

-- 9. Test de la fonction accept_task (sans paramètres réels)
SELECT 
    'Test fonction accept_task' as test_name,
    CASE 
        WHEN pg_get_function_identity_arguments(oid) = 'p_task_id uuid, p_helper_id uuid, p_notes text'
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result
FROM pg_proc WHERE proname = 'accept_task';

-- 10. Test des contraintes de validation
SELECT 
    'Test contraintes de validation' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'tasks_status_check')
        AND EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name LIKE '%status%')
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result;

-- 11. Test des permissions des fonctions
SELECT 
    'Test permissions fonctions' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routine_privileges 
            WHERE routine_name = 'accept_task' AND privilege_type = 'EXECUTE'
        )
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result;

-- 12. Test de la structure des nouvelles tables
SELECT 
    'Test structure task_acceptances' as test_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'task_acceptances') >= 6
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result;

SELECT 
    'Test structure notifications' as test_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notifications') >= 8
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result;

-- 13. Test des vues (sans données)
SELECT 
    'Test exécution vues' as test_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM user_task_stats) >= 0
        AND (SELECT COUNT(*) FROM task_details) >= 0
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result;

-- 14. Test des triggers (vérification de la logique)
SELECT 
    'Test logique triggers' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'update_profiles_updated_at' 
            AND tgrelid = 'profiles'::regclass
        )
        AND EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'update_tasks_updated_at' 
            AND tgrelid = 'tasks'::regclass
        )
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result;

-- 15. Test de la sécurité des fonctions
SELECT 
    'Test sécurité fonctions' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE p.proname IN ('accept_task', 'start_task', 'complete_task', 'create_notification')
            AND p.prosecdef = true  -- SECURITY DEFINER
        )
        THEN '✅ SUCCÈS' 
        ELSE '❌ ÉCHEC' 
    END as result;

-- Résumé final des tests
DO $$
DECLARE
    total_tests INTEGER := 15;
    passed_tests INTEGER := 0;
    test_result TEXT;
BEGIN
    -- Compter les tests réussis (simulation basée sur les vérifications précédentes)
    SELECT COUNT(*) INTO passed_tests FROM (
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'updated_at')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_acceptances')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'accept_task')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'start_task')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'complete_task')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_notification')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_task_stats')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'task_details')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_profiles_updated_at')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_tasks_updated_at')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'tasks_author_idx')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_acceptances')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'tasks_status_check')
    ) test_results;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== RÉSUMÉ DES TESTS POST-MIGRATION ===';
    RAISE NOTICE 'Tests exécutés: %', total_tests;
    RAISE NOTICE 'Tests réussis: %', passed_tests;
    RAISE NOTICE 'Taux de succès: %%%', ROUND((passed_tests::DECIMAL / total_tests) * 100, 1);
    
    IF passed_tests >= total_tests * 0.9 THEN
        RAISE NOTICE '🎉 MIGRATION RÉUSSIE ! Le système d''acceptation des tâches est opérationnel.';
        RAISE NOTICE 'Vous pouvez maintenant tester les fonctionnalités dans votre application React.';
    ELSIF passed_tests >= total_tests * 0.7 THEN
        RAISE NOTICE '⚠️  MIGRATION PARTIELLEMENT RÉUSSIE. Vérifiez les erreurs ci-dessus.';
    ELSE
        RAISE NOTICE '❌ MIGRATION ÉCHOUÉE. Vérifiez les erreurs et relancez la migration.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Prochaines étapes :';
    RAISE NOTICE '1. Redémarrez votre application React';
    RAISE NOTICE '2. Testez l''acceptation d''une tâche';
    RAISE NOTICE '3. Vérifiez que les notifications apparaissent';
    RAISE NOTICE '4. Testez le cycle complet des tâches';
END $$;
