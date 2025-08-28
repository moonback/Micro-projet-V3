-- Migration alternative simple - évite complètement la récursion
-- Approche : Permettre l'accès basé uniquement sur les relations de tâches

-- 1. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update message read status" ON messages;

-- 2. Politique de lecture simple - basée uniquement sur les tâches
CREATE POLICY "Users can view messages" ON messages
FOR SELECT USING (
  -- Permettre si l'utilisateur est l'auteur de la tâche
  auth.uid() IN (SELECT author FROM tasks WHERE id = task_id)
  OR
  -- Permettre si l'utilisateur est l'aideur assigné
  auth.uid() IN (SELECT helper FROM tasks WHERE id = task_id)
  OR
  -- Permettre si la tâche est ouverte (pour voir les messages publics)
  EXISTS (
    SELECT 1 FROM tasks 
    WHERE id = task_id 
      AND status = 'open'
  )
);

-- 3. Politique d'insertion simple
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

-- 4. Politique de mise à jour
CREATE POLICY "Users can update message read status" ON messages
FOR UPDATE USING (
  auth.uid() IN (
    SELECT author FROM tasks WHERE id = task_id
    UNION
    SELECT helper FROM tasks WHERE id = task_id
  )
);

-- Note: Cette approche est plus restrictive mais évite complètement la récursion
-- Les utilisateurs ne peuvent voir que les messages des tâches où ils sont impliqués
-- ou des tâches ouvertes
