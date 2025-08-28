# Guide de Déploiement - Migration des Messages

## 🚀 Déploiement de la Migration

### 1. Prérequis
- Accès au dashboard Supabase
- Permissions d'administrateur sur la base de données
- Sauvegarde de la base de données (recommandé)

### 2. Application de la Migration

#### Option A : Via le Dashboard Supabase
1. **Ouvrir le Dashboard Supabase**
   - Aller sur [supabase.com](https://supabase.com)
   - Sélectionner votre projet

2. **Accéder à l'éditeur SQL**
   - Cliquer sur "SQL Editor" dans le menu de gauche
   - Créer un nouveau script

3. **Exécuter la migration**
   - Copier le contenu de `supabase/migrations/20250827090900_add_message_fields.sql`
   - Coller dans l'éditeur SQL
   - Cliquer sur "Run" pour exécuter

#### Option B : Via la CLI Supabase
```bash
# Installer la CLI Supabase si ce n'est pas déjà fait
npm install -g supabase

# Se connecter à votre projet
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Appliquer la migration
supabase db push
```

### 3. Configuration du Stockage

#### Créer le Bucket pour les Pièces Jointes
```sql
-- Dans l'éditeur SQL de Supabase
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true);
```

#### Configurer les Politiques de Stockage
```sql
-- Permettre l'upload des pièces jointes
CREATE POLICY "Users can upload chat attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-attachments' AND
  auth.uid() IS NOT NULL
);

-- Permettre la lecture des pièces jointes
CREATE POLICY "Users can view chat attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat-attachments' AND
  auth.uid() IS NOT NULL
);
```

### 4. Vérification de la Migration

#### Exécuter les Tests
```sql
-- Copier et exécuter le contenu de test-migration.sql
-- Vérifier que tous les éléments sont créés correctement
```

#### Vérifications Manuelles
1. **Nouvelles colonnes** : `is_read` et `read_at` dans la table `messages`
2. **Index** : `messages_is_read_idx` et `messages_read_at_idx`
3. **Politiques RLS** : `Users can update message read status` et `Users can insert messages`
4. **Fonctions** : `mark_messages_as_read`, `count_unread_messages`, `validate_message_update`
5. **Trigger** : `validate_message_update_trigger`

### 5. Tests de Fonctionnalité

#### Test des Messages Non Lus
```sql
-- Insérer un message de test
INSERT INTO messages (task_id, sender, content, is_read) 
VALUES ('task-uuid', 'user-uuid', 'Test message', false);

-- Vérifier le comptage
SELECT count_unread_messages('task-uuid', 'other-user-uuid');
```

#### Test de la Validation
```sql
-- Essayer de modifier le contenu (doit échouer)
UPDATE messages 
SET content = 'Modified content' 
WHERE id = 'message-uuid';

-- Modifier le statut de lecture (doit réussir)
UPDATE messages 
SET is_read = true, read_at = NOW() 
WHERE id = 'message-uuid';
```

### 6. Gestion des Erreurs

#### Erreurs Courantes

**Erreur : "missing FROM-clause entry for table 'old'"**
- **Cause** : Utilisation incorrecte de `OLD` et `NEW` dans les politiques RLS
- **Solution** : Utiliser des triggers à la place (déjà corrigé)

**Erreur : "function does not exist"**
- **Cause** : Les fonctions n'ont pas été créées
- **Solution** : Vérifier que la migration s'est bien exécutée

**Erreur : "policy already exists"**
- **Cause** : Tentative de créer une politique qui existe déjà
- **Solution** : Utiliser `CREATE POLICY IF NOT EXISTS` ou supprimer d'abord

#### Rollback en Cas de Problème
```sql
-- Supprimer les nouvelles colonnes
ALTER TABLE messages DROP COLUMN IF EXISTS is_read;
ALTER TABLE messages DROP COLUMN IF EXISTS read_at;

-- Supprimer les index
DROP INDEX IF EXISTS messages_is_read_idx;
DROP INDEX IF EXISTS messages_read_at_idx;

-- Supprimer les politiques
DROP POLICY IF EXISTS "Users can update message read status" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS mark_messages_as_read(UUID, UUID);
DROP FUNCTION IF EXISTS count_unread_messages(UUID, UUID);
DROP FUNCTION IF EXISTS validate_message_update();

-- Supprimer le trigger
DROP TRIGGER IF EXISTS validate_message_update_trigger ON messages;
```

### 7. Post-Déploiement

#### Mise à Jour des Messages Existants
```sql
-- Marquer tous les messages existants comme lus par l'expéditeur
UPDATE messages 
SET is_read = true, read_at = created_at 
WHERE sender = auth.uid();
```

#### Vérification des Performances
```sql
-- Vérifier l'utilisation des index
EXPLAIN ANALYZE 
SELECT COUNT(*) FROM messages 
WHERE is_read = false AND task_id = 'task-uuid';
```

### 8. Monitoring

#### Métriques à Surveiller
- **Temps de réponse** des requêtes sur la table messages
- **Utilisation des index** pour les colonnes `is_read` et `read_at`
- **Performance** des fonctions de comptage
- **Espace disque** utilisé par les nouvelles colonnes

#### Alertes Recommandées
- Erreurs de validation des messages
- Échecs d'insertion de messages
- Problèmes de performance sur les requêtes de messages

---

## ✅ Checklist de Déploiement

- [ ] Migration exécutée sans erreur
- [ ] Nouvelles colonnes créées
- [ ] Index créés
- [ ] Politiques RLS configurées
- [ ] Fonctions créées
- [ ] Trigger configuré
- [ ] Bucket de stockage créé
- [ ] Tests de fonctionnalité réussis
- [ ] Messages existants mis à jour
- [ ] Performance vérifiée
- [ ] Documentation mise à jour

---

## 🆘 Support

En cas de problème lors du déploiement :
1. Vérifier les logs d'erreur dans le dashboard Supabase
2. Consulter la section "Gestion des Erreurs" ci-dessus
3. Tester les requêtes de vérification
4. Contacter l'équipe de développement si nécessaire
