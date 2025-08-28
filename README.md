# 🚀 MicroTask - Plateforme Locale de Délégation de Tâches

Une application web React mobile-first moderne pour déléguer et compléter des micro-tâches locales avec une interface utilisateur intuitive et des fonctionnalités avancées.

## ✨ Fonctionnalités Principales

### 🔐 **Authentification et Gestion des Profils**
- **Connexion/Inscription** : Authentification sécurisée email/mot de passe avec Supabase
- **Profils Utilisateurs** : Création automatique des profils avec gestion des informations
- **Gestion des Sessions** : Connexion persistante avec gestion des états
- **Vérification Email** : Système de confirmation des comptes

### 📋 **Gestion Avancée des Tâches**
- **Création en 4 Étapes** : Wizard intuitif avec validation progressive
- **Système de Tags** : Catégorisation flexible avec suggestions prédéfinies
- **Priorités** : 4 niveaux (low, medium, high, urgent) avec indicateurs visuels
- **Options Spéciales** : Tâches urgentes et mises en avant
- **Gestion des Photos** : Upload multiple avec aperçu et suppression
- **Durée Estimée** : Estimation flexible du temps de travail
- **Échéances** : Gestion des deadlines avec alertes

### 🗺️ **Cartes et Localisation Avancées**
- **Sélecteur de Localisation** : Carte interactive Leaflet avec OpenStreetMap
- **Coordonnées Précises** : Latitude/longitude séparées pour les requêtes géospatiales
- **Informations Détaillées** : Ville, code postal, pays, adresse complète
- **Recherche Géographique** : Filtrage par rayon et proximité
- **PostGIS Integration** : Requêtes géospatiales performantes
- **Affichage de Localisation dans le Header** : Indicateur de position utilisateur en temps réel
- **Calcul de Distances Précises** : Algorithme Haversine pour des distances GPS exactes

### 💬 **Système de Chat en Temps Réel**
- **Conversations Privées** : Chat entre créateur et aide de tâche
- **Messages Instantanés** : Notifications en temps réel avec Supabase Realtime
- **Historique Complet** : Conservation de tous les échanges
- **Interface Intuitive** : Design mobile-first avec indicateurs visuels
- **Gestion des Pièces Jointes** : Support des fichiers dans les conversations
- **Notifications Push** : Alertes en temps réel pour nouveaux messages
- **Marquage de Lecture** : Suivi des messages lus/non lus

### 🔍 **Recherche et Filtrage Avancés**
- **Recherche Textuelle** : Par titre, description, catégorie et tags
- **Filtres Multiples** : Catégorie, priorité, budget, statut, localisation
- **Système de Tags** : Filtrage par tags avec logique OR
- **Plages de Budget** : Filtres min/max personnalisables
- **Options Spéciales** : Filtrage des tâches urgentes et mises en avant
- **Tri Multiple** : Par date, budget, priorité, échéance, distance
- **Pagination** : Navigation fluide dans les résultats

### 📊 **Tableau de Bord et Analytics**
- **Statistiques Détaillées** : Total, terminées, budget, répartition par statut
- **Graphiques Visuels** : Répartition par priorité et catégorie
- **Métriques de Performance** : Compteurs de vues et candidatures
- **Périodes Configurables** : Analyse par jour, semaine, mois, année
- **Actions Rapides** : Accès direct aux fonctionnalités principales

### 🎨 **Interface Utilisateur Moderne**
- **Design Mobile-First** : Optimisé pour tous les appareils
- **Animations Fluides** : Framer Motion pour une expérience premium
- **Navigation Intuitive** : Bottom bar colorée avec indicateurs visuels
- **Thème Cohérent** : Palette de couleurs moderne avec gradients
- **Composants Réutilisables** : Architecture modulaire et maintenable
- **Logo Personnalisé** : Composant Logo dédié avec support PNG
- **Header Centralisé** : Gestion unifiée des modales et filtres
- **Affichage de Localisation** : Indicateur de position dans le header avec états visuels

### 🔔 **Système de Notifications**
- **React Hot Toast** : Notifications toast modernes et animées
- **Types Variés** : Succès, erreur, avertissement, information
- **Auto-dismiss** : Disparition automatique configurable
- **Gestion Centralisée** : Hook personnalisé pour toute l'application
- **Notifications Temps Réel** : Alertes instantanées pour les messages

### 📱 **Navigation Adaptative**
- **Mobile** : Bottom navigation avec onglets colorés
- **Desktop** : Sidebar latérale avec navigation rapide
- **Responsive** : Adaptation automatique selon la taille d'écran
- **Animations** : Transitions fluides entre les vues

