-- Migration d'urgence pour corriger la récursion infinie dans les politiques RLS
-- Problème : Les politiques référençaient la table messages dans leurs propres conditions

-- 1. Supprimer les politiques problématiques
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;

-- 2. Recréer la politique de lecture sans récursion
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

-- 3. Recréer la politique d'insertion sans récursion
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

-- Note: Cette migration corrige l'erreur "infinite recursion detected in policy"
