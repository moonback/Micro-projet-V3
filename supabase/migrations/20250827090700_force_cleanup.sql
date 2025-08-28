-- Migration de nettoyage forcé - Supprimer TOUS les éléments existants avec CASCADE
-- À utiliser uniquement si les autres méthodes échouent

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Users can update message read status" ON messages;
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;

-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS validate_message_update_trigger ON messages;

-- Supprimer les fonctions existantes avec CASCADE (force la suppression des dépendances)
DROP FUNCTION IF EXISTS validate_message_update() CASCADE;
DROP FUNCTION IF EXISTS mark_messages_as_read(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS count_unread_messages(UUID, UUID) CASCADE;

-- Note: Cette migration est la solution de dernier recours
-- Elle supprime FORCÉMENT tous les éléments et leurs dépendances
