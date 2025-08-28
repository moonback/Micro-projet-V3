/*
  # Migration: Ajout de la géolocalisation aux profils utilisateurs
  
  Cette migration ajoute les champs de localisation à la table profiles
  pour permettre à chaque utilisateur d'être localisé.
*/

-- Ajout des champs de localisation à la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS location geometry(Point, 4326),
ADD COLUMN IF NOT EXISTS latitude numeric(10,8),
ADD COLUMN IF NOT EXISTS longitude numeric(11,8),
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'France',
ADD COLUMN IF NOT EXISTS location_updated_at timestamptz DEFAULT now();

-- Index géospatial pour les requêtes de proximité
CREATE INDEX IF NOT EXISTS profiles_location_idx ON profiles USING GIST (location);
CREATE INDEX IF NOT EXISTS profiles_city_idx ON profiles (city);
CREATE INDEX IF NOT EXISTS profiles_postal_code_idx ON profiles (postal_code);

-- Fonction pour mettre à jour automatiquement les coordonnées séparées
CREATE OR REPLACE FUNCTION update_profile_coordinates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location IS NOT NULL THEN
    NEW.latitude = ST_Y(NEW.location::geometry);
    NEW.longitude = ST_X(NEW.location::geometry);
    NEW.location_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement les coordonnées
DROP TRIGGER IF EXISTS update_profile_coordinates_trigger ON profiles;
CREATE TRIGGER update_profile_coordinates_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_coordinates();

-- Fonction pour calculer la distance entre deux points (en km)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 numeric, lon1 numeric, 
  lat2 numeric, lon2 numeric
) RETURNS numeric AS $$
BEGIN
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * 
      cos(radians(lon2) - radians(lon1)) + 
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour trouver les utilisateurs dans un rayon donné
CREATE OR REPLACE FUNCTION find_users_in_radius(
  center_lat numeric, 
  center_lon numeric, 
  radius_km numeric
) RETURNS TABLE(
  id uuid,
  name text,
  distance_km numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    calculate_distance(center_lat, center_lon, p.latitude, p.longitude) as distance_km
  FROM profiles p
  WHERE p.location IS NOT NULL
    AND calculate_distance(center_lat, center_lon, p.latitude, p.longitude) <= radius_km
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;
