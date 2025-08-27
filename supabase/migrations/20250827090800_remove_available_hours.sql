-- Migration pour supprimer le champ available_hours de la table tasks
-- Date: 2025-08-27

-- Supprimer le champ available_hours de la table tasks
ALTER TABLE tasks DROP COLUMN IF EXISTS available_hours;
