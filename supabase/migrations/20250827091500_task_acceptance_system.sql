-- Migration pour le système d'acceptation des tâches
-- Date: 2025-08-27

-- 1. Créer la table task_applications
CREATE TABLE IF NOT EXISTS task_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  helper_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  message TEXT,
  proposed_budget NUMERIC(10,2),
  proposed_duration INTERVAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  UNIQUE(task_id, helper_id)
);

-- 2. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_task_applications_task_id ON task_applications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_helper_id ON task_applications(helper_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_status ON task_applications(status);
CREATE INDEX IF NOT EXISTS idx_task_applications_created_at ON task_applications(created_at);

-- 3. Modifier la contrainte de statut des tâches pour inclure 'pending_approval'
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('open', 'pending_approval', 'assigned', 'in_progress', 'completed', 'cancelled', 'expired'));

-- 4. Ajouter de nouvelles colonnes aux tâches
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS min_applications INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS auto_approve BOOLEAN DEFAULT false;

-- 5. Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_task_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_applications_updated_at
  BEFORE UPDATE ON task_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_task_applications_updated_at();

-- 6. Fonction pour compter les candidatures actives
CREATE OR REPLACE FUNCTION count_active_applications(task_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM task_applications 
    WHERE task_applications.task_id = count_active_applications.task_id 
    AND status IN ('pending', 'accepted')
  );
END;
$$ LANGUAGE plpgsql;

-- 7. Fonction pour accepter une candidature
CREATE OR REPLACE FUNCTION accept_application(application_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  target_task_id UUID;
  target_helper_id UUID;
BEGIN
  -- Récupérer les informations de la candidature
  SELECT task_id, helper_id INTO target_task_id, target_helper_id
  FROM task_applications
  WHERE id = application_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Mettre à jour la candidature acceptée
  UPDATE task_applications 
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = application_id;
  
  -- Mettre à jour la tâche
  UPDATE tasks 
  SET status = 'pending_approval', helper = target_helper_id, assigned_at = NOW()
  WHERE id = target_task_id;
  
  -- Rejeter toutes les autres candidatures en attente
  UPDATE task_applications 
  SET status = 'rejected', rejected_at = NOW()
  WHERE task_id = target_task_id AND status = 'pending' AND id != application_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 8. Fonction pour approuver le démarrage de la tâche
CREATE OR REPLACE FUNCTION approve_task_start(task_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tasks 
  SET status = 'in_progress', started_at = NOW()
  WHERE id = task_id AND status = 'pending_approval';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 9. Fonction pour rejeter le démarrage de la tâche
CREATE OR REPLACE FUNCTION reject_task_start(task_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Remettre la tâche en statut ouvert
  UPDATE tasks 
  SET status = 'open', helper = NULL, assigned_at = NULL
  WHERE id = task_id AND status = 'pending_approval';
  
  -- Rejeter la candidature acceptée
  UPDATE task_applications 
  SET status = 'rejected', rejected_at = NOW()
  WHERE task_id = task_id AND status = 'accepted';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 10. Activer RLS sur task_applications
ALTER TABLE task_applications ENABLE ROW LEVEL SECURITY;

-- 11. Politiques RLS pour task_applications
-- Les utilisateurs peuvent voir les candidatures des tâches qu'ils ont créées ou auxquelles ils ont candidaté
CREATE POLICY "Users can view task applications" ON task_applications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT author FROM tasks WHERE id = task_applications.task_id
    ) OR 
    auth.uid() = helper_id
  );

-- Les utilisateurs authentifiés peuvent créer des candidatures
CREATE POLICY "Users can create applications" ON task_applications
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() != (
      SELECT author FROM tasks WHERE id = task_applications.task_id
    ) AND
    NOT EXISTS (
      SELECT 1 FROM task_applications 
      WHERE task_id = task_applications.task_id 
      AND helper_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent mettre à jour leurs propres candidatures
CREATE POLICY "Users can update their own applications" ON task_applications
  FOR UPDATE USING (
    auth.uid() = helper_id AND
    status IN ('pending', 'withdrawn')
  );

-- Les auteurs des tâches peuvent gérer les candidatures
CREATE POLICY "Task authors can manage applications" ON task_applications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT author FROM tasks WHERE id = task_applications.task_id
    )
  );

-- 12. Créer la vue task_applications_with_profiles
CREATE OR REPLACE VIEW task_applications_with_profiles AS
SELECT 
  ta.*,
  t.title as task_title,
  t.status as task_status,
  t.budget as task_budget,
  t.currency as task_currency,
  t.deadline as task_deadline,
  p.name as helper_name,
  p.avatar_url as helper_avatar,
  p.rating as helper_rating,
  p.rating_count as helper_rating_count
FROM task_applications ta
JOIN tasks t ON ta.task_id = t.id
JOIN profiles p ON ta.helper_id = p.id;

-- 13. Créer la vue task_history
CREATE OR REPLACE VIEW task_history AS
SELECT 
  t.*,
  p.name as author_name,
  p.avatar_url as author_avatar,
  p.rating as author_rating,
  helper_p.name as helper_name,
  helper_p.avatar_url as helper_avatar,
  helper_p.rating as helper_rating,
  COUNT(ta.id) as total_applications,
  COUNT(CASE WHEN ta.status = 'accepted' THEN 1 END) as accepted_applications,
  COUNT(CASE WHEN ta.status = 'pending' THEN 1 END) as pending_applications
FROM tasks t
LEFT JOIN profiles p ON t.author = p.id
LEFT JOIN profiles helper_p ON t.helper = helper_p.id
LEFT JOIN task_applications ta ON t.id = ta.task_id
GROUP BY t.id, p.name, p.avatar_url, p.rating, helper_p.name, helper_p.avatar_url, helper_p.rating;

-- 14. Donner les permissions nécessaires
GRANT SELECT, INSERT, UPDATE ON task_applications TO authenticated;
GRANT SELECT ON task_applications_with_profiles TO authenticated;
GRANT SELECT ON task_history TO authenticated;
GRANT EXECUTE ON FUNCTION count_active_applications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_application(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_task_start(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_task_start(UUID) TO authenticated;
