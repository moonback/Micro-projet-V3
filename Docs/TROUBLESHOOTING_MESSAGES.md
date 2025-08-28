# 🔧 Guide de Dépannage - Problèmes de Messages

## 🚨 Problème : Les utilisateurs ne voient pas les messages

### ✅ **Solutions à Tester**

#### 1. **Vérifier les Politiques RLS**
```sql
-- Vérifier que les politiques existent
SELECT policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE tablename = 'messages';

-- Vérifier que RLS est activé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'messages';
```

#### 2. **Tester les Permissions Directement**
```sql
-- Se connecter en tant qu'utilisateur test
-- Puis tester la lecture des messages
SELECT * FROM messages WHERE task_id = 'task-id-here';

-- Vérifier les erreurs dans les logs Supabase
```

#### 3. **Vérifier la Structure de la Base**
```sql
-- Vérifier que la table messages existe
SELECT * FROM information_schema.tables 
WHERE table_name = 'messages';

-- Vérifier les colonnes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages';
```

### 🔍 **Diagnostic Pas à Pas**

#### **Étape 1 : Vérifier l'Authentification**
- L'utilisateur est-il connecté ?
- `auth.uid()` retourne-t-il une valeur ?
- Les cookies de session sont-ils valides ?

#### **Étape 2 : Vérifier les Relations**
- La tâche existe-t-elle ?
- L'utilisateur est-il lié à la tâche ?
- Les messages ont-ils le bon `task_id` ?

#### **Étape 3 : Vérifier les Politiques RLS**
- Les politiques sont-elles créées ?
- Les conditions sont-elles satisfaites ?
- Y a-t-il des erreurs de syntaxe ?

### 🛠️ **Solutions Courantes**

#### **Problème 1 : Politiques RLS Manquantes**
```sql
-- Recréer les politiques
DROP POLICY IF EXISTS "Users can view messages" ON messages;
CREATE POLICY "Users can view messages" ON messages
FOR SELECT USING (
  auth.uid() IN (SELECT author FROM tasks WHERE id = task_id)
  OR
  auth.uid() IN (SELECT helper FROM tasks WHERE id = task_id)
  OR
  auth.uid() = sender
);
```

#### **Problème 2 : Récursion Infinie dans les Politiques RLS**
```sql
-- Erreur : "infinite recursion detected in policy for relation 'messages'"
-- Solution : Ne jamais référencer la table messages dans ses propres politiques RLS

-- ❌ INCORRECT (cause la récursion)
EXISTS (
  SELECT 1 FROM messages 
  WHERE task_id = messages.task_id 
    AND sender = auth.uid()
)

-- ✅ CORRECT (pas de récursion)
auth.uid() = sender

#### **Problème 3 : RLS Non Activé**
```sql
-- Activer RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

#### **Problème 4 : Erreurs de Syntaxe**
- Vérifier les guillemets et apostrophes
- Vérifier les noms de tables et colonnes
- Vérifier la syntaxe SQL

### 📱 **Test Frontend**

#### **Console du Navigateur**
```javascript
// Vérifier l'utilisateur connecté
console.log('User:', user);

// Vérifier les messages chargés
console.log('Messages:', messages);

// Vérifier les erreurs
console.log('Errors:', error);
```

#### **Network Tab**
- Vérifier les requêtes vers Supabase
- Vérifier les codes de réponse
- Vérifier les erreurs CORS

### 🔄 **Processus de Récupération**

1. **Appliquer la Migration Corrigée**
   ```bash
   # Exécuter la migration mise à jour
   supabase db reset
   # ou
   # Appliquer manuellement dans l'interface Supabase
   ```

2. **Tester les Politiques**
   ```sql
   -- Tester avec un utilisateur connecté
   SELECT * FROM messages LIMIT 1;
   ```

3. **Vérifier les Logs**
   - Logs Supabase
   - Console du navigateur
   - Network tab

### 📞 **Support**

Si le problème persiste :
1. Vérifier les logs Supabase
2. Tester avec un utilisateur simple
3. Vérifier la configuration du projet
4. Contacter le support Supabase si nécessaire

### 🎯 **Points de Vérification**

- [ ] RLS activé sur la table `messages`
- [ ] Politiques créées et actives
- [ ] Utilisateur authentifié
- [ ] Relations de base correctes
- [ ] Pas d'erreurs de syntaxe SQL
- [ ] Permissions Supabase correctes
