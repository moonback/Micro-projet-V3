-- Script pour permettre à l'utilisateur qui a accepté une tâche de la marquer comme terminée

-- 1. Créer la fonction pour marquer une tâche comme terminée
CREATE OR REPLACE FUNCTION mark_task_completed(task_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  task_status TEXT;
  task_helper UUID;
BEGIN
  -- Vérifier que la tâche existe et récupérer son statut et helper
  SELECT status, helper INTO task_status, task_helper
  FROM tasks
  WHERE id = task_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tâche non trouvée';
  END IF;
  
  -- Vérifier que la tâche est en cours (in_progress)
  IF task_status != 'in_progress' THEN
    RAISE EXCEPTION 'La tâche doit être en cours pour être marquée comme terminée';
  END IF;
  
  -- Vérifier que l'utilisateur actuel est bien le helper de cette tâche
  IF task_helper != auth.uid() THEN
    RAISE EXCEPTION 'Seul l''utilisateur assigné à cette tâche peut la marquer comme terminée';
  END IF;
  
  -- Marquer la tâche comme terminée
  UPDATE tasks 
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = task_id_param;
  
  -- Mettre à jour le statut de la candidature correspondante
  UPDATE task_applications 
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE task_id = task_id_param AND helper_id = auth.uid();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION mark_task_completed(UUID) TO authenticated;

-- 3. Vérifier que la fonction est créée
SELECT 
  routine_name,
  routine_type,
  routine_schema,
  security_type
FROM information_schema.routines 
WHERE routine_name = 'mark_task_completed';

-- 4. Tester la fonction (optionnel - décommentez pour tester)
-- SELECT mark_task_completed('00000000-0000-0000-0000-000000000000');
