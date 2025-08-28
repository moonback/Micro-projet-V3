-- Migration de test pour vérifier l'accès aux conversations
-- Teste que les utilisateurs qui ont participé peuvent voir tous les messages

-- Test 1: Vérifier que la politique fonctionne sans récursion
-- Cette requête devrait fonctionner pour un utilisateur connecté
SELECT 
  'Test politique RLS' as test_name,
  COUNT(*) as message_count
FROM messages 
WHERE task_id IN (
  SELECT DISTINCT task_id 
  FROM messages 
  WHERE sender = auth.uid()
)
LIMIT 1;

-- Test 2: Vérifier que les utilisateurs peuvent voir les conversations où ils ont participé
-- (Ce test doit être exécuté en tant qu'utilisateur connecté)
SELECT 
  'Test accès conversation' as test_name,
  m.task_id,
  COUNT(*) as total_messages,
  COUNT(CASE WHEN m.sender = auth.uid() THEN 1 END) as my_messages,
  COUNT(CASE WHEN m.sender != auth.uid() THEN 1 END) as other_messages
FROM messages m
WHERE m.task_id IN (
  SELECT DISTINCT task_id 
  FROM messages 
  WHERE sender = auth.uid()
)
GROUP BY m.task_id
LIMIT 5;

-- Note: Ces tests vérifient que la politique RLS fonctionne correctement
-- sans causer de récursion infinie
