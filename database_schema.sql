-- Schéma de base de données pour MicroTask avec gestion complète des acceptations

-- Extension PostGIS pour la géolocalisation
CREATE EXTENSION IF NOT EXISTS postgis;

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tâches
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    budget DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    deadline TIMESTAMP WITH TIME ZONE,
    location GEOGRAPHY(POINT, 4326),
    address TEXT,
    author UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'in-progress', 'completed', 'cancelled')),
    helper UUID REFERENCES profiles(id) ON DELETE SET NULL,
    stripe_payment_intent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des acceptations de tâches (historique complet)
CREATE TABLE IF NOT EXISTS task_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    helper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    sender UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des évaluations
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reviewer UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications
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

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS tasks_location_idx ON tasks USING GIST (location);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks (status);
CREATE INDEX IF NOT EXISTS tasks_author_idx ON tasks (author);
CREATE INDEX IF NOT EXISTS tasks_helper_idx ON tasks (helper);
CREATE INDEX IF NOT EXISTS tasks_category_idx ON tasks (category);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks (created_at DESC);

CREATE INDEX IF NOT EXISTS task_acceptances_task_id_idx ON task_acceptances (task_id);
CREATE INDEX IF NOT EXISTS task_acceptances_helper_id_idx ON task_acceptances (helper_id);
CREATE INDEX IF NOT EXISTS task_acceptances_status_idx ON task_acceptances (status);

CREATE INDEX IF NOT EXISTS messages_task_id_idx ON messages (task_id);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages (sender);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications (is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications (created_at DESC);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer une notification
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
$$ LANGUAGE plpgsql;

-- Fonction pour accepter une tâche
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
$$ LANGUAGE plpgsql;

-- Fonction pour démarrer une tâche
CREATE OR REPLACE FUNCTION start_task(p_task_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    task_status TEXT;
    task_helper UUID;
    task_author UUID;
BEGIN
    -- Vérifier le statut et récupérer les informations
    SELECT status, helper, author
    INTO task_status, task_helper, task_author
    FROM tasks WHERE id = p_task_id;
    
    IF task_status != 'accepted' THEN
        RAISE EXCEPTION 'La tâche doit être acceptée pour être démarrée';
    END IF;
    
    -- Mettre à jour le statut
    UPDATE tasks 
    SET status = 'in-progress', updated_at = NOW()
    WHERE id = p_task_id;
    
    -- Créer une notification pour l'auteur
    PERFORM create_notification(
        task_author,
        p_task_id,
        'task_started',
        'Tâche démarrée',
        'L''utilisateur a commencé votre tâche'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour terminer une tâche
CREATE OR REPLACE FUNCTION complete_task(p_task_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    task_status TEXT;
    task_helper UUID;
    task_author UUID;
BEGIN
    -- Vérifier le statut et récupérer les informations
    SELECT status, helper, author
    INTO task_status, task_helper, task_author
    FROM tasks WHERE id = p_task_id;
    
    IF task_status != 'in-progress' THEN
        RAISE EXCEPTION 'La tâche doit être en cours pour être terminée';
    END IF;
    
    -- Mettre à jour le statut
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
        'Votre tâche a été terminée avec succès'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) pour la sécurité
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques RLS pour tasks
CREATE POLICY "Users can view all tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = author);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = author);
CREATE POLICY "Helpers can update accepted tasks" ON tasks FOR UPDATE USING (auth.uid() = helper);

-- Politiques RLS pour task_acceptances
CREATE POLICY "Users can view task acceptances" ON task_acceptances FOR SELECT USING (true);
CREATE POLICY "Users can insert own acceptances" ON task_acceptances FOR INSERT WITH CHECK (auth.uid() = helper_id);

-- Politiques RLS pour messages
CREATE POLICY "Users can view messages for accessible tasks" ON messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tasks 
        WHERE tasks.id = messages.task_id 
        AND (tasks.author = auth.uid() OR tasks.helper = auth.uid())
    )
);
CREATE POLICY "Users can insert messages for accessible tasks" ON messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM tasks 
        WHERE tasks.id = messages.task_id 
        AND (tasks.author = auth.uid() OR tasks.helper = auth.uid())
    )
);

-- Politiques RLS pour notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Vues utiles pour l'application
CREATE OR REPLACE VIEW user_task_stats AS
SELECT 
    p.id as user_id,
    p.name,
    COUNT(DISTINCT t.id) as total_tasks_created,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks_created,
    COUNT(DISTINCT ta.task_id) as total_tasks_accepted,
    COUNT(DISTINCT CASE WHEN ta.status = 'completed' THEN ta.task_id END) as completed_tasks_accepted,
    COALESCE(SUM(CASE WHEN ta.status = 'completed' THEN t.budget END), 0) as total_earned,
    COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.budget END), 0) as total_spent,
    COUNT(DISTINCT m.id) as total_messages_sent
FROM profiles p
LEFT JOIN tasks t ON p.id = t.author
LEFT JOIN task_acceptances ta ON p.id = ta.helper_id
LEFT JOIN messages m ON p.id = m.sender
GROUP BY p.id, p.name;

-- Vue pour les tâches avec informations complètes
CREATE OR REPLACE VIEW task_details AS
SELECT 
    t.*,
    author_profile.name as author_name,
    author_profile.avatar_url as author_avatar,
    author_profile.rating as author_rating,
    helper_profile.name as helper_name,
    helper_profile.avatar_url as helper_avatar,
    helper_profile.rating as helper_rating,
    ta.accepted_at,
    ta.notes as acceptance_notes,
    COUNT(m.id) as message_count
FROM tasks t
LEFT JOIN profiles author_profile ON t.author = author_profile.id
LEFT JOIN profiles helper_profile ON t.helper = helper_profile.id
LEFT JOIN task_acceptances ta ON t.id = ta.task_id AND ta.status = 'active'
LEFT JOIN messages m ON t.id = m.task_id
GROUP BY t.id, author_profile.name, author_profile.avatar_url, author_profile.rating,
         helper_profile.name, helper_profile.avatar_url, helper_profile.rating,
         ta.accepted_at, ta.notes;
