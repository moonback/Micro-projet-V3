/*
  # Migration: Amélioration du système de messagerie
  
  Cette migration ajoute des fonctionnalités avancées au système de messagerie :
  - Indicateurs de frappe en temps réel
  - Compteurs de messages non lus
  - Historique des visites de chat
  - Amélioration des politiques de sécurité
  - Index pour les performances
*/

-- Table pour suivre les indicateurs de frappe
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- Table pour l'historique des visites de chat
CREATE TABLE IF NOT EXISTS chat_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_visit TIMESTAMPTZ DEFAULT now(),
  message_count_at_visit INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- Table pour les notifications de messages
CREATE TABLE IF NOT EXISTS message_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  notification_type TEXT DEFAULT 'message' CHECK (notification_type IN ('message', 'status_change', 'assigned', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, user_id, message_id)
);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_chat_visits_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

-- Trigger pour chat_visits
CREATE TRIGGER update_chat_visits_updated_at
  BEFORE UPDATE ON chat_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_visits_updated_at();

-- Fonction pour créer automatiquement une visite de chat
CREATE OR REPLACE FUNCTION create_chat_visit()
RETURNS trigger AS $$
BEGIN
  INSERT INTO chat_visits (task_id, user_id, last_visit, message_count_at_visit)
  VALUES (NEW.task_id, NEW.sender, NEW.created_at, 
    (SELECT COUNT(*) FROM messages WHERE task_id = NEW.task_id))
  ON CONFLICT (task_id, user_id) 
  DO UPDATE SET 
    last_visit = NEW.created_at,
    message_count_at_visit = (SELECT COUNT(*) FROM messages WHERE task_id = NEW.task_id),
    updated_at = now();
  
  RETURN NEW;
END;
$$ language plpgsql;

-- Trigger pour créer automatiquement une visite lors d'un nouveau message
CREATE TRIGGER create_chat_visit_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_visit();

-- Fonction pour compter les messages non lus
CREATE OR REPLACE FUNCTION get_unread_message_count(
  p_task_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  last_visit_time TIMESTAMPTZ;
  unread_count INTEGER;
BEGIN
  -- Récupérer la dernière visite
  SELECT last_visit INTO last_visit_time
  FROM chat_visits
  WHERE task_id = p_task_id AND user_id = p_user_id;
  
  -- Si pas de visite, compter tous les messages reçus
  IF last_visit_time IS NULL THEN
    SELECT COUNT(*) INTO unread_count
    FROM messages
    WHERE task_id = p_task_id 
      AND sender != p_user_id;
  ELSE
    -- Compter les messages reçus après la dernière visite
    SELECT COUNT(*) INTO unread_count
    FROM messages
    WHERE task_id = p_task_id 
      AND sender != p_user_id
      AND created_at > last_visit_time;
  END IF;
  
  RETURN COALESCE(unread_count, 0);
END;
$$ language plpgsql;

-- Fonction pour marquer les messages comme lus
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_task_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Mettre à jour la dernière visite
  INSERT INTO chat_visits (task_id, user_id, last_visit, message_count_at_visit)
  VALUES (p_task_id, p_user_id, now(), 
    (SELECT COUNT(*) FROM messages WHERE task_id = p_task_id))
  ON CONFLICT (task_id, user_id) 
  DO UPDATE SET 
    last_visit = now(),
    message_count_at_visit = (SELECT COUNT(*) FROM messages WHERE task_id = p_task_id),
    updated_at = now();
  
  -- Marquer les notifications comme lues
  UPDATE message_notifications
  SET is_read = true
  WHERE task_id = p_task_id AND user_id = p_user_id;
END;
$$ language plpgsql;

-- Fonction pour nettoyer les anciens indicateurs de frappe
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS VOID AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE last_activity < now() - INTERVAL '5 minutes';
END;
$$ language plpgsql;

-- Fonction pour nettoyer automatiquement les indicateurs de frappe lors des opérations
CREATE OR REPLACE FUNCTION auto_cleanup_typing_indicators()
RETURNS trigger AS $$
BEGIN
  -- Nettoyer les indicateurs obsolètes lors de chaque opération
  DELETE FROM typing_indicators
  WHERE last_activity < now() - INTERVAL '5 minutes';
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language plpgsql;

-- Trigger pour nettoyer automatiquement les indicateurs de frappe
CREATE TRIGGER auto_cleanup_typing_indicators_trigger
  AFTER INSERT OR UPDATE OR DELETE ON typing_indicators
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_cleanup_typing_indicators();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_messages_task_sender_created ON messages (task_id, sender, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_task_user ON typing_indicators (task_id, user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_last_activity ON typing_indicators (last_activity);
CREATE INDEX IF NOT EXISTS idx_chat_visits_task_user ON chat_visits (task_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_visits_last_visit ON chat_visits (last_visit);
CREATE INDEX IF NOT EXISTS idx_message_notifications_user_read ON message_notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_message_notifications_task_user ON message_notifications (task_id, user_id);

-- Politiques RLS pour les nouvelles tables
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_notifications ENABLE ROW LEVEL SECURITY;

-- Politiques pour typing_indicators
CREATE POLICY "Users can view typing indicators for their tasks"
  ON typing_indicators FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT author FROM tasks WHERE id = task_id
      UNION
      SELECT helper FROM tasks WHERE id = task_id
    )
  );

CREATE POLICY "Users can insert typing indicators for their tasks"
  ON typing_indicators FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT author FROM tasks WHERE id = task_id
      UNION
      SELECT helper FROM tasks WHERE id = task_id
    )
  );

