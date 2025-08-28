-- Insertion de tâches fictives pour MicroTask
-- UUID de l'utilisateur: 7d13f0e1-b7af-488f-ae05-4cbf717e3b80

-- 1. Tâches de Livraison
INSERT INTO tasks (id, title, description, category, tags, priority, budget, currency, estimated_duration, deadline, location, latitude, longitude, address, city, postal_code, country, author, status, is_urgent, is_featured, payment_status, created_at) VALUES
(
  gen_random_uuid(),
  'Livraison de courses depuis Carrefour',
  'Besoin d''aide pour récupérer des courses au Carrefour de la place de la République. Liste de 15 articles environ, principalement des produits frais et d''épicerie. Urgent pour ce soir.',
  'Livraison',
  ARRAY['courses', 'urgent', 'carrefour'],
  'urgent',
  25.00,
  'EUR',
  INTERVAL '1 hour',
  (NOW() + INTERVAL '6 hours'),
  ST_GeomFromText('POINT(2.3522 48.8566)', 4326),
  48.8566,
  2.3522,
  'Place de la République, 75011 Paris',
  'Paris',
  '75011',
  'France',
  '7d13f0e1-b7af-488f-ae05-4cbf717e3b80',
  'open',
  true,
  false,
  'pending',
  NOW()
),
(
  gen_random_uuid(),
  'Transport de meubles d''occasion',
  'Achat d''une commode et d''un fauteuil sur Leboncoin. Besoin d''aide pour les transporter depuis le 15ème arrondissement vers le 7ème. Véhicule avec hayon nécessaire.',
  'Livraison',
  ARRAY['meubles', 'transport', 'vehicule'],
  'medium',
  45.00,
  'EUR',
  INTERVAL '3 hours',
  (NOW() + INTERVAL '2 days'),
  ST_GeomFromText('POINT(2.3008 48.8566)', 4326),
  48.8566,
  2.3008,
  'Rue de Vaugirard, 75015 Paris',
  'Paris',
  '75015',
  'France',
  '7d13f0e1-b7af-488f-ae05-4cbf717e3b80',
  'open',
  false,
  false,
  'pending',
  NOW()
);

-- 2. Tâches de Nettoyage
INSERT INTO tasks (id, title, description, category, tags, priority, budget, currency, estimated_duration, deadline, location, latitude, longitude, address, city, postal_code, country, author, status, is_urgent, is_featured, payment_status, created_at) VALUES
(
  gen_random_uuid(),
  'Nettoyage complet d''appartement 2 pièces',
  'Appartement de 45m² à nettoyer après déménagement. Sols, cuisine, salle de bain, vitres. Matériel fourni. Durée estimée : 3-4 heures.',
  'Nettoyage',
  ARRAY['nettoyage', 'demenagement', 'appartement'],
  'medium',
  60.00,
  'EUR',
  INTERVAL '4 hours',
  (NOW() + INTERVAL '3 days'),
  ST_GeomFromText('POINT(2.3488 48.8534)', 4326),
  48.8534,
  2.3488,
  'Rue de Rivoli, 75001 Paris',
  'Paris',
  '75001',
  'France',
  '7d13f0e1-b7af-488f-ae05-4cbf717e3b80',
  'open',
  false,
  true,
  'pending',
  NOW()
),
(
  gen_random_uuid(),
  'Nettoyage de vitres et balcons',
  'Nettoyage des vitres extérieures et intérieures + balcons du 3ème étage. Appartement avec vue sur la Seine. Équipement de sécurité fourni.',
  'Nettoyage',
  ARRAY['vitres', 'balcons', 'securite'],
  'low',
  35.00,
  'EUR',
  INTERVAL '2 hours',
  (NOW() + INTERVAL '1 week'),
  ST_GeomFromText('POINT(2.3522 48.8566)', 4326),
  48.8566,
  2.3522,
  'Quai des Célestins, 75004 Paris',
  'Paris',
  '75004',
  'France',
  '7d13f0e1-b7af-488f-ae05-4cbf717e3b80',
  'open',
  false,
  false,
  'pending',
  NOW()
);

-- 3. Tâches de Courses
INSERT INTO tasks (id, title, description, category, tags, priority, budget, currency, estimated_duration, deadline, location, latitude, longitude, address, city, postal_code, country, author, status, is_urgent, is_featured, payment_status, created_at) VALUES
(
  gen_random_uuid(),
  'Courses pour personnes âgées',
  'Aide pour faire les courses de la semaine pour mes parents âgés. Liste détaillée fournie. Besoin de quelqu''un de patient et attentionné.',
  'Courses',
  ARRAY['courses', 'personnes-agees', 'patience'],
  'medium',
  30.00,
  'EUR',
  INTERVAL '2 hours',
  (NOW() + INTERVAL '2 days'),
  ST_GeomFromText('POINT(2.3488 48.8534)', 4326),
  48.8534,
  2.3488,
  'Rue de la Paix, 75002 Paris',
  'Paris',
  '75002',
  'France',
  '7d13f0e1-b7af-488f-ae05-4cbf717e3b80',
  'open',
  false,
  false,
  'pending',
  NOW()
),
(
  gen_random_uuid(),
  'Achat de matériel de bricolage',
  'Besoin d''acheter du matériel de bricolage chez Leroy Merlin : vis, chevilles, perceuse, peinture. Liste précise fournie.',
  'Courses',
  ARRAY['bricolage', 'leroy-merlin', 'materiel'],
  'high',
  20.00,
  'EUR',
  INTERVAL '1 hour',
  (NOW() + INTERVAL '1 day'),
  ST_GeomFromText('POINT(2.3008 48.8566)', 4326),
  48.8566,
  2.3008,
  'Centre commercial Italie 2, 75013 Paris',
  'Paris',
  '75013',
  'France',
  '7d13f0e1-b7af-488f-ae05-4cbf717e3b80',
  'open',
  true,
  false,
  'pending',
  NOW()
);

