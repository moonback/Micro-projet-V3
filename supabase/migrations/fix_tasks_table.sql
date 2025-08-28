-- Script pour vérifier et corriger la structure de la table tasks
-- Nécessaire pour le système d'acceptation des tâches

-- 1. Vérifier la contrainte de statut actuelle
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%status%';

-- 2. Vérifier les colonnes existantes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- 3. Ajouter les nouvelles colonnes si elles n'existent pas
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS min_applications INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS auto_approve BOOLEAN DEFAULT false;

-- 4. Mettre à jour la contrainte de statut pour inclure 'pending_approval'
-- D'abord, supprimer l'ancienne contrainte
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Ensuite, créer la nouvelle contrainte
ALTER TABLE tasks 
ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('open', 'pending_approval', 'assigned', 'in_progress', 'completed', 'cancelled', 'expired'));

-- 5. Vérifier que la contrainte est en place
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'tasks_status_check';

-- 6. Vérifier les colonnes après modification
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- 7. Mettre à jour les tâches existantes si nécessaire
-- Si des tâches ont le statut 'accepted', les changer en 'assigned'
UPDATE tasks 
SET status = 'assigned' 
WHERE status = 'accepted';

-- 8. Vérifier les statuts des tâches
SELECT 
  status,
  COUNT(*) as count
FROM tasks 
GROUP BY status 
ORDER BY status;
