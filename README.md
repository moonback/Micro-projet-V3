# MicroTask - Plateforme Locale de Délégation de Tâches

Une application web React mobile-first pour déléguer et compléter des micro-tâches locales avec un traitement de paiement sécurisé.

## 🚀 Fonctionnalités Implémentées

### ✅ **Authentification et Profils**
- **Connexion/Inscription** : Authentification sécurisée email/mot de passe avec Supabase
- **Profils Utilisateurs** : Création automatique des profils avec gestion des informations
- **Gestion des Sessions** : Connexion persistante avec gestion des états

### ✅ **Gestion des Tâches**
- **Création de Tâches** : Formulaire complet avec sélection de localisation sur carte
- **Affichage des Tâches** : Vue liste et carte interactive avec filtrage avancé
- **Statuts des Tâches** : Workflow complet (Ouverte → Acceptée → En Cours → Terminée)
- **Actions sur les Tâches** : Acceptation, démarrage, finalisation, annulation

### ✅ **Système de Chat en Temps Réel**
- **Conversations** : Chat privé entre créateur et aide de tâche
- **Messages en Temps Réel** : Notifications instantanées avec Supabase Realtime
- **Historique des Messages** : Conservation de tous les échanges
- **Interface Intuitive** : Design mobile-first avec indicateurs visuels

### ✅ **Cartes et Localisation**
- **Sélecteur de Localisation** : Carte interactive pour choisir l'emplacement
- **Affichage des Tâches** : Marqueurs sur carte avec informations détaillées
- **Filtrage Géospatial** : Recherche par rayon (1km à 50km)
- **Intégration Leaflet** : Cartes OpenStreetMap performantes

### ✅ **Recherche et Filtrage Avancés**
- **Recherche Textuelle** : Par titre, description et catégorie
- **Filtres par Catégorie** : 10 catégories prédéfinies
- **Filtres par Budget** : Fourchettes de prix personnalisables
- **Filtres par Statut** : Tâches ouvertes, acceptées, en cours, terminées
- **Interface de Filtrage** : Panneau extensible avec indicateurs visuels

### ✅ **Navigation et Interface**
- **Navigation par Onglets** : Interface mobile-first avec navigation en bas
- **Vues Détaillées** : Navigation fluide entre liste, détails et chat
- **Design Responsive** : Optimisé pour mobile, tablette et desktop
- **Animations et Transitions** : Interface fluide et moderne

### ✅ **Système de Notifications**
- **Toasts Intelligents** : Notifications contextuelles avec auto-dismiss
- **Types de Notifications** : Succès, erreur, avertissement, information
- **Gestion Centralisée** : Hook personnalisé pour toute l'application

## 🛠️ Stack Technologique

### **Frontend**
- **React 18** : Framework principal avec hooks modernes
- **TypeScript** : Typage statique pour la robustesse
- **Tailwind CSS** : Framework CSS utilitaire pour le design
- **Vite** : Build tool ultra-rapide pour le développement

### **Backend et Base de Données**
- **Supabase** : Backend-as-a-Service avec PostgreSQL
- **PostGIS** : Extension géospatiale pour les localisations
- **Row Level Security (RLS)** : Sécurité au niveau des données
- **Realtime Subscriptions** : Mises à jour en temps réel

### **Cartes et Géolocalisation**
- **Leaflet** : Bibliothèque de cartes open-source
- **OpenStreetMap** : Données cartographiques gratuites
- **PostGIS** : Requêtes géospatiales performantes

### **Outils de Développement**
- **ESLint** : Linting et formatage du code
- **Prettier** : Formatage automatique
- **TypeScript ESLint** : Règles spécifiques TypeScript

## 📱 Fonctionnalités Mobile-First

- **Navigation par Pouce** : Boutons de 44px minimum pour l'accessibilité
- **Interface Touch-Friendly** : Optimisé pour les écrans tactiles
- **Responsive Design** : Adaptation automatique à tous les écrans
- **PWA Ready** : Architecture prête pour l'installation mobile

## 🔐 Sécurité et Performance

- **Authentification Supabase** : Gestion sécurisée des sessions
- **Politiques RLS** : Contrôle d'accès au niveau des données
- **Validation des Entrées** : Protection contre les injections
- **Optimisation des Requêtes** : Index géospatial et relationnels

## 🚀 Installation et Démarrage

### **Prérequis**
- Node.js 18+
- Compte Supabase
- Git

### **Installation Rapide**
```bash
# Cloner le repository
git clone <url-du-repository>
cd microtask

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# Démarrer en développement
npm run dev

# Construire pour la production
npm run build
```

### **Configuration Supabase**
1. Créer un nouveau projet Supabase
2. Exécuter la migration SQL fournie
3. Configurer les variables d'environnement
4. Activer les extensions PostGIS et Realtime

## 📁 Structure du Projet

```
src/
├── components/          # Composants React
│   ├── AuthForm.tsx        # Authentification
│   ├── BottomNavigation.tsx # Navigation principale
│   ├── TaskCard.tsx        # Carte de tâche
│   ├── TaskFeed.tsx        # Flux des tâches
│   ├── TaskDetail.tsx      # Détails d'une tâche
│   ├── CreateTask.tsx      # Création de tâche
│   ├── TaskMap.tsx         # Carte interactive
│   ├── LocationPicker.tsx  # Sélecteur de localisation
│   ├── MyTasks.tsx         # Gestion des tâches
│   ├── Messages.tsx        # Liste des conversations
│   ├── ChatView.tsx        # Interface de chat
│   ├── Profile.tsx         # Profil utilisateur
│   ├── TaskFilters.tsx     # Filtres et recherche
│   └── NotificationToast.tsx # Système de notifications
├── hooks/               # Hooks personnalisés
│   ├── useAuth.ts          # Gestion de l'authentification
│   └── useNotifications.ts # Système de notifications
├── lib/                 # Configuration et utilitaires
│   └── supabase.ts         # Client Supabase
└── App.tsx             # Composant principal
```

## 🔄 Workflow des Tâches

1. **Création** : Utilisateur crée une tâche avec localisation et budget
2. **Acceptation** : Aide accepte la tâche → statut "Acceptée"
3. **Démarrage** : Aide démarre le travail → statut "En Cours"
4. **Finalisation** : Créateur confirme la completion → statut "Terminée"
5. **Communication** : Chat en temps réel à chaque étape

## 🎯 Prochaines Étapes

### **Fonctionnalités Planifiées**
- [ ] **Système de Paiement** : Intégration Stripe avec escrow
- [ ] **Évaluations et Avis** : Système de notation des utilisateurs
- [ ] **Notifications Push** : Alertes en temps réel sur mobile
- [ ] **Gestion des Photos** : Upload et affichage des images
- [ ] **API Mobile** : Endpoints REST pour applications natives

### **Améliorations Techniques**
- [ ] **Tests Automatisés** : Jest et React Testing Library
- [ ] **CI/CD Pipeline** : Déploiement automatique
- [ ] **Monitoring** : Logs et métriques de performance
- [ ] **Cache Redis** : Optimisation des requêtes fréquentes

## 🤝 Contribution

1. Fork du repository
2. Créer une branche de fonctionnalité
3. Implémenter les changements
4. Ajouter les tests correspondants
5. Soumettre une pull request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

- **Documentation** : Consultez ce README et les commentaires du code
- **Issues** : Signalez les bugs via GitHub Issues
- **Discussions** : Questions et suggestions dans GitHub Discussions

---

**MicroTask** - Rendez service à votre communauté locale ! 🚀