-- 4. Tâches de Déménagement
INSERT INTO tasks (id, title, description, category, tags, priority, budget, currency, estimated_duration, deadline, location, latitude, longitude, address, city, postal_code, country, author, status, is_urgent, is_featured, payment_status, created_at) VALUES
(
  gen_random_uuid(),
  'Aide au déménagement studio',
  'Déménagement d''un studio de 25m² du 5ème vers le 11ème arrondissement. Meubles légers, quelques cartons. Camion fourni.',
  'Déménagement',
  ARRAY['demenagement', 'studio', 'camion'],
  'medium',
  80.00,
  'EUR',
  INTERVAL '6 hours',
  (NOW() + INTERVAL '1 week'),
  ST_GeomFromText('POINT(2.3488 48.8534)', 4326),
  48.8534,
  2.3488,
  'Rue Mouffetard, 75005 Paris',
  'Paris',
  '75005',
  'France',
  '7d13f0e1-b7af-488f-ae05-4cbf717e3b80',
  'open',
  false,
  false,
  'pending',
  NOW()
);

-- 5. Tâches de Montage
INSERT INTO tasks (id, title, description, category, tags, priority, budget, currency, estimated_duration, deadline, location, latitude, longitude, address, city, postal_code, country, author, status, is_urgent, is_featured, payment_status, created_at) VALUES
(
  gen_random_uuid(),
  'Montage de meubles IKEA',
  'Montage d''une bibliothèque Billy et d''un bureau Micke. Instructions fournies. Outils disponibles sur place.',
  'Montage',
  ARRAY['ikea', 'meubles', 'montage'],
  'medium',
  40.00,
  'EUR',
  INTERVAL '3 hours',
  (NOW() + INTERVAL '4 days'),
  ST_GeomFromText('POINT(2.3522 48.8566)', 4326),
  48.8566,
  2.3522,
  'Rue de la Roquette, 75011 Paris',
  'Paris',
  '75011',
  'France',
  '7d13f0e1-b7af-488f-ae05-4cbf717e3b80',
  'open',
  false,
  false,
  'pending',
  NOW()
),
(
  gen_random_uuid(),
  'Installation d''étagères murales',
  'Pose de 3 étagères murales dans le salon. Murs en placo, chevilles fournies. Niveau à bulle disponible.',
  'Montage',
  ARRAY['etageres', 'murales', 'placo'],
  'low',
  35.00,
  'EUR',
  INTERVAL '2 hours',
  (NOW() + INTERVAL '2 days'),
  ST_GeomFromText('POINT(2.3008 48.8566)', 4326),
  48.8566,
  2.3008,
  'Avenue des Champs-Élysées, 75008 Paris',
  'Paris',
  '75008',
  'France',
  '7d13f0e1-b7af-488f-ae05-4cbf717e3b80',
  'open',
  false,
  false,
  'pending',
  NOW()
);

-- 6. Tâches de Garde d'Animaux
INSERT INTO tasks (id, title, description, category, tags, priority, budget, currency, estimated_duration, deadline, location, latitude, longitude, address, city, postal_code, country, author, status, is_urgent, is_featured, payment_status, created_at) VALUES
(
  gen_random_uuid(),
  'Garde de chat pendant weekend',
  'Garde de mon chat Simba pendant 3 jours. Chat calme, nourriture fournie. Visites 2 fois par jour pour nourrir et câliner.',
  'Garde d''Animaux',
  ARRAY['chat', 'garde', 'weekend'],
  'medium',
  50.00,
  'EUR',
  INTERVAL '1 hour',
  (NOW() + INTERVAL '1 week'),
  ST_GeomFromText('POINT(2.3488 48.8534)', 4326),
  48.8534,
  2.3488,
  'Rue du Faubourg Saint-Honoré, 75008 Paris',
  'Paris',
  '75008',
  'France',
  '7d13f0e1-b7af-488f-ae05-4cbf717e3b80',
  'open',
  false,
  false,
  'pending',
  NOW()
);

