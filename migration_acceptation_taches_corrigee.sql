-- Migration pour le système d'acceptation des tâches (CORRIGÉE)
-- Appliquer ce script sur votre base de données existante

-- 1. Ajouter les colonnes updated_at
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Créer la table des acceptations de tâches
CREATE TABLE IF NOT EXISTS task_acceptances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    helper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer la table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ajouter la contrainte CHECK pour le statut des tâches (CORRIGÉ)
-- Supprimer d'abord la contrainte si elle existe, puis la recréer
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
    
    -- Ajouter la nouvelle contrainte
    ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
        CHECK (status IN ('open', 'accepted', 'in-progress', 'completed', 'cancelled'));
EXCEPTION
    WHEN OTHERS THEN
        -- Si une erreur survient, ignorer et continuer
        NULL;
END $$;

-- 5. Créer la fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer les triggers pour updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Créer la fonction de création de notifications
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_task_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, task_id, type, title, message)
    VALUES (p_user_id, p_task_id, p_type, p_title, p_message)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Créer la fonction d'acceptation de tâche
CREATE OR REPLACE FUNCTION accept_task(
    p_task_id UUID,
    p_helper_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    task_exists BOOLEAN;
    task_status TEXT;
    task_author UUID;
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
        RAISE EXCEPTION 'Vous ne pouvez pas accepter votre propre tâche';
    END IF;
    
    -- Mettre à jour le statut de la tâche
    UPDATE tasks 
    SET status = 'accepted', helper = p_helper_id, updated_at = NOW()
    WHERE id = p_task_id;
    
    -- Enregistrer l'acceptation
    INSERT INTO task_acceptances (task_id, helper_id, notes)
    VALUES (p_task_id, p_helper_id, p_notes);
    
    -- Créer une notification pour l'auteur
    PERFORM create_notification(
        task_author,
        p_task_id,
        'task_accepted',
        'Tâche acceptée',
        'Votre tâche a été acceptée par un utilisateur'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Créer la fonction de démarrage de tâche
CREATE OR REPLACE FUNCTION start_task(
    p_task_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    task_exists BOOLEAN;
    task_status TEXT;
    task_author UUID;
    task_helper UUID;
BEGIN
    -- Vérifier que la tâche existe et est acceptée
    SELECT EXISTS(SELECT 1 FROM tasks WHERE id = p_task_id), status, author, helper
    INTO task_exists, task_status, task_author, task_helper
    FROM tasks WHERE id = p_task_id;
    
    IF NOT task_exists THEN
        RAISE EXCEPTION 'Tâche non trouvée';
    END IF;
    
    IF task_status != 'accepted' THEN
        RAISE EXCEPTION 'La tâche doit être acceptée pour être démarrée';
    END IF;
    
    -- Mettre à jour le statut de la tâche
    UPDATE tasks 
    SET status = 'in-progress', updated_at = NOW()
    WHERE id = p_task_id;
    
    -- Créer une notification pour l'auteur
    PERFORM create_notification(
        task_author,
        p_task_id,
        'task_started',
        'Tâche démarrée',
        'Votre tâche a été démarrée par l''utilisateur qui l''a acceptée'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Créer la fonction de finalisation de tâche
CREATE OR REPLACE FUNCTION complete_task(
    p_task_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    task_exists BOOLEAN;
    task_status TEXT;
    task_author UUID;
    task_helper UUID;
BEGIN
    -- Vérifier que la tâche existe et est en cours
    SELECT EXISTS(SELECT 1 FROM tasks WHERE id = p_task_id), status, author, helper
    INTO task_exists, task_status, task_author, task_helper
    FROM tasks WHERE id = p_task_id;
    
    IF NOT task_exists THEN
        RAISE EXCEPTION 'Tâche non trouvée';
    END IF;
    
    IF task_status != 'in-progress' THEN
        RAISE EXCEPTION 'La tâche doit être en cours pour être finalisée';
    END IF;
    
    -- Mettre à jour le statut de la tâche
    UPDATE tasks 
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_task_id;
    
    -- Mettre à jour le statut de l'acceptation
    UPDATE task_acceptances 
    SET status = 'completed'
    WHERE task_id = p_task_id AND helper_id = task_helper;
    
    -- Créer une notification pour l'auteur
    PERFORM create_notification(
        task_author,
        p_task_id,
        'task_completed',
        'Tâche terminée',
        'Votre tâche a été marquée comme terminée'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Créer la vue des statistiques utilisateur (CORRIGÉ)
-- Supprimer d'abord la vue existante pour éviter les conflits de colonnes
DROP VIEW IF EXISTS user_task_stats CASCADE;
CREATE VIEW user_task_stats AS
SELECT 
    p.id as user_id,
    p.name,
    COUNT(CASE WHEN t.status = 'open' THEN 1 END) as open_tasks,
    COUNT(CASE WHEN t.status = 'accepted' THEN 1 END) as accepted_tasks,
    COUNT(CASE WHEN t.status = 'in-progress' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'cancelled' THEN 1 END) as cancelled_tasks,
    COUNT(CASE WHEN ta.status = 'active' THEN 1 END) as active_helping,
    COUNT(CASE WHEN ta.status = 'completed' THEN 1 END) as completed_helping
FROM profiles p
LEFT JOIN tasks t ON p.id = t.author
LEFT JOIN task_acceptances ta ON p.id = ta.helper_id
GROUP BY p.id, p.name;

-- 12. Créer la vue des détails des tâches (CORRIGÉ)
-- Supprimer d'abord la vue existante pour éviter les conflits de colonnes
DROP VIEW IF EXISTS task_details CASCADE;
CREATE VIEW task_details AS
SELECT 
    t.*,
    p_author.name as author_name,
    p_author.avatar_url as author_avatar,
    p_author.rating as author_rating,
    p_helper.name as helper_name,
    p_helper.avatar_url as helper_avatar,
    p_helper.rating as helper_rating,
    ta.accepted_at,
    ta.notes as acceptance_notes,
    ta.status as acceptance_status
FROM tasks t
LEFT JOIN profiles p_author ON t.author = p_author.id
LEFT JOIN profiles p_helper ON t.helper = p_helper.id
LEFT JOIN task_acceptances ta ON t.id = ta.task_id AND ta.status = 'active';

-- 13. Créer les index
CREATE INDEX IF NOT EXISTS idx_task_acceptances_task_id ON task_acceptances(task_id);
CREATE INDEX IF NOT EXISTS idx_task_acceptances_helper_id ON task_acceptances(helper_id);
CREATE INDEX IF NOT EXISTS idx_task_acceptances_status ON task_acceptances(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_task_id ON notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_helper ON tasks(helper);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);

-- 14. Mettre à jour les politiques RLS existantes pour les tâches
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
CREATE POLICY "Users can view all tasks"
    ON tasks FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
CREATE POLICY "Users can insert their own tasks"
    ON tasks FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author);

DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
CREATE POLICY "Users can update their own tasks"
    ON tasks FOR UPDATE
    TO authenticated
    USING (auth.uid() = author)
    WITH CHECK (auth.uid() = author);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
CREATE POLICY "Users can delete their own tasks"
    ON tasks FOR DELETE
    TO authenticated
    USING (auth.uid() = author);

-- 15. Créer les politiques RLS pour task_acceptances (CORRIGÉES)
-- CORRECTION: Remplacer la politique problématique par une version simple
DROP POLICY IF EXISTS "Users can view task acceptances for tasks they're involved in" ON task_acceptances;
CREATE POLICY "Users can view task acceptances for tasks they're involved in"
    ON task_acceptances FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT author FROM tasks WHERE id = task_id
        )
        OR
        auth.uid() = helper_id
    );

CREATE POLICY "Users can insert task acceptances"
    ON task_acceptances FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = helper_id);

CREATE POLICY "Users can update task acceptances they're involved in"
    ON task_acceptances FOR UPDATE
    TO authenticated
    USING (auth.uid() = helper_id)
    WITH CHECK (auth.uid() = helper_id);

-- 16. Créer les politiques RLS pour notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
CREATE POLICY "Users can insert notifications"
    ON notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 17. Activer RLS sur les nouvelles tables
ALTER TABLE task_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 18. Donner les permissions d'exécution sur les fonctions
GRANT EXECUTE ON FUNCTION accept_task(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION start_task(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_task(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;

-- 19. Donner les permissions sur les vues
GRANT SELECT ON user_task_stats TO authenticated;
GRANT SELECT ON task_details TO authenticated;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration d''acceptation des tâches appliquée avec succès!';
    RAISE NOTICE 'Les nouvelles fonctionnalités sont maintenant disponibles.';
END $$;
