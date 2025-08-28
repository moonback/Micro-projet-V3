-- Migration finale pour corriger définitivement la récursion infinie
-- Utilise une fonction helper pour éviter la récursion dans les politiques RLS

-- 1. Créer une fonction helper pour vérifier la participation
CREATE OR REPLACE FUNCTION user_has_participated_in_task(user_id UUID, task_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM messages 
    WHERE task_id = task_id_param 
      AND sender = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update message read status" ON messages;

-- 3. Recréer la politique de lecture sans récursion
CREATE POLICY "Users can view messages" ON messages
FOR SELECT USING (
  -- Permettre si l'utilisateur est l'auteur de la tâche
  auth.uid() IN (SELECT author FROM tasks WHERE id = task_id)
  OR
  -- Permettre si l'utilisateur est l'aideur assigné
  auth.uid() IN (SELECT helper FROM tasks WHERE id = task_id)
  OR
  -- Permettre si l'utilisateur a participé à la conversation (via fonction helper)
  user_has_participated_in_task(auth.uid(), task_id)
  OR
  -- Permettre si la tâche est ouverte (pour voir les messages publics)
  EXISTS (
    SELECT 1 FROM tasks 
    WHERE id = task_id 
      AND status = 'open'
  )
);

-- 4. Recréer la politique d'insertion sans récursion
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

-- 5. Recréer la politique de mise à jour
CREATE POLICY "Users can update message read status" ON messages
FOR UPDATE USING (
  auth.uid() IN (
    SELECT author FROM tasks WHERE id = task_id
    UNION
    SELECT helper FROM tasks WHERE id = task_id
  )
);

-- Note: Cette approche utilise une fonction helper pour éviter la récursion
-- tout en permettant l'accès aux conversations complètes
