-- Migration incrémentale pour ajouter le système d'acceptation des tâches
-- Ce script peut être exécuté sur votre base de données existante sans conflit

-- 1. Ajouter la colonne updated_at aux tables existantes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Créer la table des acceptations de tâches (nouvelle)
CREATE TABLE IF NOT EXISTS task_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    helper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer la table des notifications (nouvelle)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('task_accepted', 'task_started', 'task_completed', 'message_received', 'review_received')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ajouter des contraintes de validation au statut des tâches
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
    CHECK (status IN ('open', 'accepted', 'in-progress', 'completed', 'cancelled'));

-- 5. Créer les triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;

-- Créer les nouveaux triggers
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Créer les nouvelles fonctions PostgreSQL
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
        RAISE EXCEPTION 'La tâche doit être en cours pour être terminée';
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

-- 7. Créer les vues pour simplifier les requêtes
CREATE OR REPLACE VIEW user_task_stats AS
SELECT 
    p.id as user_id,
    p.name,
    COUNT(CASE WHEN t.status = 'open' THEN 1 END) as open_tasks,
    COUNT(CASE WHEN t.status = 'accepted' THEN 1 END) as accepted_tasks,
    COUNT(CASE WHEN t.status = 'in-progress' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.helper = p.id THEN 1 END) as helping_tasks,
    AVG(CASE WHEN r.reviewee = p.id THEN r.rating END) as average_rating,
    COUNT(CASE WHEN r.reviewee = p.id THEN 1 END) as review_count
FROM profiles p
LEFT JOIN tasks t ON p.id = t.author
LEFT JOIN reviews r ON p.id = r.reviewee
GROUP BY p.id, p.name;

CREATE OR REPLACE VIEW task_details AS
SELECT 
    t.*,
    p_author.name as author_name,
    p_author.rating as author_rating,
    p_helper.name as helper_name,
    p_helper.rating as helper_rating,
    ta.accepted_at,
    ta.notes as acceptance_notes,
    ST_AsText(t.location) as location_text,
    ST_X(t.location) as longitude,
    ST_Y(t.location) as latitude
FROM tasks t
LEFT JOIN profiles p_author ON t.author = p_author.id
LEFT JOIN profiles p_helper ON t.helper = p_helper.id
LEFT JOIN task_acceptances ta ON t.id = ta.task_id AND ta.status = 'active';

-- 8. Ajouter les nouveaux index pour optimiser les performances
CREATE INDEX IF NOT EXISTS tasks_author_idx ON tasks (author);
CREATE INDEX IF NOT EXISTS tasks_helper_idx ON tasks (helper);
CREATE INDEX IF NOT EXISTS tasks_category_idx ON tasks (category);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks (created_at DESC);

CREATE INDEX IF NOT EXISTS task_acceptances_task_id_idx ON task_acceptances (task_id);
CREATE INDEX IF NOT EXISTS task_acceptances_helper_id_idx ON task_acceptances (helper_id);
CREATE INDEX IF NOT EXISTS task_acceptances_status_idx ON task_acceptances (status);

CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages (sender);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications (is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications (created_at DESC);

-- 9. Mettre à jour les politiques RLS existantes et en ajouter de nouvelles
-- Politiques pour task_acceptances
ALTER TABLE task_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task acceptances for tasks they're involved in"
    ON task_acceptances FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT author FROM tasks WHERE id = task_id
            UNION
            SELECT helper_id FROM task_acceptances WHERE task_id = task_acceptances.task_id
        )
    );

CREATE POLICY "Helpers can update their own task acceptances"
    ON task_acceptances FOR UPDATE
    TO authenticated
    USING (auth.uid() = helper_id);

-- Politiques pour notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Mettre à jour la politique des tâches pour permettre l'acceptation
DROP POLICY IF EXISTS "Authors and helpers can update tasks" ON tasks;
CREATE POLICY "Authors and helpers can update tasks"
    ON tasks FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = author OR 
        auth.uid() = helper OR
        (status = 'open' AND auth.uid() != author) -- Permettre l'acceptation
    );

-- 10. Donner les permissions nécessaires aux fonctions
GRANT EXECUTE ON FUNCTION accept_task(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION start_task(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_task(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration terminée avec succès !';
    RAISE NOTICE 'Nouvelles fonctionnalités ajoutées :';
    RAISE NOTICE '- Système d''acceptation des tâches';
    RAISE NOTICE '- Notifications automatiques';
    RAISE NOTICE '- Vues optimisées pour les statistiques';
    RAISE NOTICE '- Fonctions PostgreSQL pour la gestion des tâches';
END $$;
