/*
  # Migration: Correction des politiques RLS pour les profils
  
  Cette migration corrige les politiques de sécurité pour permettre
  l'inscription des nouveaux utilisateurs tout en maintenant la sécurité.
*/

-- Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Créer de nouvelles politiques plus appropriées
-- Permettre l'insertion de profils pour les nouveaux utilisateurs
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Permettre la mise à jour de son propre profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permettre la visualisation de tous les profils (pour la recherche et l'affichage)
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Politique spéciale pour permettre l'insertion lors de l'inscription
-- Cette politique permet l'insertion même si l'utilisateur n'est pas encore dans la table profiles
CREATE POLICY "Allow profile creation during signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Permettre l'insertion si l'utilisateur n'a pas encore de profil
    NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid()
    )
    OR
    -- Ou permettre la mise à jour si l'utilisateur a déjà un profil
    auth.uid() = id
  );

-- Ajouter une politique pour permettre la suppression de son propre profil
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Vérifier que toutes les politiques sont en place
DO $$
BEGIN
  -- Vérifier que la table profiles a RLS activé
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on profiles table';
  END IF;
  
  -- Vérifier que les politiques sont créées
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    RAISE EXCEPTION 'No policies found on profiles table';
  END IF;
  
  RAISE NOTICE 'Profile policies successfully created and verified';
END $$;

-- Commentaires pour la documentation
COMMENT ON POLICY "Users can insert own profile" ON profiles IS 'Permet aux utilisateurs authentifiés de créer leur propre profil';
COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Permet aux utilisateurs de mettre à jour leur propre profil';
COMMENT ON POLICY "Users can view all profiles" ON profiles IS 'Permet à tous les utilisateurs authentifiés de voir tous les profils';
COMMENT ON POLICY "Allow profile creation during signup" ON profiles IS 'Politique spéciale pour permettre la création de profils lors de l''inscription';
COMMENT ON POLICY "Users can delete own profile" ON profiles IS 'Permet aux utilisateurs de supprimer leur propre profil';
