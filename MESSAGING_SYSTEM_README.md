# 🚀 Système de Messagerie Complet - MicroTask

## 📋 Vue d'ensemble

Ce document décrit l'implémentation complète du système de messagerie en temps réel pour l'application MicroTask. Le système permet aux utilisateurs de communiquer en temps réel lors de l'exécution de tâches, avec des fonctionnalités avancées comme les indicateurs de frappe, les notifications push et la gestion des pièces jointes.

## ✨ Fonctionnalités Principales

### 🔄 Messagerie en Temps Réel
- **Envoi/réception instantanée** de messages
- **Indicateurs de frappe** en temps réel
- **Synchronisation automatique** via Supabase Realtime
- **Historique complet** des conversations

### 📱 Interface Utilisateur Moderne
- **Design responsive** et adaptatif
- **Animations fluides** avec Framer Motion
- **Indicateurs visuels** de statut des messages
- **Gestion des pièces jointes** (images et fichiers)

### 🔔 Système de Notifications
- **Notifications push** en temps réel
- **Compteurs de messages non lus**
- **Panneau de notifications** intégré
- **Historique des mises à jour** de tâches

### 🛡️ Sécurité et Performance
- **Politiques RLS** (Row Level Security)
- **Index optimisés** pour les requêtes
- **Gestion des permissions** utilisateur
- **Nettoyage automatique** des données temporaires

## 🏗️ Architecture Technique

### Composants Frontend

#### 1. **ChatView.tsx** - Interface de Chat Principal
```typescript
// Fonctionnalités principales
- Affichage des messages en temps réel
- Envoi de messages avec validation
- Gestion des pièces jointes
- Indicateurs de frappe
- Scroll automatique vers le bas
```

#### 2. **Messages.tsx** - Liste des Conversations
```typescript
// Fonctionnalités principales
- Vue d'ensemble des conversations
- Filtrage et recherche
- Compteurs de messages non lus
- Navigation vers les chats
```

#### 3. **NotificationToast.tsx** - Système de Notifications
```typescript
// Fonctionnalités principales
- Bouton de notification flottant
- Panneau de notifications avec onglets
- Gestion des messages et mises à jour
- Actions rapides (marquer comme lu, effacer)
```

#### 4. **useRealtimeSync.ts** - Hook de Synchronisation
```typescript
// Fonctionnalités principales
- Écoute des nouveaux messages
- Gestion des mises à jour de tâches
- Notifications automatiques
- Gestion de la connexion
```

### Base de Données

#### Tables Principales
- **`messages`** - Stockage des messages
- **`typing_indicators`** - Indicateurs de frappe
- **`chat_visits`** - Historique des visites
- **`message_notifications`** - Notifications de messages

#### Fonctions SQL
- **`get_unread_message_count()`** - Compte les messages non lus
- **`mark_messages_as_read()`** - Marque les messages comme lus
- **`get_user_conversations()`** - Récupère les conversations utilisateur
- **`cleanup_typing_indicators()`** - Nettoie les indicateurs obsolètes
- **`auto_cleanup_typing_indicators()`** - Trigger automatique de nettoyage

#### Vues Utiles
- **`task_conversation_summary`** - Résumé des conversations par tâche
- **`user_messaging_stats`** - Statistiques de messagerie par utilisateur

## 🚀 Installation et Configuration

### 1. Dépendances Requises
```bash
npm install framer-motion lucide-react
```

### 2. Configuration Supabase
```bash
# Exécuter les migrations dans l'ordre
supabase db reset
# ou exécuter manuellement :
# 1. 20250827090530_nameless_meadow.sql
# 2. 20250827090600_add_task_fields.sql
# 3. 20250827090700_add_task_policies.sql
# 4. 20250827090800_remove_available_hours.sql
# 5. 20250827090900_enhance_messaging_system.sql
# 6. 20250827091000_fix_profile_policies.sql
# 7. 20250827091100_add_profile_bio.sql
```

### 3. Variables d'Environnement
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anonyme
```

### 4. Configuration des Extensions
```sql
-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**Note importante** : Cette migration n'utilise plus `pg_cron` qui n'est pas disponible par défaut dans Supabase. Le nettoyage des indicateurs de frappe se fait automatiquement via des triggers PostgreSQL.

## 📱 Utilisation

### Navigation dans l'Application
1. **Accéder aux messages** via l'onglet "Messages" dans la navigation
2. **Ouvrir une conversation** en cliquant sur une tâche
3. **Envoyer des messages** dans l'interface de chat
4. **Gérer les notifications** via le bouton flottant

### Fonctionnalités Utilisateur
- **Envoi de messages** : Tapez et appuyez sur Entrée ou cliquez sur Envoyer
- **Pièces jointes** : Cliquez sur l'icône trombone pour ajouter des fichiers
- **Indicateurs de frappe** : Visible en temps réel pour les autres utilisateurs
- **Notifications** : Reçues automatiquement pour les nouveaux messages

## 🔧 Développement et Personnalisation

### Dépannage des Erreurs Courantes