### 🎯 **Nouvelles Fonctionnalités de Localisation**
- **Indicateur de Position dans le Header** : Affichage en temps réel de la localisation utilisateur
- **Calcul de Distances GPS Précises** : Algorithme Haversine pour des distances exactes
- **Gestion des États de Localisation** : Chargement, erreur, et position définie
- **Actualisation de Position** : Bouton de rafraîchissement pour mettre à jour la localisation
- **Affichage Responsive** : Adaptation automatique selon la taille d'écran
- **Synchronisation Globale** : Context React pour la mise à jour de la localisation dans toute l'application

## 🛠️ Stack Technologique

### **Frontend**
- **React 18** : Framework principal avec hooks modernes et Suspense
- **TypeScript 5.5** : Typage statique strict pour la robustesse
- **Tailwind CSS 3.4** : Framework CSS utilitaire avec design system
- **Vite 5.4** : Build tool ultra-rapide avec HMR
- **Framer Motion 12** : Animations fluides et micro-interactions

### **Backend et Base de Données**
- **Supabase** : Backend-as-a-Service avec PostgreSQL 15
- **PostGIS** : Extension géospatiale pour les localisations avancées
- **Row Level Security (RLS)** : Sécurité au niveau des données
- **Realtime Subscriptions** : Mises à jour en temps réel
- **Storage** : Gestion des fichiers et photos

### **Cartes et Géolocalisation**
- **Leaflet 1.9** : Bibliothèque de cartes open-source performante
- **OpenStreetMap** : Données cartographiques gratuites et fiables
- **PostGIS** : Requêtes géospatiales optimisées (ST_DWithin, ST_Distance)
- **Algorithme Haversine** : Calcul de distances GPS précises entre coordonnées

### **Outils de Développement**
- **ESLint 9** : Linting et formatage du code avec règles TypeScript
- **PostCSS** : Traitement CSS avancé
- **Autoprefixer** : Compatibilité navigateurs automatique

## 📱 Fonctionnalités Mobile-First

- **Navigation par Pouce** : Boutons de 44px minimum pour l'accessibilité
- **Interface Touch-Friendly** : Optimisé pour les écrans tactiles
- **Responsive Design** : Adaptation automatique à tous les écrans
- **PWA Ready** : Architecture prête pour l'installation mobile
- **Safe Areas** : Support des encoches et barres de navigation
- **Gestures** : Support des gestes tactiles natifs

## 🔐 Sécurité et Performance

- **Authentification Supabase** : Gestion sécurisée des sessions avec JWT
- **Politiques RLS** : Contrôle d'accès au niveau des données
- **Validation des Entrées** : Protection contre les injections et XSS
- **Optimisation des Requêtes** : Index géospatial et relationnels
- **HTTPS** : Chiffrement des données en transit
- **Rate Limiting** : Protection contre les abus

## 🚀 Installation et Démarrage

### **Prérequis**
- Node.js 18+ (recommandé : 20+)
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