CREATE POLICY "Users can update their own typing indicators"
  ON typing_indicators FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing indicators"
  ON typing_indicators FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques pour chat_visits
CREATE POLICY "Users can view chat visits for their tasks"
  ON chat_visits FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT author FROM tasks WHERE id = task_id
      UNION
      SELECT helper FROM tasks WHERE id = task_id
    )
  );

CREATE POLICY "Users can insert chat visits for their tasks"
  ON chat_visits FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT author FROM tasks WHERE id = task_id
      UNION
      SELECT helper FROM tasks WHERE id = task_id
    )
  );

CREATE POLICY "Users can update their own chat visits"
  ON chat_visits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques pour message_notifications
CREATE POLICY "Users can view their own notifications"
  ON message_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications for their tasks"
  ON message_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT author FROM tasks WHERE id = task_id
      UNION
      SELECT helper FROM tasks WHERE id = task_id
    )
  );

CREATE POLICY "Users can update their own notifications"
  ON message_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Améliorer les politiques existantes pour messages
DROP POLICY IF EXISTS "Task participants can view messages" ON messages;
CREATE POLICY "Task participants can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT author FROM tasks WHERE id = task_id
      UNION
      SELECT helper FROM tasks WHERE id = task_id
    )
  );

-- Politique pour permettre la suppression de ses propres messages (avec limite de temps)
CREATE POLICY "Users can delete their own recent messages"
  ON messages FOR DELETE
  TO authenticated
  USING (
    auth.uid() = sender AND
    created_at > now() - INTERVAL '1 hour'
  );

-- Vues utiles pour les requêtes fréquentes
CREATE OR REPLACE VIEW task_conversation_summary AS
SELECT 
  t.id as task_id,
  t.title as task_title,
  t.status as task_status,
  t.author,
  t.helper,
  ap.name as author_name,
  hp.name as helper_name,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_message_at,
  COUNT(CASE WHEN m.sender != t.author THEN 1 END) as received_message_count
FROM tasks t
LEFT JOIN profiles ap ON t.author = ap.id
LEFT JOIN profiles hp ON t.helper = hp.id
LEFT JOIN messages m ON t.id = m.task_id
WHERE t.helper IS NOT NULL
GROUP BY t.id, t.title, t.status, t.author, t.helper, ap.name, hp.name;

-- Vue pour les statistiques de messagerie par utilisateur
CREATE OR REPLACE VIEW user_messaging_stats AS
SELECT 
  p.id as user_id,
  p.name as user_name,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN t.author = p.id THEN t.id END) as created_tasks,
  COUNT(DISTINCT CASE WHEN t.helper = p.id THEN t.id END) as accepted_tasks,
  COUNT(m.id) as total_messages,
  COUNT(CASE WHEN m.sender = p.id THEN 1 END) as sent_messages,
  COUNT(CASE WHEN m.sender != p.id THEN 1 END) as received_messages,
  -- Calcul simplifié du temps de réponse moyen (en secondes)
  CASE 
    WHEN COUNT(CASE WHEN m.sender = p.id THEN 1 END) > 1 THEN
      EXTRACT(EPOCH FROM (
        MAX(m.created_at) - MIN(m.created_at)
      )) / NULLIF(COUNT(CASE WHEN m.sender = p.id THEN 1 END) - 1, 0)
    ELSE NULL
  END as avg_response_time_seconds
