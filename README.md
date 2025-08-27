# MicroTask - Plateforme Locale de Délégation de Tâches

Une application web React mobile-first pour déléguer et compléter des micro-tâches locales avec un traitement de paiement sécurisé.

## Fonctionnalités

- **Authentification Utilisateur** : Authentification sécurisée email/mot de passe avec Supabase
- **Gestion des Tâches** : Créer, parcourir et gérer des tâches avec filtrage géospatial
- **Chat en Temps Réel** : Messagerie directe entre créateurs de tâches et aides
- **Paiements Sécurisés** : Intégration Stripe avec système d'escrow
- **Design Mobile-First** : Interface responsive avec navigation par onglets en bas
- **Services de Localisation** : Cartes interactives avec filtrage des tâches basé sur la proximité
- **Système d'Évaluation** : Notes et avis utilisateurs pour construire la réputation

## Stack Technologique

- **Frontend** : React 18, TypeScript, Tailwind CSS, Vite
- **Backend** : Supabase (PostgreSQL avec PostGIS)
- **Paiements** : Stripe Checkout avec webhooks
- **Cartes** : Leaflet avec OpenStreetMap
- **Temps Réel** : Abonnements Supabase
- **Authentification** : Supabase Auth

## Pour Commencer

### Prérequis

- Node.js 18+
- Compte Supabase
- Compte Stripe

### Installation

1. Cloner le repository
```bash
git clone <url-du-repository>
cd microtask
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
```

Remplissez vos identifiants Supabase et Stripe dans le fichier `.env`.

### Configuration de la Base de Données

1. Créer un nouveau projet Supabase
2. Cliquer sur "Connect to Supabase" en haut à droite de l'interface Bolt
3. Le schéma de base de données sera automatiquement créé

### Développement

Démarrer le serveur de développement :
```bash
npm run dev
```

L'application sera disponible à `http://localhost:5173`

## Structure du Projet

```
src/
├── components/          # Composants React
│   ├── AuthForm.tsx        # Formulaire d'authentification
│   ├── BottomNavigation.tsx # Navigation par onglets en bas
│   ├── TaskCard.tsx        # Composant d'affichage des tâches
│   ├── TaskFeed.tsx        # Flux de parcours des tâches
│   ├── TaskMap.tsx         # Composant de carte interactive
│   ├── CreateTask.tsx      # Formulaire de création de tâche
│   ├── LocationPicker.tsx  # Sélecteur d'emplacement basé sur la carte
│   ├── MyTasks.tsx         # Gestion des tâches de l'utilisateur
│   ├── Messages.tsx        # Liste des conversations de chat
│   └── Profile.tsx         # Gestion du profil utilisateur
├── hooks/               # Hooks React
│   └── useAuth.ts          # Hook d'authentification
├── lib/                 # Utilitaires et configuration
│   └── supabase.ts         # Configuration du client Supabase
└── App.tsx             # Composant principal de l'application
```

## Implémentation des Fonctionnalités Clés

### Création et Gestion des Tâches
- Formulaire adapté mobile avec sélecteur d'emplacement basé sur la carte
- Support des pièces jointes photo
- Organisation par catégories
- Définition du budget avec devise EUR
- Planification des échéances

### Fonctionnalités Géospatiales
- Intégration PostGIS pour les requêtes basées sur la localisation
- Carte interactive avec marqueurs de tâches
- Filtrage de proximité (options de rayon 1km, 5km)
- Géocodage d'adresse et géocodage inverse

### Système de Paiement
- Intégration sécurisée Stripe Checkout
- Système d'escrow (fonds retenus jusqu'à la finalisation)
- Commission plateforme de 15%
- Gestion des webhooks pour les confirmations de paiement

### Fonctionnalités Temps Réel
- Messagerie en direct entre utilisateurs
- Mises à jour de statut des tâches
- Notifications en temps réel

### Sécurité
- Politiques Row Level Security (RLS)
- Points de terminaison API sécurisés
- Validation et assainissement des entrées
- Contrôle d'accès basé sur l'authentification

## Schéma de Base de Données

L'application utilise PostgreSQL avec l'extension PostGIS pour les fonctionnalités géospatiales :

- `profiles` - Profils utilisateurs étendant l'authentification Supabase
- `tasks` - Publications de tâches avec données de localisation
- `messages` - Messages de chat en temps réel
- `reviews` - Avis et notes utilisateurs

## Design Mobile-First

- Cibles tactiles de 44px minimum conviviales
- Navigation par onglets en bas pour un accès facile au pouce
- Design responsive pour mobile, tablette et desktop
- Optimisé pour les navigateurs web iOS et Android
- Architecture prête PWA

## Déploiement

L'application peut être déployée sur n'importe quel fournisseur d'hébergement statique :

1. Construire l'application :
```bash
npm run build
```

2. Déployer le dossier `dist` sur votre fournisseur d'hébergement

Assurez-vous de configurer vos variables d'environnement sur votre plateforme d'hébergement.

## Contribution

1. Fork du repository
2. Créer une branche de fonctionnalité
3. Effectuer vos modifications
4. Ajouter des tests si applicable
5. Soumettre une pull request

## Licence

Ce projet est sous licence MIT.