-- 🔧 Correction des Politiques RLS pour la Table Profiles
-- Exécutez ce script dans votre dashboard Supabase SQL Editor

-- 1. Vérifier l'état actuel des politiques
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- 3. Activer RLS sur la table profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Créer une politique pour permettre la lecture de son propre profil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 5. Créer une politique pour permettre la mise à jour de son propre profil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- 6. Créer une politique pour permettre l'insertion de profils (nécessaire pour l'inscription)
CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 7. Créer une politique pour permettre la lecture de tous les profils (optionnel)
CREATE POLICY "Enable read access for authenticated users" ON profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 8. Vérifier que les politiques sont créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 9. Test de connexion (optionnel)
-- Cette requête devrait fonctionner pour un utilisateur connecté
-- SELECT * FROM profiles WHERE id = auth.uid();
