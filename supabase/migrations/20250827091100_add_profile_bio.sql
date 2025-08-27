/*
  # Migration: Ajout du champ bio aux profils
  
  Cette migration ajoute un champ bio à la table profiles pour permettre
  aux utilisateurs de décrire leur profil et leurs compétences.
*/

-- Ajouter le champ bio à la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Ajouter un commentaire pour la documentation
COMMENT ON COLUMN profiles.bio IS 'Description personnelle et compétences de l''utilisateur';

-- Mettre à jour les types TypeScript si nécessaire
-- Le champ bio sera automatiquement inclus dans les types générés
