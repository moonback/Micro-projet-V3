-- Script pour corriger les politiques RLS qui causent une récursion infinie
-- Le problème vient des politiques qui se référencent mutuellement

-- 1. Désactiver temporairement RLS pour pouvoir corriger les politiques
ALTER TABLE task_applications DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer toutes les politiques existantes problématiques
DROP POLICY IF EXISTS "Users can view task applications" ON task_applications;
DROP POLICY IF EXISTS "Users can create applications" ON task_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON task_applications;
DROP POLICY IF EXISTS "Task authors can manage applications" ON task_applications;

-- 3. Créer des politiques RLS simplifiées et non récursives
-- Politique pour voir les candidatures
CREATE POLICY "Users can view task applications" ON task_applications
  FOR SELECT USING (
    -- L'utilisateur peut voir les candidatures des tâches qu'il a créées
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_applications.task_id 
      AND tasks.author = auth.uid()
    ) OR 
    -- Ou les candidatures qu'il a soumises
    task_applications.helper_id = auth.uid()
  );

-- Politique pour créer des candidatures (sans récursion)
CREATE POLICY "Users can create applications" ON task_applications
  FOR INSERT WITH CHECK (
    -- L'utilisateur doit être authentifié
    auth.uid() IS NOT NULL AND
    -- L'utilisateur ne peut pas candidater à ses propres tâches
    auth.uid() != (
      SELECT author FROM tasks WHERE id = task_applications.task_id
    ) AND
    -- Vérifier qu'il n'y a pas déjà une candidature (via une table temporaire)
    NOT EXISTS (
      SELECT 1 FROM (
        SELECT task_id, helper_id 
        FROM task_applications 
        WHERE task_id = task_applications.task_id 
        AND helper_id = auth.uid()
      ) existing_apps
    )
  );

-- Politique pour mettre à jour les candidatures
CREATE POLICY "Users can update applications" ON task_applications
  FOR UPDATE USING (
    -- L'utilisateur peut mettre à jour ses propres candidatures
    task_applications.helper_id = auth.uid() OR
    -- Ou l'auteur de la tâche peut gérer toutes les candidatures
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_applications.task_id 
      AND tasks.author = auth.uid()
    )
  );

-- 4. Réactiver RLS
ALTER TABLE task_applications ENABLE ROW LEVEL SECURITY;

-- 5. Vérifier que les politiques sont créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'task_applications';

-- 6. Tester l'insertion d'une candidature (optionnel)
-- INSERT INTO task_applications (task_id, helper_id, message, status) 
-- VALUES ('test-task-id', 'test-helper-id', 'Test message', 'pending');
