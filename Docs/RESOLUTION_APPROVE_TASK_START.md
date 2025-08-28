# Résolution du problème avec la fonction `approve_task_start`

## Problème identifié

L'erreur indique que la fonction `public.approve_task_start` n'est pas trouvée dans la base de données :

```
code: "PGRST202"
message: "Could not find the function public.approve_task_start(task_id) in the schema cache"
```

## Cause du problème

Il y a une incohérence entre :
1. **Le code TypeScript** qui appelle la fonction avec `{ task_id: taskIdParam }`
2. **Les migrations SQL** qui définissent la fonction avec le paramètre `task_id UUID`
3. **Les scripts de correction** qui utilisent parfois `task_id_param UUID`

## Solutions

### Solution 1 : Appliquer le script de correction (Recommandée)

Exécutez le script `fix_approve_task_start.sql` dans votre base de données Supabase :

1. Allez dans votre dashboard Supabase
2. Ouvrez l'éditeur SQL
3. Copiez et collez le contenu de `fix_approve_task_start.sql`
4. Exécutez le script

### Solution 2 : Vérifier l'état actuel

Exécutez d'abord le script de diagnostic `test_current_functions.sql` pour voir l'état actuel :

1. Copiez le contenu de `test_current_functions.sql`
2. Exécutez-le dans l'éditeur SQL de Supabase
3. Vérifiez les résultats

### Solution 3 : Appliquer les migrations manquantes

Si les migrations n'ont pas été appliquées :

1. Vérifiez que la migration `20250827091500_task_acceptance_system.sql` a été appliquée
2. Si non, appliquez-la manuellement

## Vérification

Après avoir appliqué la correction, testez avec :

```sql
-- Vérifier que la fonction existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'approve_task_start';

-- Vérifier la signature
SELECT 
  r.routine_name,
  p.parameter_name,
  p.data_type
FROM information_schema.routines r
JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_name = 'approve_task_start';
```

## Structure attendue

La fonction devrait avoir cette signature :

```sql
CREATE OR REPLACE FUNCTION approve_task_start(task_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tasks 
  SET status = 'in_progress', started_at = NOW()
  WHERE id = task_id AND status = 'pending_approval';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
```

## Permissions requises

Assurez-vous que les permissions sont correctes :

```sql
GRANT EXECUTE ON FUNCTION approve_task_start(UUID) TO authenticated;
```

## Test de la fonction

Une fois la fonction créée, testez-la avec :

```sql
-- Simuler l'appel depuis le code TypeScript
SELECT approve_task_start('uuid-de-test');
```

## Prochaines étapes

1. Appliquez le script de correction
2. Testez la fonction
3. Redémarrez votre application
4. Testez le bouton d'approbation dans l'interface

## Fichiers de correction

- `fix_approve_task_start.sql` - Script principal de correction
- `test_current_functions.sql` - Script de diagnostic
- `RESOLUTION_APPROVE_TASK_START.md` - Ce guide
