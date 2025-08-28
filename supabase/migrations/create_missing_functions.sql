-- Script pour créer toutes les fonctions manquantes du système d'acceptation des tâches
-- Ces fonctions sont nécessaires pour le bon fonctionnement du système

-- 1. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_task_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Fonction pour compter les candidatures actives
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

-- 3. Fonction pour accepter une candidature
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

-- 4. Fonction pour approuver le démarrage de la tâche
CREATE OR REPLACE FUNCTION approve_task_start(task_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tasks 
  SET status = 'in_progress', started_at = NOW()
  WHERE id = task_id AND status = 'pending_approval';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 5. Fonction pour rejeter le démarrage de la tâche
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

-- 6. Vérifier que toutes les fonctions sont créées
SELECT 
  routine_name, 
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name IN (
  'update_task_applications_updated_at',
  'count_active_applications',
  'accept_application',
  'approve_task_start',
  'reject_task_start'
)
ORDER BY routine_name;

-- 7. Donner les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION count_active_applications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_application(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_task_start(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_task_start(UUID) TO authenticated;

-- 8. Vérifier les permissions
SELECT 
  routine_name,
  routine_type,
  routine_schema,
  security_type
FROM information_schema.routines 
WHERE routine_name IN (
  'count_active_applications',
  'accept_application',
  'approve_task_start',
  'reject_task_start'
);