-- 7. Tâches de Jardinage
INSERT INTO tasks (id, title, description, category, tags, priority, budget, currency, estimated_duration, deadline, location, latitude, longitude, address, city, postal_code, country, author, status, is_urgent, is_featured, payment_status, created_at) VALUES
(
  gen_random_uuid(),
  'Entretien de plantes d''intérieur',
  'Arrosage et entretien de 15 plantes d''intérieur pendant mes vacances. Guide d''entretien détaillé fourni.',
  'Jardinage',
  ARRAY['plantes', 'interieur', 'arrosage'],
  'low',
  25.00,
  'EUR',
  INTERVAL '30 minutes',
  (NOW() + INTERVAL '2 weeks'),
  ST_GeomFromText('POINT(2.3522 48.8566)', 4326),
  48.8566,
  2.3522,
  'Rue de la Pompe, 75016 Paris',
  'Paris',
  '75016',
  'France',
  '7d13f0e1-b7af-488f-ae05-4cbf717e3b80',
  'open',
  false,
  false,
  'pending',
  NOW()
);

-- 8. Tâches d'Aide Informatique
INSERT INTO tasks (id, title, description, category, tags, priority, budget, currency, estimated_duration, deadline, location, latitude, longitude, address, city, postal_code, country, author, status, is_urgent, is_featured, payment_status, created_at) VALUES
(
  gen_random_uuid(),
  'Configuration ordinateur et imprimante',
  'Aide pour configurer un nouvel ordinateur portable et connecter une imprimante WiFi. Niveau débutant.',
  'Aide Informatique',
  ARRAY['ordinateur', 'imprimante', 'configuration'],
  'medium',
  30.00,
  'EUR',
  INTERVAL '2 hours',
  (NOW() + INTERVAL '3 days'),
  ST_GeomFromText('POINT(2.3008 48.8566)', 4326),
  48.8566,
  2.3008,
  'Rue de la Convention, 75015 Paris',
  'Paris',
  '75015',
  'France',
  '7d13f0e1-b7af-488f-ae05-4cbf717e3b80',
  'open',
  false,
  false,
  'pending',
  NOW()
),
(
  gen_random_uuid(),
  'Formation utilisation smartphone',
  'Apprendre à utiliser les fonctionnalités de base de mon smartphone Android : photos, messages, applications.',
  'Aide Informatique',
  ARRAY['smartphone', 'android', 'formation'],
  'low',
  40.00,
  'EUR',
  INTERVAL '3 hours',
  (NOW() + INTERVAL '1 week'),
  ST_GeomFromText('POINT(2.3488 48.8534)', 4326),
  48.8534,
  2.3488,
  'Rue de la Bûcherie, 75005 Paris',
  'Paris',
  '75005',
  'France',
  '7d13f0e1-b7af-488f-ae05-4cbf717e3b80',
  'open',
  false,
  false,
  'pending',
  NOW()
);

-- 9. Tâches de Cours Particuliers
INSERT INTO tasks (id, title, description, category, tags, priority, budget, currency, estimated_duration, deadline, location, latitude, longitude, address, city, postal_code, country, author, status, is_urgent, is_featured, payment_status, created_at) VALUES
(
  gen_random_uuid(),
  'Cours de français pour étranger',
  'Cours de français niveau débutant pour un étudiant italien. 2h par semaine, conversation et grammaire de base.',
  'Cours Particuliers',
  ARRAY['francais', 'etranger', 'italien'],
  'medium',
  35.00,
  'EUR',
  INTERVAL '2 hours',
  (NOW() + INTERVAL '2 weeks'),
  ST_GeomFromText('POINT(2.3522 48.8566)', 4326),
  48.8566,
  2.3522,
  'Rue de la Huchette, 75005 Paris',
  'Paris',
  '75005',
  'France',
  '7d13f0e1-b7af-488f-ae05-4cbf717e3b80',
  'open',
  false,
  false,
  'pending',
  NOW()
);

-- 10. Tâches Diverses
INSERT INTO tasks (id, title, description, category, tags, priority, budget, currency, estimated_duration, deadline, location, latitude, longitude, address, city, postal_code, country, author, status, is_urgent, is_featured, payment_status, created_at) VALUES
(
  gen_random_uuid(),
  'Organisation de documents administratifs',
  'Aide pour trier et organiser des documents administratifs (factures, contrats, assurances). Classement par thème et date.',
  'Autre',
  ARRAY['documents', 'administration', 'organisation'],
  'low',
  25.00,
  'EUR',
  INTERVAL '4 hours',
  (NOW() + INTERVAL '5 days'),
  ST_GeomFromText('POINT(2.3488 48.8534)', 4326),
  48.8534,
  2.3488,
  'Rue de la Sorbonne, 75005 Paris',
  'Paris',
  '75005',
  'France',
  '7d13f0e1-b7af-488f-ae05-4cbf717e3b80',
  'open',
  false,
  false,
  'pending',
  NOW()
);

-- Affichage des statistiques après insertion
SELECT 
    'Tâches créées' as type,
    COUNT(*) as count
FROM tasks 
WHERE author = '7d13f0e1-b7af-488f-ae05-4cbf717e3b80'

UNION ALL

SELECT 
    'Total des tâches dans la base' as type,
    COUNT(*) as count
FROM tasks;