#### 1. Erreur RLS (Row Level Security)
```bash
# Erreur: "new row violates row-level security policy for table 'profiles'"
# Solution: Exécuter la migration 20250827091000_fix_profile_policies.sql
supabase db reset
# ou exécuter manuellement la migration de correction
```

#### 2. Erreur de Fonction d'Agrégation
```sql
-- Erreur: "aggregate function calls cannot contain window function calls"
-- Solution: Utiliser des fonctions séparées pour les calculs complexes
SELECT get_user_avg_response_time(user_id) FROM profiles;
```

#### 3. Erreur d'Extension Manquante
```sql
-- Erreur: "schema 'cron' does not exist"
-- Solution: Utiliser des triggers PostgreSQL au lieu de pg_cron
-- Les indicateurs de frappe sont nettoyés automatiquement via triggers
```

### Ajout de Nouvelles Fonctionnalités

#### 1. Nouveaux Types de Messages
```typescript
// Dans types/task.ts
export interface TaskMessage {
  id: string
  task_id: string
  sender: string
  content: string
  message_type: 'text' | 'image' | 'file' | 'system'
  attachments?: any[]
  created_at: string
}
```

#### 2. Nouveaux Composants
```typescript
// Créer un nouveau composant
export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  // Logique du composant
}
```

#### 3. Nouvelles Tables
```sql
-- Exemple d'ajout de table
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tests et Débogage

#### 1. Test des Notifications
```typescript
// Dans le composant de test
const { requestNotificationPermission } = useRealtimeSync()

useEffect(() => {
  requestNotificationPermission()
}, [])
```

#### 2. Test de la Synchronisation
```typescript
// Vérifier la connexion
const { isConnected } = useRealtimeSync()

console.log('Connexion temps réel:', isConnected)
```

#### 3. Débogage des Messages
```typescript
// Activer les logs détaillés
const debugMode = true

if (debugMode) {
  console.log('Nouveau message reçu:', payload)
}
```

## 📊 Performance et Optimisation

### Optimisations Implémentées
- **Index de base de données** pour les requêtes fréquentes
- **Pagination des messages** pour les conversations longues
- **Nettoyage automatique** des indicateurs de frappe via triggers
- **Mise en cache** des profils utilisateur

### Monitoring et Métriques
```sql
-- Vérifier les performances
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE tablename IN ('messages', 'typing_indicators', 'chat_visits');

-- Vérifier le nettoyage automatique
SELECT COUNT(*) as active_typing_indicators FROM typing_indicators;
```

### Optimisations Futures
- **Compression des messages** pour réduire la bande passante
- **Mise en cache Redis** pour les données fréquemment accédées
- **WebSocket personnalisé** pour une latence ultra-faible
- **Chiffrement de bout en bout** des messages

## 🛡️ Sécurité

### Politiques de Sécurité
- **RLS activé** sur toutes les tables sensibles
- **Validation des permissions** utilisateur
- **Filtrage des données** par utilisateur
- **Protection contre l'injection SQL**

### Bonnes Pratiques
- **Validation côté client ET serveur**
- **Sanitisation des messages** avant stockage
- **Limitation de la taille** des pièces jointes
- **Rate limiting** pour l'envoi de messages

## 🔮 Roadmap et Évolutions

### Fonctionnalités Prévues
- [ ] **Messages vocaux** et reconnaissance vocale
- [ ] **Réactions aux messages** (like, love, etc.)
- [ ] **Messages éphémères** avec auto-destruction
- [ ] **Chat de groupe** pour les tâches complexes
- [ ] **Intégration Slack/Discord** pour les notifications

### Améliorations Techniques
- [ ] **Migration vers WebRTC** pour la communication peer-to-peer
- [ ] **Système de plugins** pour étendre les fonctionnalités
- [ ] **API GraphQL** pour des requêtes plus flexibles
- [ ] **Tests automatisés** complets
- [ ] **Documentation API** interactive

## 📚 Ressources et Références

### Documentation Officielle
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Framer Motion](https://www.framer.com/motion/)
- [React Hooks](https://reactjs.org/docs/hooks-intro.html)

### Outils de Développement
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [TypeScript](https://www.typescriptlang.org/docs/)

### Communauté et Support
- [Forum Supabase](https://github.com/supabase/supabase/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)
- [Discord React](https://discord.gg/reactiflux)

## 🤝 Contribution

### Comment Contribuer
1. **Fork le projet**
2. **Créer une branche** pour votre fonctionnalité
3. **Implémenter les changements** avec tests
4. **Soumettre une pull request**

### Standards de Code
- **TypeScript strict** pour tous les composants
- **ESLint + Prettier** pour la cohérence
- **Tests unitaires** pour les fonctions critiques
- **Documentation JSDoc** pour les composants

### Tests Requis
```bash
# Exécuter les tests
npm test

# Tests de couverture
npm run test:coverage

# Tests E2E
npm run test:e2e
```

---

## 📞 Support et Contact

Pour toute question ou problème avec le système de messagerie :

- **Issues GitHub** : [Créer une issue](https://github.com/votre-repo/issues)
- **Email** : support@microtask-app.com
- **Documentation** : [docs.microtask-app.com](https://docs.microtask-app.com)

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024  
**Maintenu par** : Équipe MicroTask