FROM profiles p
LEFT JOIN tasks t ON (p.id = t.author OR p.id = t.helper)
LEFT JOIN messages m ON t.id = m.task_id
GROUP BY p.id, p.name;

-- Fonction pour obtenir les conversations récentes d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_conversations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  task_id UUID,
  task_title TEXT,
  other_participant_id UUID,
  other_participant_name TEXT,
  last_message_content TEXT,
  last_message_time TIMESTAMPTZ,
  unread_count INTEGER,
  task_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    CASE 
      WHEN t.author = p_user_id THEN t.helper
      ELSE t.author
    END as other_participant_id,
    CASE 
      WHEN t.author = p_user_id THEN hp.name
      ELSE ap.name
    END as other_participant_name,
    last_msg.content as last_message_content,
    last_msg.created_at as last_message_time,
    get_unread_message_count(t.id, p_user_id) as unread_count,
    t.status as task_status
  FROM tasks t
  LEFT JOIN profiles ap ON t.author = ap.id
  LEFT JOIN profiles hp ON t.helper = hp.id
  LEFT JOIN LATERAL (
    SELECT content, created_at
    FROM messages
    WHERE task_id = t.id
    ORDER BY created_at DESC
    LIMIT 1
  ) last_msg ON true
  WHERE (t.author = p_user_id OR t.helper = p_user_id)
    AND t.helper IS NOT NULL
  ORDER BY last_message_time DESC NULLS LAST
  LIMIT p_limit;
END;
$$ language plpgsql;

-- Fonction pour calculer le temps de réponse moyen d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_avg_response_time(
  p_user_id UUID
)
RETURNS INTERVAL AS $$
DECLARE
  total_time INTERVAL := INTERVAL '0 seconds';
  message_count INTEGER := 0;
  prev_message_time TIMESTAMPTZ;
  current_message_time TIMESTAMPTZ;
BEGIN
  -- Récupérer tous les messages de l'utilisateur ordonnés par tâche et temps
  FOR current_message_time IN
    SELECT m.created_at
    FROM messages m
    WHERE m.sender = p_user_id
    ORDER BY m.task_id, m.created_at
  LOOP
    IF prev_message_time IS NOT NULL THEN
      total_time := total_time + (current_message_time - prev_message_time);
      message_count := message_count + 1;
    END IF;
    prev_message_time := current_message_time;
  END LOOP;
  
  -- Retourner le temps moyen ou NULL si pas assez de messages
  IF message_count > 0 THEN
    RETURN total_time / message_count;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ language plpgsql;

-- Commentaires pour la documentation
COMMENT ON TABLE typing_indicators IS 'Indicateurs de frappe en temps réel pour les chats';
COMMENT ON TABLE chat_visits IS 'Historique des visites de chat pour calculer les messages non lus';
COMMENT ON TABLE message_notifications IS 'Notifications de messages pour les utilisateurs';
COMMENT ON FUNCTION get_unread_message_count IS 'Calcule le nombre de messages non lus pour un utilisateur dans une tâche';
COMMENT ON FUNCTION mark_messages_as_read IS 'Marque tous les messages d''une tâche comme lus pour un utilisateur';
COMMENT ON FUNCTION get_user_conversations IS 'Récupère les conversations récentes d''un utilisateur avec métadonnées';
COMMENT ON FUNCTION cleanup_typing_indicators IS 'Nettoie les indicateurs de frappe obsolètes (appelée manuellement ou via trigger)';
COMMENT ON FUNCTION auto_cleanup_typing_indicators IS 'Trigger automatique pour nettoyer les indicateurs de frappe obsolètes';
COMMENT ON FUNCTION get_user_avg_response_time IS 'Calcule le temps de réponse moyen d''un utilisateur entre ses messages';
