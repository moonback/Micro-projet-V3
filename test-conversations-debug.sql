-- Script de test pour déboguer les conversations
-- À exécuter dans l'interface Supabase SQL Editor

-- 1. Vérifier que les politiques RLS existent
SELECT 
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'messages';

-- 2. Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'messages';

-- 3. Compter les messages par tâche
SELECT 
  task_id,
  COUNT(*) as message_count
FROM messages 
GROUP BY task_id 
ORDER BY message_count DESC
LIMIT 10;

-- 4. Vérifier les tâches avec messages
SELECT 
  t.id,
  t.title,
  t.status,
  t.author,
  t.helper,
  COUNT(m.id) as message_count
FROM tasks t
LEFT JOIN messages m ON t.id = m.task_id
GROUP BY t.id, t.title, t.status, t.author, t.helper
HAVING COUNT(m.id) > 0
ORDER BY message_count DESC
LIMIT 10;

-- 5. Tester l'accès aux messages (doit fonctionner sans erreur)
SELECT COUNT(*) as total_messages FROM messages;

-- 6. Vérifier la structure de la table messages
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
