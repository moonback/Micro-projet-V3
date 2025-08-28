-- Script pour corriger les conflits de fonctions
-- Supprime d'abord les fonctions existantes pour éviter les conflits de paramètres

-- 1. Supprimer les fonctions existantes qui pourraient causer des conflits
DROP FUNCTION IF EXISTS count_active_applications(UUID);
DROP FUNCTION IF EXISTS count_active_applications(uuid);
DROP FUNCTION IF EXISTS accept_application(UUID);
DROP FUNCTION IF EXISTS accept_application(uuid);
DROP FUNCTION IF EXISTS approve_task_start(UUID);
DROP FUNCTION IF EXISTS approve_task_start(uuid);
DROP FUNCTION IF EXISTS reject_task_start(UUID);
DROP FUNCTION IF EXISTS reject_task_start(uuid);
DROP FUNCTION IF EXISTS update_task_applications_updated_at();

-- 2. Créer la fonction update_task_applications_updated_at
CREATE OR REPLACE FUNCTION update_task_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Créer la fonction count_active_applications avec le bon nom de paramètre
CREATE OR REPLACE FUNCTION count_active_applications(task_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM task_applications 
    WHERE task_applications.task_id = task_id_param 
    AND status IN ('pending', 'accepted')
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Créer la fonction accept_application
CREATE OR REPLACE FUNCTION accept_application(application_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  target_task_id UUID;
  target_helper_id UUID;
BEGIN
  -- Récupérer les informations de la candidature
  SELECT task_id, helper_id INTO target_task_id, target_helper_id
  FROM task_applications
  WHERE id = application_id_param AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Mettre à jour la candidature acceptée
  UPDATE task_applications 
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = application_id_param;
  
  -- Mettre à jour la tâche
  UPDATE tasks 
  SET status = 'pending_approval', helper = target_helper_id, assigned_at = NOW()
  WHERE id = target_task_id;
  
  -- Rejeter toutes les autres candidatures en attente
  UPDATE task_applications 
  SET status = 'rejected', rejected_at = NOW()
  WHERE task_id = target_task_id AND status = 'pending' AND id != application_id_param;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer la fonction approve_task_start
CREATE OR REPLACE FUNCTION approve_task_start(task_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tasks 
  SET status = 'in_progress', started_at = NOW()
  WHERE id = task_id_param AND status = 'pending_approval';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer la fonction reject_task_start
CREATE OR REPLACE FUNCTION reject_task_start(task_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Remettre la tâche en statut ouvert
  UPDATE tasks 
  SET status = 'open', helper = NULL, assigned_at = NULL
  WHERE id = task_id_param AND status = 'pending_approval';
  
  -- Rejeter la candidature acceptée
  UPDATE task_applications 
  SET status = 'rejected', rejected_at = NOW()
  WHERE task_id = task_id_param AND status = 'accepted';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 7. Vérifier que toutes les fonctions sont créées
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

-- 8. Donner les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION count_active_applications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_application(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_task_start(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_task_start(UUID) TO authenticated;

-- 9. Vérifier les permissions
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
