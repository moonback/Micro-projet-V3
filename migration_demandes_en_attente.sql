-- Migration pour le système de demandes en attente
-- Appliquer ce script après la migration d'acceptation des tâches

-- 1. Créer la table des demandes en attente
CREATE TABLE IF NOT EXISTS pending_task_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    helper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ajouter un nouveau statut aux tâches
DO $$
BEGIN
    -- Vérifier si la contrainte existe et la supprimer
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_status_check' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE tasks DROP CONSTRAINT tasks_status_check;
    END IF;
    
    -- Ajouter la nouvelle contrainte avec le statut 'pending-approval'
    ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
        CHECK (status IN ('open', 'pending-approval', 'accepted', 'in-progress', 'completed', 'cancelled'));
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 3. Créer la fonction pour créer une demande en attente
CREATE OR REPLACE FUNCTION request_task_approval(
    p_task_id UUID,
    p_helper_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    task_exists BOOLEAN;
    task_status TEXT;
    task_author UUID;
    existing_request BOOLEAN;
BEGIN
    -- Vérifier que la tâche existe et est ouverte
    SELECT EXISTS(SELECT 1 FROM tasks WHERE id = p_task_id), status, author
    INTO task_exists, task_status, task_author
    FROM tasks WHERE id = p_task_id;
    
    IF NOT task_exists THEN
        RAISE EXCEPTION 'Tâche non trouvée';
    END IF;
    
    IF task_status != 'open' THEN
        RAISE EXCEPTION 'La tâche n''est pas ouverte';
    END IF;
    
    -- Vérifier que l'utilisateur n'est pas l'auteur
    IF p_helper_id = task_author THEN
        RAISE EXCEPTION 'Vous ne pouvez pas demander votre propre tâche';
    END IF;
    
    -- Vérifier qu'il n'y a pas déjà une demande en attente
    SELECT EXISTS(SELECT 1 FROM pending_task_requests WHERE task_id = p_task_id AND status = 'pending')
    INTO existing_request;
    
    IF existing_request THEN
        RAISE EXCEPTION 'Une demande est déjà en attente pour cette tâche';
    END IF;
    
    -- Créer la demande en attente
    INSERT INTO pending_task_requests (task_id, helper_id, notes)
    VALUES (p_task_id, p_helper_id, p_notes);
    
    -- Mettre à jour le statut de la tâche
    UPDATE tasks 
    SET status = 'pending-approval', updated_at = NOW()
    WHERE id = p_task_id;
    
    -- Créer une notification pour l'auteur
    PERFORM create_notification(
        task_author,
        p_task_id,
        'task_request_pending',
        'Demande d''aide en attente',
        'Un utilisateur souhaite vous aider. Vous avez 5 minutes pour répondre.'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Créer la fonction pour approuver une demande
CREATE OR REPLACE FUNCTION approve_task_request(
    p_task_id UUID,
    p_author_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    request_exists BOOLEAN;
    request_status TEXT;
    helper_id UUID;
    request_notes TEXT;
BEGIN
    -- Vérifier que la demande existe et est en attente
    SELECT EXISTS(SELECT 1 FROM pending_task_requests WHERE task_id = p_task_id AND status = 'pending'),
           status, helper_id, notes
    INTO request_exists, request_status, helper_id, request_notes
    FROM pending_task_requests WHERE task_id = p_task_id AND status = 'pending';
    
    IF NOT request_exists THEN
        RAISE EXCEPTION 'Aucune demande en attente trouvée';
    END IF;
    
    -- Vérifier que l'utilisateur est bien l'auteur de la tâche
    IF p_author_id != (SELECT author FROM tasks WHERE id = p_task_id) THEN
        RAISE EXCEPTION 'Vous n''êtes pas autorisé à approuver cette demande';
    END IF;
    
    -- Marquer la demande comme approuvée
    UPDATE pending_task_requests 
    SET status = 'approved'
    WHERE task_id = p_task_id AND status = 'pending';
    
    -- Accepter la tâche (utiliser la fonction existante)
    PERFORM accept_task(p_task_id, helper_id, request_notes);
    
    -- Créer une notification pour l'aide
    PERFORM create_notification(
        helper_id,
        p_task_id,
        'task_request_approved',
        'Demande approuvée',
        'Votre demande d''aide a été approuvée !'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Créer la fonction pour rejeter une demande
CREATE OR REPLACE FUNCTION reject_task_request(
    p_task_id UUID,
    p_author_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    request_exists BOOLEAN;
    helper_id UUID;
BEGIN
    -- Vérifier que la demande existe et est en attente
    SELECT EXISTS(SELECT 1 FROM pending_task_requests WHERE task_id = p_task_id AND status = 'pending'),
           helper_id
    INTO request_exists, helper_id
    FROM pending_task_requests WHERE task_id = p_task_id AND status = 'pending';
    
    IF NOT request_exists THEN
        RAISE EXCEPTION 'Aucune demande en attente trouvée';
    END IF;
    
    -- Vérifier que l'utilisateur est bien l'auteur de la tâche
    IF p_author_id != (SELECT author FROM tasks WHERE id = p_task_id) THEN
        RAISE EXCEPTION 'Vous n''êtes pas autorisé à rejeter cette demande';
    END IF;
    
    -- Marquer la demande comme rejetée
    UPDATE pending_task_requests 
    SET status = 'rejected'
    WHERE task_id = p_task_id AND status = 'pending';
    
    -- Remettre la tâche en statut ouvert
    UPDATE tasks 
    SET status = 'open', updated_at = NOW()
    WHERE id = p_task_id;
    
    -- Créer une notification pour l'aide
    PERFORM create_notification(
        helper_id,
        p_task_id,
        'task_request_rejected',
        'Demande rejetée',
        'Votre demande d''aide a été rejetée.'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Créer la fonction pour prolonger une demande
CREATE OR REPLACE FUNCTION extend_task_request(
    p_task_id UUID,
    p_author_id UUID,
    p_extension_minutes INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
    request_exists BOOLEAN;
    current_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Vérifier que la demande existe et est en attente
    SELECT EXISTS(SELECT 1 FROM pending_task_requests WHERE task_id = p_task_id AND status = 'pending'),
           expires_at
    INTO request_exists, current_expires_at
    FROM pending_task_requests WHERE task_id = p_task_id AND status = 'pending';
    
    IF NOT request_exists THEN
        RAISE EXCEPTION 'Aucune demande en attente trouvée';
    END IF;
    
    -- Vérifier que l'utilisateur est bien l'auteur de la tâche
    IF p_author_id != (SELECT author FROM tasks WHERE id = p_task_id) THEN
        RAISE EXCEPTION 'Vous n''êtes pas autorisé à prolonger cette demande';
    END IF;
    
    -- Prolonger la demande
    UPDATE pending_task_requests 
    SET expires_at = current_expires_at + (p_extension_minutes || ' minutes')::INTERVAL
    WHERE task_id = p_task_id AND status = 'pending';
    
    -- Créer une notification pour l'aide
    PERFORM create_notification(
        (SELECT helper_id FROM pending_task_requests WHERE task_id = p_task_id AND status = 'pending'),
        p_task_id,
        'task_request_extended',
        'Demande prolongée',
        'Le créateur a prolongé le délai de réponse de ' || p_extension_minutes || ' minutes.'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Créer la fonction pour nettoyer les demandes expirées
CREATE OR REPLACE FUNCTION cleanup_expired_requests()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Marquer les demandes expirées
    UPDATE pending_task_requests 
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Remettre les tâches expirées en statut ouvert
    UPDATE tasks 
    SET status = 'open', updated_at = NOW()
    WHERE id IN (
        SELECT task_id FROM pending_task_requests 
        WHERE status = 'expired'
    );
    
    -- Créer des notifications pour les demandes expirées
    INSERT INTO notifications (user_id, task_id, type, title, message)
    SELECT 
        helper_id,
        task_id,
        'task_request_expired',
        'Demande expirée',
        'Votre demande d''aide a expiré. La tâche est de nouveau disponible.'
    FROM pending_task_requests 
    WHERE status = 'expired';
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_pending_requests_task_id ON pending_task_requests(task_id);
CREATE INDEX IF NOT EXISTS idx_pending_requests_helper_id ON pending_task_requests(helper_id);
CREATE INDEX IF NOT EXISTS idx_pending_requests_status ON pending_task_requests(status);
CREATE INDEX IF NOT EXISTS idx_pending_requests_expires_at ON pending_task_requests(expires_at);

-- 9. Créer les politiques RLS pour pending_task_requests
ALTER TABLE pending_task_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pending requests for tasks they're involved in"
    ON pending_task_requests FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT author FROM tasks WHERE id = task_id
        )
        OR
        auth.uid() = helper_id
    );

CREATE POLICY "Users can insert pending requests"
    ON pending_task_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = helper_id);

CREATE POLICY "Authors can update pending requests"
    ON pending_task_requests FOR UPDATE
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT author FROM tasks WHERE id = task_id
        )
    );

-- 10. Donner les permissions d'exécution sur les nouvelles fonctions
GRANT EXECUTE ON FUNCTION request_task_approval(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_task_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_task_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION extend_task_request(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_requests() TO authenticated;

-- 11. Créer un trigger pour nettoyer automatiquement les demandes expirées
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_requests()
RETURNS TRIGGER AS $$
BEGIN
    -- Nettoyer les demandes expirées toutes les minutes
    IF (EXTRACT(MINUTE FROM NOW()) % 1 = 0) THEN
        PERFORM cleanup_expired_requests();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table tasks pour déclencher le nettoyage
CREATE TRIGGER cleanup_expired_requests_trigger
    AFTER INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cleanup_expired_requests();

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Système de demandes en attente installé avec succès!';
    RAISE NOTICE 'Nouvelles fonctionnalités :';
    RAISE NOTICE '- Demande d''approbation avec délai de 5 minutes';
    RAISE NOTICE '- Approuver/Rejeter/Prolonger les demandes';
    RAISE NOTICE '- Nettoyage automatique des demandes expirées';
END $$;
