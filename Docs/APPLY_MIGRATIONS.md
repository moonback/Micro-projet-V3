# 🚀 Guide d'Application des Migrations - Correction Récursion

## 🚨 **Problème Critique : Récursion Infinie**

**Erreur :** `infinite recursion detected in policy for relation "messages"`

**Cause :** Les politiques RLS référencent la table `messages` dans leurs propres conditions.

## 🔧 **Solutions Disponibles**

### **Option 1 : Migration avec Fonction Helper** (Recommandée)
```bash
# Appliquer la migration avec fonction helper
supabase db reset
# ou exécuter manuellement dans l'interface Supabase :
# supabase/migrations/20250827091300_final_fix_recursion.sql
```

**Avantages :**
- ✅ Résout la récursion
- ✅ Permet l'accès aux conversations complètes
- ✅ Utilise une fonction helper sécurisée

### **Option 2 : Migration Simple** (Alternative)
```bash
# Appliquer la migration simple
# supabase/migrations/20250827091400_simple_no_recursion.sql
```

**Avantages :**
- ✅ Évite complètement la récursion
- ✅ Plus simple à comprendre
- ✅ Plus sécurisée

**Inconvénients :**
- ❌ Plus restrictive (pas d'accès aux conversations où l'utilisateur a participé)

## 📋 **Étapes d'Application**

### **Étape 1 : Sauvegarder (Optionnel)**
```sql
-- Dans l'interface Supabase SQL Editor
-- Vérifier l'état actuel
SELECT policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE tablename = 'messages';
```

### **Étape 2 : Appliquer la Migration**
```bash
# Option A : Reset complet
supabase db reset

# Option B : Migration manuelle
# Copier-coller le contenu de la migration choisie
# dans l'interface Supabase SQL Editor
```

### **Étape 3 : Vérifier**
```sql
-- Vérifier que les politiques sont créées
SELECT policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE tablename = 'messages';

-- Tester l'accès (en tant qu'utilisateur connecté)
SELECT COUNT(*) FROM messages LIMIT 1;
```

## 🧪 **Test de la Solution**

### **Test 1 : Vérifier l'Absence de Récursion**
```sql
-- Cette requête ne doit plus donner d'erreur de récursion
SELECT task_id, COUNT(*) as message_count
FROM messages 
GROUP BY task_id 
LIMIT 5;
```

### **Test 2 : Vérifier l'Accès aux Conversations**
```sql
-- Un utilisateur connecté doit pouvoir voir les messages
-- des tâches où il est impliqué
SELECT m.*, t.title as task_title
FROM messages m
JOIN tasks t ON m.task_id = t.id
WHERE t.author = auth.uid() OR t.helper = auth.uid()
LIMIT 10;
```

## 🚨 **En Cas de Problème**

### **Erreur Persistante**
```sql
-- Supprimer toutes les politiques et recommencer
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update message read status" ON messages;

-- Puis appliquer la migration choisie
```

### **Vérifier les Logs**
- Console du navigateur
- Network tab (erreurs 500)
- Logs Supabase

## 🎯 **Résultat Attendu**

Après application réussie :
- ✅ Plus d'erreur de récursion infinie
- ✅ Les utilisateurs peuvent voir les messages des tâches où ils sont impliqués
- ✅ Les utilisateurs peuvent envoyer des messages dans les tâches ouvertes
- ✅ Le système de conversations fonctionne correctement

## 📞 **Support**

Si le problème persiste :
1. Vérifier que toutes les politiques ont été supprimées
2. Appliquer la migration simple (option 2)
3. Tester avec un utilisateur simple
4. Vérifier la configuration du projet
