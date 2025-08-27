/*
  # Migration: Ajout de champs à la table tasks
  
  Cette migration ajoute les nouveaux champs à la table tasks existante
  pour améliorer la fonctionnalité de l'application MicroTask.
*/

-- Ajout des nouveaux champs à la table tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS estimated_duration interval,
ADD COLUMN IF NOT EXISTS latitude numeric(10,8),
ADD COLUMN IF NOT EXISTS longitude numeric(11,8),
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'France',
ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
ADD COLUMN IF NOT EXISTS started_at timestamptz,
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS photos text[],
ADD COLUMN IF NOT EXISTS attachments jsonb,
ADD COLUMN IF NOT EXISTS available_hours jsonb,
ADD COLUMN IF NOT EXISTS is_urgent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS view_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS application_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS metadata jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Mise à jour du statut existant pour inclure les nouvelles valeurs
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled', 'expired'));

-- Mise à jour de la contrainte de priorité
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_priority_check;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Mise à jour de la contrainte de statut de paiement
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_payment_status_check;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Création des index pour les nouveaux champs
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks (priority);
CREATE INDEX IF NOT EXISTS tasks_category_idx ON tasks (category);
CREATE INDEX IF NOT EXISTS tasks_city_idx ON tasks (city);
CREATE INDEX IF NOT EXISTS tasks_deadline_idx ON tasks (deadline);
CREATE INDEX IF NOT EXISTS tasks_author_idx ON tasks (author);
CREATE INDEX IF NOT EXISTS tasks_helper_idx ON tasks (helper);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks (created_at);
CREATE INDEX IF NOT EXISTS tasks_budget_idx ON tasks (budget);
CREATE INDEX IF NOT EXISTS tasks_is_urgent_idx ON tasks (is_urgent);
CREATE INDEX IF NOT EXISTS tasks_is_featured_idx ON tasks (is_featured);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

-- Suppression du trigger existant s'il existe
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;

-- Création du trigger pour updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Mise à jour des valeurs existantes
UPDATE tasks SET 
  priority = 'medium',
  country = 'France',
  payment_status = 'pending',
  updated_at = created_at
WHERE priority IS NULL OR country IS NULL OR payment_status IS NULL OR updated_at IS NULL;
