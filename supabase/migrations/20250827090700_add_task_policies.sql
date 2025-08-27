/*
  # Migration: Ajout des politiques RLS pour la table tasks
  
  Cette migration ajoute les nouvelles politiques de sécurité
  pour les nouveaux champs de la table tasks.
*/

-- Ajout des nouvelles politiques pour la table tasks
DROP POLICY IF EXISTS "Authors can delete their own tasks" ON tasks;
CREATE POLICY "Authors can delete their own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = author AND status = 'open');

DROP POLICY IF EXISTS "Helpers can update task progress" ON tasks;
CREATE POLICY "Helpers can update task progress"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = helper)
  WITH CHECK (
    status IN ('in_progress', 'completed') AND
    (OLD.status = 'assigned' OR OLD.status = 'in_progress')
  );

-- Politique pour permettre aux utilisateurs de voir les tâches avec les nouveaux champs
DROP POLICY IF EXISTS "Anyone can view open tasks" ON tasks;
CREATE POLICY "Anyone can view open tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

-- Politique pour permettre aux utilisateurs de créer des tâches
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author);

-- Politique pour permettre aux auteurs et helpers de mettre à jour les tâches
DROP POLICY IF EXISTS "Authors and helpers can update tasks" ON tasks;
CREATE POLICY "Authors and helpers can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = author OR auth.uid() = helper);
