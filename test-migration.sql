-- Test de la migration des messages
-- Ce fichier peut être exécuté après la migration pour vérifier que tout fonctionne

-- 1. Vérifier que les nouvelles colonnes existent
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
  AND column_name IN ('is_read', 'read_at')
ORDER BY column_name;

-- 2. Vérifier que les index existent
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'messages' 
  AND indexname LIKE '%is_read%' 
   OR indexname LIKE '%read_at%';

-- 3. Vérifier que les politiques RLS existent
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'messages';

-- 4. Vérifier que les fonctions existent
SELECT 
  proname, 
  prosrc
FROM pg_proc 
WHERE proname IN ('mark_messages_as_read', 'count_unread_messages', 'validate_message_update');

-- 5. Vérifier que les triggers existent
SELECT 
  tgname, 
  tgrelid::regclass as table_name,
  tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgrelid = 'messages'::regclass;

-- 6. Test de la fonction count_unread_messages (si des messages existent)
-- SELECT count_unread_messages('task-uuid-here', 'user-uuid-here');

-- 8. Vérifier que RLS est activé sur la table messages
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'messages';

-- 9. Vérifier les contraintes de la table
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'messages';

-- 10. Vérifier les clés étrangères
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'messages';

-- 7. Vérifier la structure finale de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;
