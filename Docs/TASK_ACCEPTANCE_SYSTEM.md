# 🚀 Système d'Acceptation des Tâches - MicroTask

## 📋 Vue d'ensemble

Le système d'acceptation des tâches a été complètement refactorisé pour offrir un workflow professionnel et sécurisé. Au lieu d'une acceptation directe, les utilisateurs postulent maintenant pour les tâches, et les propriétaires peuvent choisir parmi plusieurs candidats.

## 🔄 Nouveau Workflow

### **Ancien Système (Simple)**
```
Tâche ouverte → Aide accepte directement → Tâche assignée
```

### **Nouveau Système (Professionnel)**
```
Tâche ouverte → Aides candidatent → Propriétaire choisit → Validation → Démarrage
```

## 🏗️ Architecture Technique

### **1. Nouvelle Table : `task_applications`**
```sql
CREATE TABLE task_applications (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  helper_id UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  message TEXT, -- Message de motivation
  proposed_budget NUMERIC(10,2), -- Budget proposé
  proposed_duration INTERVAL, -- Durée proposée
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ
);
```

### **2. Nouveaux Statuts de Tâches**
- **`open`** : Tâche ouverte aux candidatures
- **`pending_approval`** : Candidature acceptée, en attente de validation
- **`assigned`** : Tâche assignée (maintenu pour compatibilité)
- **`in_progress`** : Tâche en cours
- **`completed`** : Tâche terminée
- **`cancelled`** : Tâche annulée
- **`expired`** : Tâche expirée

### **3. Fonctions PostgreSQL**
- **`accept_application(application_id)`** : Accepter une candidature
- **`approve_task_start(task_id)`** : Valider le démarrage
- **`reject_task_start(task_id)`** : Rejeter et remettre en open
- **`count_active_applications(task_id)`** : Compter les candidatures actives

## 🎯 Fonctionnalités Implémentées

### **✅ Pour les Aides (Helpers)**
- **Candidature** : Postuler avec message de motivation
- **Propositions** : Budget et durée personnalisés
- **Suivi** : Voir le statut de sa candidature
- **Retrait** : Retirer sa candidature si nécessaire

### **✅ Pour les Propriétaires (Authors)**
- **Gestion des candidatures** : Voir toutes les candidatures
- **Sélection** : Choisir le meilleur candidat
- **Validation** : Approuver le démarrage de la tâche
- **Rejet** : Refuser et remettre en open si nécessaire

### **✅ Interface Utilisateur**
- **Composant TaskApplications** : Gestion complète des candidatures
- **Composant TaskHistory** : Historique détaillé des tâches
- **Filtres avancés** : Recherche et tri des candidatures
- **Notifications** : Feedback en temps réel

## 🚀 Utilisation

### **1. Candidater à une Tâche**

#### **Étape 1 : Voir la Tâche**
- Naviguer vers une tâche ouverte
- Cliquer sur le bouton "Candidater"

#### **Étape 2 : Remplir le Formulaire**
```typescript
interface ApplicationFormData {
  message: string           // Message de motivation obligatoire
  proposed_budget?: number  // Budget proposé (optionnel)
  proposed_duration?: string // Durée proposée (optionnel)
}
```

#### **Étape 3 : Envoi**
- Validation automatique des données
- Création de la candidature en base
- Notification de succès

### **2. Gérer les Candidatures (Propriétaire)**

#### **Étape 1 : Voir les Candidatures**
- Accéder à la page des candidatures de sa tâche
- Voir toutes les candidatures avec statuts

#### **Étape 2 : Évaluer les Candidats**
- **Profil** : Nom, avatar, note, expérience
- **Message** : Motivation et approche
- **Propositions** : Budget et durée personnalisés
- **Historique** : Tâches précédentes

#### **Étape 3 : Accepter une Candidature**
- Cliquer sur "Accepter"
- Confirmation avec modal
- Statut de la tâche → `pending_approval`
- Autres candidatures automatiquement rejetées

### **3. Valider le Démarrage**

#### **Étape 1 : Vérification**
- Tâche en statut `pending_approval`
- Candidature acceptée
- Aide assigné

#### **Étape 2 : Validation**
- Cliquer sur "Valider le démarrage"
- Statut de la tâche → `in_progress`
- Timestamp `started_at` mis à jour

#### **Étape 3 : Alternative - Rejet**
- Cliquer sur "Rejeter"
- Tâche remise en statut `open`
- Aide désassigné
- Possibilité de nouvelles candidatures

## 📱 Composants React

### **TaskApplications.tsx**
```typescript
interface TaskApplicationsProps {
  taskId: string
  taskTitle: string
  taskStatus: string
  isAuthor: boolean
  onStatusChange?: () => void
}
```

**Fonctionnalités :**
- Affichage des candidatures
- Formulaire de candidature
- Gestion des statuts
- Actions (accepter, rejeter, retirer)

### **TaskHistory.tsx**
```typescript
interface TaskHistoryProps {
  onTaskPress?: (task: TaskHistoryItem) => void
  showApplications?: boolean
}
```

**Fonctionnalités :**
- Historique complet des tâches
- Filtres avancés (statut, catégorie, date)
- Statistiques détaillées
- Navigation vers les détails

## 🔧 Hooks Personnalisés

### **useTaskApplications**
```typescript
const {
  applications,           // Liste des candidatures
  loading,               // État de chargement
  error,                 // Erreurs éventuelles
  createApplication,     // Créer une candidature
  acceptApplication,     // Accepter une candidature
  rejectApplication,     // Rejeter une candidature
  withdrawApplication,   // Retirer sa candidature
  approveTaskStart,      // Valider le démarrage
  rejectTaskStart,       // Rejeter le démarrage
  updateFilters,         // Mettre à jour les filtres
  resetFilters           // Réinitialiser les filtres
} = useTaskApplications(taskId)
```

