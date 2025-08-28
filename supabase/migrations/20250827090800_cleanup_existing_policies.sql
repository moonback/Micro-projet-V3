-- Migration de nettoyage - Supprimer les politiques RLS existantes sur messages
-- À exécuter AVANT la migration principale si des erreurs de conflit surviennent

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Users can update message read status" ON messages;
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;

-- Supprimer les triggers existants (en premier car ils dépendent des fonctions)
DROP TRIGGER IF EXISTS validate_message_update_trigger ON messages;

-- Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS mark_messages_as_read(UUID, UUID);
DROP FUNCTION IF EXISTS count_unread_messages(UUID, UUID);
DROP FUNCTION IF EXISTS validate_message_update();

-- Note: Cette migration est optionnelle et ne doit être exécutée que si nécessaire
