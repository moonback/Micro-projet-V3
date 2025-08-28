-- Script pour ajouter le statut 'completed' à la table task_applications

-- 1. Vérifier la contrainte actuelle
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'task_applications_status_check';

-- 2. Supprimer l'ancienne contrainte
ALTER TABLE task_applications DROP CONSTRAINT IF EXISTS task_applications_status_check;

-- 3. Recréer la contrainte avec le statut 'completed'
ALTER TABLE task_applications ADD CONSTRAINT task_applications_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'completed'));

-- 4. Vérifier que la contrainte est mise à jour
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'task_applications_status_check';

-- 5. Vérifier que la colonne completed_at existe, sinon l'ajouter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_applications' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE task_applications ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 6. Vérifier la structure finale
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'task_applications'
ORDER BY ordinal_position;
