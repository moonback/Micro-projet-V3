# 🔧 Guide de Configuration - Résolution des Problèmes de Persistance

## 🚨 **Problème Identifié**

La connexion ne persiste pas après actualisation de la page et le profil utilisateur n'est pas retrouvé.

## ✅ **Solutions Implémentées**

### **1. Amélioration du Hook useAuth**

- **Cache des profils** : Mise en cache des profils utilisateur pour éviter les rechargements
- **Gestion des sessions** : Meilleure gestion des événements d'authentification
- **Création automatique** : Création automatique du profil si manquant
- **Logs de débogage** : Ajout de logs pour tracer les problèmes

### **2. Configuration Supabase Optimisée**

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // ✅ Persistance de session
    storageKey: 'microtask-auth', // ✅ Clé de stockage personnalisée
    autoRefreshToken: true,      // ✅ Rafraîchissement automatique des tokens
    detectSessionInUrl: true,    // ✅ Détection des sessions dans l'URL
    flowType: 'pkce'            // ✅ Type de flux sécurisé
  }
})
```

### **3. Validation de l'Environnement**

- **Vérification automatique** des variables d'environnement au démarrage
- **Messages d'erreur clairs** en cas de configuration manquante
- **Logs de débogage** pour identifier les problèmes

## 🔧 **Configuration Requise**

### **Variables d'Environnement**

Créez un fichier `.env` à la racine du projet :

```bash
# Configuration Supabase (OBLIGATOIRE)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase

# URL du site (optionnel)
VITE_SITE_URL=https://votre-site.netlify.app
```

### **Vérification de la Configuration**

1. **Redémarrez l'application** après avoir créé le fichier `.env`
2. **Vérifiez la console** pour les messages de validation
3. **Testez la connexion** avec un compte existant

## 🐛 **Débogage et Tests**

### **Bouton de Débogage**

Un bouton de débogage a été ajouté dans le profil utilisateur :

1. **Connectez-vous** à l'application
2. **Allez dans l'onglet Profil**
3. **Cliquez sur "🔍 Déboguer l'Authentification"**
4. **Vérifiez la console** pour les informations de débogage

### **Logs de Débogage**

Les logs suivants sont maintenant affichés dans la console :

```
Getting initial session...
Initial session found for user: [user-id]
Profile loaded: [profile-data]
Auth state changed: TOKEN_REFRESHED [user-id]
```

## 🔄 **Processus de Connexion Amélioré**

### **1. Démarrage de l'Application**
- Validation de l'environnement
- Récupération de la session existante
- Chargement du profil utilisateur

### **2. Gestion des Sessions**
- **Persistance** : Session sauvegardée dans le stockage local
- **Rafraîchissement** : Tokens rafraîchis automatiquement
- **Cache** : Profils mis en cache pour éviter les rechargements

### **3. Récupération des Profils**
- **Vérification du cache** : Utilisation du profil en cache si disponible
- **Création automatique** : Création du profil si manquant
- **Gestion des erreurs** : Logs détaillés en cas de problème

## 🚀 **Tests de Persistance**

### **Test 1 : Connexion Simple**
1. Connectez-vous à l'application
2. Vérifiez que vous êtes sur la page des tâches
3. Actualisez la page (F5)
4. Vérifiez que vous êtes toujours connecté

### **Test 2 : Fermeture et Réouverture**
1. Connectez-vous à l'application
2. Fermez l'onglet du navigateur
3. Rouvrez l'application
4. Vérifiez que vous êtes toujours connecté

### **Test 3 : Débogage du Profil**
1. Connectez-vous à l'application
2. Allez dans le profil
3. Cliquez sur le bouton de débogage
4. Vérifiez les informations dans la console

## 🔍 **Diagnostic des Problèmes**

### **Si la Connexion ne Persiste Pas**

1. **Vérifiez le fichier `.env`** :
   ```bash
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
   ```

2. **Vérifiez la console** pour les erreurs :
   ```
   Environment validation failed: VITE_SUPABASE_URL is missing
   ```

3. **Vérifiez le stockage local** :
   - Ouvrez les DevTools (F12)
   - Allez dans Application > Storage > Local Storage
   - Vérifiez la présence de `microtask-auth`

### **Si le Profil n'est Pas Trouvé**

1. **Vérifiez la base de données** :
   - Allez dans votre dashboard Supabase
   - Vérifiez la table `profiles`
   - Vérifiez que l'utilisateur a un profil

2. **Vérifiez les politiques RLS** :
   - Assurez-vous que les politiques permettent la lecture des profils
   - Vérifiez que l'utilisateur peut accéder à sa propre donnée

## 📱 **Support Mobile**

### **Stockage Persistant**
- **Local Storage** : Utilisé pour la persistance des sessions
- **Session Storage** : Fallback si le local storage n'est pas disponible
- **Cookies** : Gérés automatiquement par Supabase

### **Gestion des Tokens**
- **Access Token** : Valide pendant 1 heure
- **Refresh Token** : Valide pendant 1 an
- **Renouvellement automatique** : Géré par Supabase

## 🎯 **Résultat Attendu**

Après configuration correcte :

✅ **Connexion persistante** après actualisation  
✅ **Profil automatiquement chargé** au démarrage  
✅ **Session maintenue** entre les sessions  
✅ **Logs de débogage** pour identifier les problèmes  
✅ **Gestion d'erreurs** claire et informative  

## 🆘 **En Cas de Problème Persistant**

1. **Vérifiez la configuration** Supabase
2. **Testez avec le bouton de débogage**
3. **Vérifiez les logs de la console**
4. **Contactez le support** avec les logs d'erreur

---

**🎉 Votre application devrait maintenant maintenir la connexion correctement !**
