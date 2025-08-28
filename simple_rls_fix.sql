-- Solution simple pour éviter la récursion infinie dans les politiques RLS
-- Cette approche utilise des politiques plus basiques et évite les références croisées

-- 1. Désactiver RLS temporairement
ALTER TABLE task_applications DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view task applications" ON task_applications;
DROP POLICY IF EXISTS "Users can create applications" ON task_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON task_applications;
DROP POLICY IF EXISTS "Task authors can manage applications" ON task_applications;

-- 3. Créer des politiques très simples et sûres
-- Politique de lecture : tout utilisateur authentifié peut voir les candidatures
CREATE POLICY "Allow authenticated users to view applications" ON task_applications
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Politique d'insertion : tout utilisateur authentifié peut créer des candidatures
CREATE POLICY "Allow authenticated users to create applications" ON task_applications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Politique de mise à jour : l'utilisateur peut modifier ses propres candidatures
CREATE POLICY "Allow users to update own applications" ON task_applications
  FOR UPDATE USING (auth.uid() = helper_id);

-- 4. Réactiver RLS
ALTER TABLE task_applications ENABLE ROW LEVEL SECURITY;

-- 5. Vérifier les politiques
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'task_applications';

-- 6. Alternative : désactiver complètement RLS si les politiques causent encore des problèmes
-- ALTER TABLE task_applications DISABLE ROW LEVEL SECURITY;
