-- Script pour corriger la fonction manquante update_task_applications_updated_at
-- Cette fonction est nécessaire pour le trigger qui met à jour automatiquement updated_at

-- Créer la fonction manquante
CREATE OR REPLACE FUNCTION update_task_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vérifier que la fonction existe
SELECT 
  routine_name, 
  routine_type, 
  routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'update_task_applications_updated_at';

-- Vérifier que le trigger existe
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'update_task_applications_updated_at';
