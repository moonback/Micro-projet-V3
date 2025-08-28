# 🚀 Guide de Déploiement sur Netlify

## 📋 **Prérequis**

- Compte Netlify
- Projet Git (GitHub, GitLab, Bitbucket)
- Node.js 18+ installé localement

## 🔧 **Configuration Locale**

### **1. Build de Test**
```bash
# Installer les dépendances
npm install

# Build de production
npm run build

# Vérifier que le build fonctionne
npm run preview
```

### **2. Vérifier les Fichiers de Configuration**
- ✅ `netlify.toml` - Configuration Netlify
- ✅ `public/_redirects` - Redirections SPA
- ✅ `vite.config.ts` - Configuration Vite optimisée

## 🌐 **Déploiement sur Netlify**

### **Option 1 : Déploiement via Git (Recommandé)**

1. **Connecter le Repository**
   - Aller sur [netlify.com](https://netlify.com)
   - Cliquer sur "New site from Git"
   - Choisir votre provider Git
   - Sélectionner le repository

2. **Configuration du Build**
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
   - **Node version** : `18` (ou plus récent)

3. **Variables d'Environnement**
   ```
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
   ```

4. **Déployer**
   - Cliquer sur "Deploy site"
   - Attendre la fin du build

### **Option 2 : Déploiement Manuel**

1. **Build Local**
   ```bash
   npm run build
   ```

2. **Upload du Dossier `dist`**
   - Aller sur Netlify
   - "New site from Git" → "Deploy manually"
   - Glisser-déposer le dossier `dist`

## ⚠️ **Résolution des Erreurs Courantes**

### **Erreur MIME Type**
```
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "application/octet-stream"
```

**Solution** : Utiliser les fichiers `netlify.toml` et `_redirects` fournis

### **Erreur 404 sur les Routes**
```
Page not found
```

**Solution** : Le fichier `_redirects` avec `/* /index.html 200` résout ce problème

### **Erreur de Build**
```
Build failed
```

**Solutions** :
- Vérifier la version Node.js (18+)
- Vérifier les variables d'environnement
- Tester le build localement

### **Problème de Redirection Email**
```
Lien d'activation contient "localhost" au lieu de l'URL de production
```

**Solutions** :
- Configurer `VITE_SITE_URL` dans Netlify avec l'URL de production
- Vérifier que la variable d'environnement est bien définie
- Redéployer après modification des variables d'environnement

## 🔍 **Vérification Post-Déploiement**

### **1. Test des Fonctionnalités**
- ✅ Splash screen s'affiche
- ✅ Navigation fonctionne
- ✅ Carte s'affiche correctement
- ✅ Géocodification fonctionne
- ✅ Statistiques se chargent

### **2. Test des Routes**
- `/` → Page d'accueil
- `/auth` → Formulaire d'authentification
- `/feed` → Flux des tâches
- `/profile` → Profil utilisateur

### **3. Test Mobile**
- Responsive design
- Touch interactions
- Performance

## 📱 **Configuration Avancée**

### **Headers de Sécurité**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### **Compression Gzip**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Encoding = "gzip"
```

### **Cache des Assets**
```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## 🚀 **Optimisations de Performance**

### **1. Lazy Loading**
- Images optimisées
- Composants chargés à la demande
- Code splitting automatique

### **2. Bundle Analysis**
```bash
# Analyser la taille du bundle
npm run build -- --analyze
```

### **3. Lighthouse Score**
- Performance : 90+
- Accessibility : 95+
- Best Practices : 90+
- SEO : 90+

## 🔧 **Maintenance**

### **1. Mises à Jour Automatiques**
- Netlify déploie automatiquement à chaque push
- Branche `main` = production
- Branche `develop` = staging

### **2. Rollback**
- Netlify garde l'historique des déploiements
- Possibilité de revenir à une version précédente

### **3. Monitoring**
- Logs de build
- Métriques de performance
- Alertes d'erreur

## 📞 **Support**

### **En Cas de Problème**
1. Vérifier les logs de build Netlify
2. Tester le build localement
3. Vérifier la configuration
4. Consulter la documentation Netlify

### **Ressources Utiles**
- [Documentation Netlify](https://docs.netlify.com)
- [Documentation Vite](https://vitejs.dev)
- [React Deployment](https://create-react-app.dev/docs/deployment)

---

**🎉 Votre application MicroTask est maintenant prête pour la production sur Netlify !**
