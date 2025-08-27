# 🚀 Guide Rapide - Migration des Demandes en Attente

## 🚨 **Problème Actuel**
L'application affiche des erreurs car la fonction `request_task_approval` n'existe pas encore dans votre base de données Supabase.

## ✅ **Solution : Appliquer la Migration**

### **Étape 1 : Aller dans Supabase Dashboard**
1. Connectez-vous à [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** (menu de gauche)

### **Étape 2 : Exécuter la Migration**
1. Copiez le contenu du fichier `migration_demandes_en_attente.sql`
2. Collez-le dans l'éditeur SQL
3. Cliquez sur **Run**

### **Étape 3 : Vérifier l'Installation**
Exécutez cette requête pour vérifier :
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('request_task_approval', 'approve_task_request', 'reject_task_request');
```

Vous devriez voir 3 fonctions listées.

## 🔧 **Problèmes Corrigés dans le Code**

### **1. Jointures Supabase Corrigées**
- ✅ `author_profile:profiles!tasks_author_fkey(*)`
- ✅ `helper_profile:profiles!tasks_helper_fkey(*)`
- ✅ `helper_profile:profiles!pending_task_requests_helper_id_fkey(*)`

### **2. Fonctions Mises à Jour**
- ✅ `getPendingRequests()`
- ✅ `getPendingRequestsForAuthor()`
- ✅ `getAcceptedTasks()`

## 🧪 **Test Après Migration**

1. **Redémarrez l'application** (Ctrl+C puis `npm run dev`)
2. **Testez la demande d'approbation** sur une tâche
3. **Vérifiez l'onglet "En Attente"** dans la navigation
4. **Testez l'approbation/rejet** des demandes

## 🆘 **En Cas de Problème**

### **Erreur "Function does not exist"**
- Vérifiez que la migration a été exécutée
- Vérifiez les logs Supabase pour les erreurs

### **Erreur de Jointure**
- Les jointures ont été corrigées dans le code
- Redémarrez l'application après la migration

---

**⏱️ Temps estimé : 5-10 minutes**
**🎯 Objectif : Système de demandes en attente fonctionnel**
