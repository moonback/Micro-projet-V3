-- Script pour corriger la signature de la fonction accept_application
-- Le code JavaScript attend un paramètre nommé 'application_id'

-- 1. Supprimer la fonction existante avec le mauvais nom de paramètre
DROP FUNCTION IF EXISTS accept_application(UUID);

-- 2. Créer la fonction avec le bon nom de paramètre que le code JavaScript attend
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

-- 3. Vérifier que la fonction est créée avec la bonne signature
SELECT 
  routine_name,
  routine_type,
  parameter_name,
  parameter_mode,
  data_type
FROM information_schema.parameters 
WHERE specific_name = (
  SELECT specific_name 
  FROM information_schema.routines 
  WHERE routine_name = 'accept_application'
)
ORDER BY ordinal_position;

-- 4. Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION accept_application(UUID) TO authenticated;

-- 5. Tester la fonction (optionnel - décommentez pour tester)
-- SELECT accept_application('00000000-0000-0000-0000-000000000000');