## 🗄️ Base de Données

### **Vues Créées**

#### **task_applications_with_profiles**
```sql
SELECT 
  ta.*,
  t.title as task_title,
  t.status as task_status,
  p.name as helper_name,
  p.avatar_url as helper_avatar,
  p.rating as helper_rating
FROM task_applications ta
JOIN tasks t ON ta.task_id = t.id
JOIN profiles p ON ta.helper_id = p.id
```

#### **task_history**
```sql
SELECT 
  t.*,
  p.name as author_name,
  helper_p.name as helper_name,
  COUNT(ta.id) as total_applications,
  COUNT(CASE WHEN ta.status = 'accepted' THEN 1 END) as accepted_applications
FROM tasks t
LEFT JOIN profiles p ON t.author = p.id
LEFT JOIN profiles helper_p ON t.helper = helper_p.id
LEFT JOIN task_applications ta ON t.id = ta.task_id
GROUP BY t.id, p.name, helper_p.name
```

### **Politiques RLS (Row Level Security)**

#### **Lecture des Candidatures**
- **Auteur de la tâche** : Voir toutes les candidatures
- **Candidats** : Voir leurs propres candidatures
- **Autres utilisateurs** : Pas d'accès

#### **Création de Candidatures**
- **Utilisateur authentifié** : Peut candidater
- **Auteur de la tâche** : Ne peut pas candidater à sa propre tâche
- **Candidature unique** : Un seul candidat par tâche

#### **Gestion des Candidatures**
- **Auteur de la tâche** : Accepter/rejeter
- **Candidat** : Modifier/retirer sa candidature
- **Contraintes** : Statuts autorisés selon le rôle

## 🧪 Tests et Validation

### **Tests Automatiques**
```bash
# Exécuter le fichier de test SQL
# test-task-acceptance-system.sql
```

### **Tests Manuels**
1. **Créer une tâche** avec un compte utilisateur
2. **Candidater** avec un autre compte
3. **Accepter la candidature** avec le premier compte
4. **Valider le démarrage** et vérifier le statut
5. **Tester le rejet** et la remise en open

### **Validation des Fonctionnalités**
- ✅ Candidatures multiples
- ✅ Gestion des statuts
- ✅ Workflow de validation
- ✅ Politiques de sécurité
- ✅ Interface utilisateur
- ✅ Notifications

## 🚨 Gestion des Erreurs

### **Erreurs Courantes**

#### **Candidature Dupliquée**
```sql
-- Contrainte unique sur (task_id, helper_id)
UNIQUE(task_id, helper_id)
```

#### **Statut Invalide**
```sql
-- Vérification des transitions de statut
CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn'))
```

#### **Permissions Insuffisantes**
- Politiques RLS actives
- Vérification des rôles utilisateur
- Logs d'audit des actions

### **Récupération d'Erreur**
- **Rollback automatique** des transactions
- **Messages d'erreur** explicites
- **Interface de retry** pour les actions échouées
- **Logs détaillés** pour le débogage

## 📊 Métriques et Analytics

### **Données Collectées**
- **Nombre de candidatures** par tâche
- **Taux d'acceptation** des candidatures
- **Temps de réponse** des propriétaires
- **Qualité des candidatures** (message, propositions)

### **Tableau de Bord**
- **Statistiques globales** : Total, acceptées, rejetées
- **Performance par catégorie** : Tâches populaires
- **Tendances temporelles** : Évolution des candidatures
- **Utilisateurs actifs** : Top candidats et propriétaires

## 🔮 Évolutions Futures

### **Fonctionnalités Planifiées**
- **Système de notation** des candidatures
- **Notifications push** pour les mises à jour
- **Chat intégré** entre candidat et propriétaire
- **Système de recommandations** basé sur l'historique

### **Améliorations Techniques**
- **Cache Redis** pour les candidatures fréquentes
- **Webhooks** pour les intégrations externes
- **API GraphQL** pour les requêtes complexes
- **Tests automatisés** complets

## 📋 Checklist de Déploiement

### **Base de Données**
- [ ] Migration appliquée sans erreur
- [ ] Table `task_applications` créée
- [ ] Vues créées et fonctionnelles
- [ ] Fonctions PostgreSQL créées
- [ ] Politiques RLS configurées
- [ ] Index créés pour les performances

### **Frontend**
- [ ] Composant `TaskApplications` intégré
- [ ] Composant `TaskHistory` intégré
- [ ] Hook `useTaskApplications` fonctionnel
- [ ] Types TypeScript mis à jour
- [ ] Interface utilisateur testée

### **Tests**
- [ ] Tests SQL exécutés
- [ ] Tests manuels effectués
- [ ] Workflow complet validé
- [ ] Gestion d'erreurs testée
- [ ] Performance vérifiée

## 🎉 Conclusion

Le nouveau système d'acceptation des tâches transforme MicroTask en une plateforme professionnelle avec :

✅ **Workflow sécurisé** : Candidatures → Sélection → Validation  
✅ **Gestion des candidatures** : Messages, propositions, statuts  
✅ **Interface utilisateur** : Composants React modernes et intuitifs  
✅ **Base de données** : Architecture robuste avec vues et fonctions  
✅ **Sécurité** : Politiques RLS et validation des données  
✅ **Performance** : Index optimisés et requêtes efficaces  

**Le système est maintenant prêt pour la production ! 🚀**

---

*Document créé le 27 août 2025 - Système d'Acceptation des Tâches MicroTask*