# Prévisualiser la production
npm run preview
```

### **Configuration Supabase**
1. Créer un nouveau projet Supabase
2. Exécuter les migrations SQL dans l'ordre :
   - `20250827090530_nameless_meadow.sql` (structure de base)
   - `20250827090600_add_task_fields.sql` (champs des tâches)
   - `20250827090700_add_task_policies.sql` (politiques de sécurité)
   - `20250827090800_remove_available_hours.sql` (nettoyage)
   - `20250827090900_add_message_fields.sql` (système de messages)
   - `20250827091300_final_fix_recursion.sql` (correction RLS)
3. Configurer les variables d'environnement
4. Activer les extensions PostGIS et Realtime
5. Configurer les politiques RLS pour la sécurité

## 📁 Architecture du Projet

```
src/
├── components/          # Composants React modulaires (30+ composants)
│   ├── AuthForm.tsx        # Authentification avec validation
│   ├── BottomNavigation.tsx # Navigation principale mobile-first
│   ├── TaskCard.tsx        # Carte de tâche avec actions
│   ├── TaskFeed.tsx        # Flux des tâches avec filtres
│   ├── TaskDetail.tsx      # Détails complets d'une tâche
│   ├── CreateTask.tsx      # Création en 4 étapes
│   ├── TaskMap.tsx         # Carte interactive Leaflet
│   ├── LocationPicker.tsx  # Sélecteur de localisation
│   ├── MyTasks.tsx         # Gestion des tâches utilisateur
│   ├── Messages.tsx        # Liste des conversations
│   ├── ChatView.tsx        # Interface de chat temps réel
│   ├── Profile.tsx         # Profil utilisateur complet
│   ├── TaskFilters.tsx     # Filtres et recherche avancés
│   ├── TaskDashboard.tsx   # Tableau de bord et analytics
│   ├── NotificationToast.tsx # Système de notifications
│   ├── ConfirmationModal.tsx # Modales de confirmation
│   ├── SkeletonLoader.tsx  # États de chargement
│   ├── SplashScreen.tsx    # Écran de démarrage
│   ├── Header.tsx          # En-tête centralisé avec modales et localisation
│   ├── Logo.tsx            # Composant logo personnalisé
│   ├── ConversationList.tsx # Liste des conversations
│   ├── MessageStats.tsx    # Statistiques des messages
│   ├── MessageNotificationBadge.tsx # Badge de notifications
│   ├── HomePage.tsx        # Page d'accueil
│   ├── UserLocationManager.tsx # Gestionnaire de localisation utilisateur
│   ├── SimpleLocationManager.tsx # Gestionnaire de localisation simplifié
│   ├── UserLocationBadge.tsx # Badge d'affichage de localisation
│   ├── DistanceBadge.tsx   # Badge d'affichage des distances
│   ├── TaskHistory.tsx     # Historique des tâches
│   ├── TaskApplications.tsx # Gestion des candidatures
│   └── TaskApplicationView.tsx # Vue des candidatures
├── hooks/               # Hooks personnalisés (10 hooks)
│   ├── useAuth.ts          # Gestion de l'authentification
│   ├── useTasks.ts         # Gestion complète des tâches
│   ├── useNotifications.ts # Système de notifications
│   ├── useRealtimeSync.ts  # Synchronisation temps réel
│   ├── useMessages.ts      # Gestion des messages
│   ├── useConversations.ts # Gestion des conversations
│   ├── useMessageNotifications.ts # Notifications de messages
│   ├── useUserLocation.ts  # Gestion de la localisation utilisateur
│   ├── useDistanceCalculation.ts # Calcul des distances GPS
│   └── useTaskApplications.ts # Gestion des candidatures
├── contexts/           # Contextes React globaux
│   └── LocationContext.tsx # Contexte de localisation pour la synchronisation
├── lib/                 # Configuration et utilitaires
│   ├── config.ts           # Configuration de l'application
│   └── supabase.ts         # Client Supabase configuré
├── types/               # Types TypeScript
│   └── task.ts             # Interfaces complètes des tâches
└── App.tsx             # Composant principal avec routing
```

## 🔄 Workflow des Tâches

### **Cycle de Vie Complet**
1. **Création** : Utilisateur crée une tâche en 4 étapes avec validation
2. **Publication** : Tâche visible dans le flux avec filtres et recherche
3. **Acceptation** : Aide accepte la tâche → statut "assigned"
4. **Démarrage** : Aide démarre le travail → statut "in_progress"
5. **Finalisation** : Créateur confirme la completion → statut "completed"
6. **Communication** : Chat en temps réel à chaque étape

### **Statuts et Transitions**
- **open** → **assigned** : Acceptation par un aide
- **assigned** → **in_progress** : Démarrage du travail
- **in_progress** → **completed** : Finalisation confirmée
- **open/assigned/in_progress** → **cancelled** : Annulation
- **open** → **expired** : Expiration automatique

## 🎯 Fonctionnalités Avancées

### **Système de Tags et Catégorisation**
- **Tags Prédéfinis** : Suggestions intelligentes lors de la création
- **Filtrage par Tags** : Recherche logique OR sur les tags
- **Catégories** : 10 catégories principales avec icônes
- **Métadonnées** : Système extensible pour futures fonctionnalités

### **Gestion des Photos et Documents**
- **Upload Multiple** : Support de plusieurs photos par tâche
- **Aperçu** : Visualisation immédiate des images
- **Suppression** : Gestion des photos avec confirmation
- **Pièces Jointes** : Support des documents PDF et autres formats

### **Recherche et Filtrage Géographique**
- **Recherche par Ville** : Filtrage par nom de ville
- **Recherche par Code Postal** : Filtrage par zone géographique
- **Rayon de Recherche** : Filtrage par distance (1km à 50km)
- **Tri par Proximité** : Ordre des résultats par distance

### **Système de Localisation Avancé**
- **Indicateur de Position dans le Header** : Affichage en temps réel de la localisation
- **Calcul de Distances GPS Précises** : Algorithme Haversine pour des distances exactes
- **Gestion des États de Localisation** : Chargement, erreur, et position définie
- **Actualisation de Position** : Bouton de rafraîchissement pour mettre à jour la localisation
- **Synchronisation Globale** : Context React pour la mise à jour de la localisation dans toute l'application
- **Affichage Responsive** : Adaptation automatique selon la taille d'écran

## 📊 Métriques et Analytics

### **Statistiques des Tâches**
- **Compteurs** : Vues, candidatures, acceptations
- **Répartition** : Par statut, priorité, catégorie
- **Budgets** : Total, moyenne, tendances
- **Performance** : Temps de completion, taux de réussite

### **Analytics Utilisateur**
- **Activité** : Tâches créées, acceptées, terminées
- **Engagement** : Temps passé, interactions
- **Réputation** : Notes, avis, historique

### **Métriques de Localisation**
- **Précision GPS** : Qualité des coordonnées utilisateur
- **Distances Calculées** : Statistiques des distances entre utilisateurs et tâches
- **Couverture Géographique** : Répartition des tâches par zone géographique

## 🚧 Prochaines Étapes

### **Fonctionnalités Planifiées**
- [ ] **Système de Paiement** : Intégration Stripe avec escrow
- [ ] **Évaluations et Avis** : Système de notation des utilisateurs
- [ ] **Notifications Push** : Alertes en temps réel sur mobile
- [ ] **Mode Hors Ligne** : Support PWA avec cache
- [ ] **API Mobile** : Endpoints REST pour applications natives

### **Améliorations Techniques**
- [ ] **Tests Automatisés** : Jest et React Testing Library
- [ ] **CI/CD Pipeline** : Déploiement automatique
- [ ] **Monitoring** : Logs et métriques de performance
- [ ] **Cache Redis** : Optimisation des requêtes fréquentes
- [ ] **Service Worker** : Cache avancé et offline

## 🤝 Contribution

### **Comment Contribuer**
1. Fork du repository
2. Créer une branche de fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Implémenter les changements avec tests
4. Commiter avec des messages clairs (`git commit -m 'feat: ajoute nouvelle fonctionnalité'`)
5. Pousser vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
6. Créer une Pull Request avec description détaillée

### **Standards de Code**
- **TypeScript** : Typage strict obligatoire
- **ESLint** : Respect des règles de linting
- **Prettier** : Formatage automatique du code
- **Tests** : Couverture de tests pour les nouvelles fonctionnalités
- **Documentation** : Commentaires clairs et README à jour

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support et Documentation

### **Ressources Disponibles**
- **README Principal** : Ce fichier avec vue d'ensemble
- **NEXT_STEPS.md** : Guide des prochaines étapes et améliorations
- **PROJECT_ANALYSIS_SUMMARY.md** : Analyse détaillée de l'état du projet
- **Commentaires de Code** : Documentation inline dans le code source

### **Obtenir de l'Aide**
- **Issues GitHub** : Signalez les bugs et demandez des fonctionnalités
- **Discussions GitHub** : Questions et suggestions dans les discussions
- **Documentation Supabase** : Référence pour le backend
- **Code Source** : Exemples d'utilisation dans les composants

## 🎉 Conclusion

MicroTask est une plateforme moderne et complète qui révolutionne la gestion des micro-tâches locales. Avec son architecture robuste, son interface utilisateur intuitive et ses fonctionnalités avancées, elle offre une expérience comparable aux meilleures applications du marché.

**Fonctionnalités Clés :**
✅ **Interface mobile-first** avec animations fluides  
✅ **Gestion complète des tâches** avec workflow avancé  
✅ **Chat en temps réel** pour la communication  
✅ **Cartes interactives** avec géolocalisation précise  
✅ **Recherche et filtrage** puissants et intuitifs  
✅ **Tableau de bord** avec analytics détaillés  
✅ **Architecture modulaire** et extensible  
✅ **Sécurité renforcée** avec Supabase et RLS  
✅ **Logo personnalisé** avec composant dédié  
✅ **Navigation adaptative** mobile/desktop  
✅ **Système de localisation avancé** avec affichage dans le header  
✅ **Calcul de distances GPS précis** avec algorithme Haversine  
✅ **Synchronisation globale** de la localisation via Context React  

**Prêt à révolutionner la gestion des micro-tâches ! 🚀✨**

---

*Développé avec ❤️ en React, TypeScript et Supabase*