-- Script pour corriger la fonction mark_task_completed
-- Le problème est que la fonction ne permet qu'au helper de marquer la tâche comme terminée
-- Mais l'interface permet à l'auteur ET au helper de le faire

-- 1. Supprimer la fonction existante
DROP FUNCTION IF EXISTS mark_task_completed(UUID);
DROP FUNCTION IF EXISTS mark_task_completed(uuid);

-- 2. Créer la fonction corrigée qui permet à l'auteur ET au helper de marquer la tâche comme terminée
CREATE OR REPLACE FUNCTION mark_task_completed(task_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  task_status TEXT;
  task_helper UUID;
  task_author UUID;
BEGIN
  -- Vérifier que la tâche existe et récupérer son statut, helper et auteur
  SELECT status, helper, author INTO task_status, task_helper, task_author
  FROM tasks
  WHERE id = task_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tâche non trouvée';
  END IF;
  
  -- Vérifier que la tâche est en cours (in_progress)
  IF task_status != 'in_progress' THEN
    RAISE EXCEPTION 'La tâche doit être en cours pour être marquée comme terminée';
  END IF;
  
  -- Vérifier que l'utilisateur actuel est soit le helper soit l'auteur de cette tâche
  IF auth.uid() != task_helper AND auth.uid() != task_author THEN
    RAISE EXCEPTION 'Seul l''utilisateur assigné à cette tâche ou l''auteur peut la marquer comme terminée';
  END IF;
  
  -- Marquer la tâche comme terminée
  UPDATE tasks 
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = task_id_param;
  
  -- Mettre à jour le statut de la candidature correspondante si elle existe
  UPDATE task_applications 
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE task_id = task_id_param AND helper_id = task_helper;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION mark_task_completed(UUID) TO authenticated;

-- 4. Vérifier que la fonction est créée
SELECT 
  routine_name,
  routine_type,
  routine_schema,
  security_type
FROM information_schema.routines 
WHERE routine_name = 'mark_task_completed';

-- 5. Vérifier les signatures des paramètres
SELECT 
  r.routine_name,
  p.parameter_name,
  p.data_type,
  p.ordinal_position
FROM information_schema.routines r
JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_name = 'mark_task_completed'
ORDER BY r.routine_name, p.ordinal_position;

-- 6. Tester la fonction (optionnel - décommentez pour tester)
-- SELECT mark_task_completed('00000000-0000-0000-0000-000000000000');
