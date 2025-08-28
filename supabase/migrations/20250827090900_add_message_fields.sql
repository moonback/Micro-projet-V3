-- Migration pour ajouter les champs manquants à la table messages
-- Ajout des champs pour la gestion des messages non lus et des pièces jointes

-- Ajouter le champ is_read pour marquer les messages comme lus
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Ajouter le champ read_at pour enregistrer quand le message a été lu
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Ajouter un index sur is_read pour optimiser les requêtes de comptage
CREATE INDEX IF NOT EXISTS messages_is_read_idx ON messages (is_read);

-- Ajouter un index sur read_at pour optimiser les requêtes de tri
CREATE INDEX IF NOT EXISTS messages_read_at_idx ON messages (read_at);

-- Mettre à jour les messages existants pour marquer ceux de l'expéditeur comme lus
UPDATE messages 
SET is_read = TRUE, read_at = created_at 
WHERE sender = auth.uid();

-- Créer un bucket de stockage pour les pièces jointes des messages
-- Note: Cette commande doit être exécutée manuellement dans l'interface Supabase
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true);

-- Politique RLS pour permettre la mise à jour des messages (marquage comme lu)
DROP POLICY IF EXISTS "Users can update message read status" ON messages;
CREATE POLICY "Users can update message read status" ON messages
FOR UPDATE USING (
  auth.uid() IN (
    SELECT author FROM tasks WHERE id = task_id
    UNION
    SELECT helper FROM tasks WHERE id = task_id
  )
);

-- Fonction pour marquer automatiquement les messages comme lus
DROP FUNCTION IF EXISTS mark_messages_as_read(UUID, UUID);
CREATE OR REPLACE FUNCTION mark_messages_as_read(task_id_param UUID, user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE messages 
  SET is_read = TRUE, read_at = NOW()
  WHERE task_id = task_id_param 
    AND sender != user_id_param 
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les messages non lus d'une tâche
DROP FUNCTION IF EXISTS count_unread_messages(UUID, UUID);
CREATE OR REPLACE FUNCTION count_unread_messages(task_id_param UUID, user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM messages 
    WHERE id = task_id_param 
      AND sender != user_id_param 
      AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour appliquer la validation (à supprimer en premier)
DROP TRIGGER IF EXISTS validate_message_update_trigger ON messages;

-- Fonction pour valider les mises à jour des messages
DROP FUNCTION IF EXISTS validate_message_update();
CREATE OR REPLACE FUNCTION validate_message_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que seuls les champs is_read et read_at sont modifiés
  IF OLD.content != NEW.content THEN
    RAISE EXCEPTION 'Le contenu du message ne peut pas être modifié';
  END IF;
  
  IF OLD.attachments != NEW.attachments THEN
    RAISE EXCEPTION 'Les pièces jointes ne peuvent pas être modifiées';
  END IF;
  
  IF OLD.sender != NEW.sender THEN
    RAISE EXCEPTION 'L''expéditeur ne peut pas être modifié';
  END IF;
  
  IF OLD.task_id != NEW.task_id THEN
    RAISE EXCEPTION 'La tâche associée ne peut pas être modifiée';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger après la fonction
CREATE TRIGGER validate_message_update_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION validate_message_update();

-- Politique pour permettre la lecture des messages
DROP POLICY IF EXISTS "Users can view messages" ON messages;
CREATE POLICY "Users can view messages" ON messages
FOR SELECT USING (
  -- Permettre si l'utilisateur est l'auteur de la tâche
  auth.uid() IN (SELECT author FROM tasks WHERE id = task_id)
  OR
  -- Permettre si l'utilisateur est l'aideur assigné
  auth.uid() IN (SELECT helper FROM tasks WHERE id = task_id)
  OR
  -- Permettre si l'utilisateur a participé à la conversation (a envoyé au moins un message)
  EXISTS (
    SELECT 1 FROM messages m2
    WHERE m2.task_id = messages.task_id 
      AND m2.sender = auth.uid()
  )
  OR
  -- Permettre si la tâche est ouverte (pour voir les messages publics)
  EXISTS (
    SELECT 1 FROM tasks 
    WHERE id = task_id 
      AND status = 'open'
  )
);

-- Politique pour permettre l'insertion de nouveaux messages
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages
FOR INSERT WITH CHECK (
  auth.uid() = sender AND
  (
    -- Permettre si l'utilisateur est l'auteur de la tâche
    auth.uid() IN (SELECT author FROM tasks WHERE id = task_id)
    OR
    -- Permettre si l'utilisateur est l'aideur assigné
    auth.uid() IN (SELECT helper FROM tasks WHERE id = task_id)
    OR
    -- Permettre si la tâche est ouverte (pour postuler)
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = task_id 
        AND status = 'open'
    )
  )
);
