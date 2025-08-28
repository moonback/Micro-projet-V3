-- Script pour corriger la fonction approve_task_start
-- Le problème est que la fonction n'existe pas ou a une mauvaise signature

-- 1. Supprimer la fonction si elle existe (pour éviter les conflits)
DROP FUNCTION IF EXISTS approve_task_start(UUID);
DROP FUNCTION IF EXISTS approve_task_start(uuid);
DROP FUNCTION IF EXISTS approve_task_start(task_id UUID);
DROP FUNCTION IF EXISTS approve_task_start(task_id_param UUID);

-- 2. Créer la fonction avec la signature correcte
CREATE OR REPLACE FUNCTION approve_task_start(task_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier que la tâche existe et est en attente d'approbation
  IF NOT EXISTS (
    SELECT 1 FROM tasks 
    WHERE id = task_id AND status = 'pending_approval'
  ) THEN
    RETURN false;
  END IF;

  -- Mettre à jour la tâche pour la passer en cours
  UPDATE tasks 
  SET status = 'in_progress', started_at = NOW()
  WHERE id = task_id AND status = 'pending_approval';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 3. Créer aussi la fonction reject_task_start si elle n'existe pas
DROP FUNCTION IF EXISTS reject_task_start(UUID);
DROP FUNCTION IF EXISTS reject_task_start(uuid);
DROP FUNCTION IF EXISTS reject_task_start(task_id UUID);
DROP FUNCTION IF EXISTS reject_task_start(task_id_param UUID);

CREATE OR REPLACE FUNCTION reject_task_start(task_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier que la tâche existe et est en attente d'approbation
  IF NOT EXISTS (
    SELECT 1 FROM tasks 
    WHERE id = task_id AND status = 'pending_approval'
  ) THEN
    RETURN false;
  END IF;

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

-- 4. Donner les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION approve_task_start(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_task_start(UUID) TO authenticated;

-- 5. Vérifier que les fonctions ont été créées
SELECT 
  routine_name, 
  routine_type,
  routine_schema
FROM information_schema.routines 
WHERE routine_name IN ('approve_task_start', 'reject_task_start')
ORDER BY routine_name;

-- 6. Vérifier les signatures des paramètres
SELECT 
  r.routine_name,
  p.parameter_name,
  p.data_type,
  p.ordinal_position
FROM information_schema.routines r
JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_name IN ('approve_task_start', 'reject_task_start')
ORDER BY r.routine_name, p.ordinal_position;
