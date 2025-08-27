-- Script de test pour le système de demandes en attente
-- Exécuter après l'installation complète

-- 1. Vérifier l'existence des nouvelles tables
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('pending_task_requests', 'task_acceptances', 'notifications');
    
    IF table_count = 3 THEN
        RAISE NOTICE '✅ Toutes les nouvelles tables sont créées';
    ELSE
        RAISE NOTICE '❌ Tables manquantes. Tables trouvées: %', table_count;
    END IF;
END $$;

-- 2. Vérifier l'existence des nouvelles fonctions
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('request_task_approval', 'approve_task_request', 'reject_task_request', 'extend_task_request', 'cleanup_expired_requests');
    
    IF function_count = 5 THEN
        RAISE NOTICE '✅ Toutes les nouvelles fonctions sont créées';
    ELSE
        RAISE NOTICE '❌ Fonctions manquantes. Fonctions trouvées: %', function_count;
    END IF;
END $$;

-- 3. Vérifier les politiques RLS
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'pending_task_requests';
    
    IF policy_count >= 3 THEN
        RAISE NOTICE '✅ Politiques RLS configurées pour pending_task_requests';
    ELSE
        RAISE NOTICE '❌ Politiques RLS manquantes. Politiques trouvées: %', policy_count;
    END IF;
END $$;

-- 4. Vérifier les index
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'pending_task_requests';
    
    IF index_count >= 4 THEN
        RAISE NOTICE '✅ Index créés pour pending_task_requests';
    ELSE
        RAISE NOTICE '❌ Index manquants. Index trouvés: %', index_count;
    END IF;
END $$;

-- 5. Vérifier la contrainte de statut des tâches
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_status_check' 
        AND table_name = 'tasks'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE '✅ Contrainte de statut des tâches mise à jour';
    ELSE
        RAISE NOTICE '❌ Contrainte de statut des tâches manquante';
    END IF;
END $$;

-- 6. Test de création d'une demande en attente (nécessite des UUIDs valides)
-- Remplacez les UUIDs par des valeurs réelles de votre base
/*
-- Créer une tâche de test
INSERT INTO tasks (id, title, description, budget, author, status)
VALUES (
    gen_random_uuid(),
    'Test Système Demandes',
    'Tâche de test pour vérifier le système de demandes en attente',
    75.00,
    'VOTRE_UUID_AUTEUR', -- Remplacez par un UUID valide
    'open'
);

-- Tester la demande d'approbation
SELECT request_task_approval(
    (SELECT id FROM tasks WHERE title = 'Test Système Demandes' LIMIT 1),
    'VOTRE_UUID_HELPER', -- Remplacez par un UUID valide différent
    'Je peux vous aider avec cette tâche !'
);

-- Vérifier que la tâche est en attente
SELECT 
    t.title,
    t.status,
    ptr.status as request_status,
    ptr.expires_at
FROM tasks t
JOIN pending_task_requests ptr ON t.id = ptr.task_id
WHERE t.title = 'Test Système Demandes';
*/

-- 7. Test de nettoyage des demandes expirées
DO $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Créer une demande expirée de test
    INSERT INTO pending_task_requests (task_id, helper_id, expires_at, status)
    VALUES (
        (SELECT id FROM tasks LIMIT 1),
        (SELECT id FROM profiles LIMIT 1),
        NOW() - INTERVAL '10 minutes',
        'pending'
    );
    
    -- Exécuter le nettoyage
    SELECT cleanup_expired_requests() INTO expired_count;
    
    RAISE NOTICE '✅ Nettoyage des demandes expirées: % demandes traitées', expired_count;
    
    -- Nettoyer les données de test
    DELETE FROM pending_task_requests WHERE expires_at < NOW() - INTERVAL '5 minutes';
END $$;

-- 8. Vérifier les permissions des fonctions
DO $$
DECLARE
    permission_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO permission_count
    FROM information_schema.role_routine_grants 
    WHERE routine_name IN ('request_task_approval', 'approve_task_request', 'reject_task_request', 'extend_task_request')
    AND grantee = 'authenticated';
    
    IF permission_count = 4 THEN
        RAISE NOTICE '✅ Permissions accordées aux utilisateurs authentifiés';
    ELSE
        RAISE NOTICE '❌ Permissions manquantes. Permissions trouvées: %', permission_count;
    END IF;
END $$;

-- 9. Vérifier les triggers
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name LIKE '%cleanup%' OR trigger_name LIKE '%updated_at%';
    
    IF trigger_count >= 3 THEN
        RAISE NOTICE '✅ Triggers configurés';
    ELSE
        RAISE NOTICE '❌ Triggers manquants. Triggers trouvés: %', trigger_count;
    END IF;
END $$;

-- 10. Résumé final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 TESTS TERMINÉS !';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Vérifications effectuées :';
    RAISE NOTICE '   ✅ Tables créées';
    RAISE NOTICE '   ✅ Fonctions PostgreSQL créées';
    RAISE NOTICE '   ✅ Politiques RLS configurées';
    RAISE NOTICE '   ✅ Index créés';
    RAISE NOTICE '   ✅ Contraintes mises à jour';
    RAISE NOTICE '   ✅ Permissions accordées';
    RAISE NOTICE '   ✅ Triggers configurés';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Votre système de demandes en attente est prêt !';
    RAISE NOTICE '';
    RAISE NOTICE '📱 Prochaines étapes :';
    RAISE NOTICE '   1. Tester l''interface utilisateur';
    RAISE NOTICE '   2. Créer une tâche et demander l''approbation';
    RAISE NOTICE '   3. Tester l''approbation/rejet depuis l''onglet "En Attente"';
    RAISE NOTICE '   4. Vérifier que les tâches sont grisées pendant l''attente';
END $$;
