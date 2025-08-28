/*
  # MicroTask Initial Schema

  1. New Tables
    - `profiles` - User profiles extending Supabase auth
    - `tasks` - Task posts with geospatial data
    - `messages` - Real-time chat messages
    - `reviews` - User reviews and ratings
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure user data access
    
  3. Extensions
    - PostGIS for geospatial queries
    - Generate UUID v4 for primary keys
*/

-- Enable required extensions
create extension if not exists postgis;
create extension if not exists "uuid-ossp";

-- User profiles extending Supabase auth
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  avatar_url text,
  is_verified boolean default false,
  rating numeric(3,2) default 0,
  rating_count int default 0,
  created_at timestamptz default now()
);

-- Tasks with geospatial data
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  tags text[], -- Array de tags pour une meilleure catégorisation
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')), -- Niveau de priorité
  budget numeric(10,2) not null,
  currency text default 'EUR',
  estimated_duration interval, -- Durée estimée pour accomplir la tâche
  deadline timestamptz,
  location geometry(Point, 4326),
  latitude numeric(10,8), -- Coordonnées séparées pour faciliter les requêtes
  longitude numeric(11,8),
  address text,
  city text, -- Ville pour faciliter la recherche
  postal_code text, -- Code postal
  country text default 'France', -- Pays par défaut
  author uuid references profiles(id) on delete cascade,
  status text default 'open' check (status in ('open', 'assigned', 'in_progress', 'completed', 'cancelled', 'expired')), -- Statuts plus détaillés
  helper uuid references profiles(id),
  assigned_at timestamptz, -- Quand la tâche a été assignée
  started_at timestamptz, -- Quand la tâche a commencé
  completed_at timestamptz, -- Quand la tâche a été terminée
  photos text[], -- URLs des photos de la tâche
  attachments jsonb, -- Fichiers joints (PDF, documents, etc.)
  available_hours jsonb, -- Horaires de disponibilité (ex: {"monday": ["09:00-12:00", "14:00-18:00"]})
  is_urgent boolean default false, -- Tâche urgente
  is_featured boolean default false, -- Tâche mise en avant
  view_count int default 0, -- Nombre de vues
  application_count int default 0, -- Nombre de candidatures
  stripe_payment_intent text,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')), -- Statut du paiement
  metadata jsonb, -- Métadonnées flexibles pour extensions futures
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Real-time chat messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  sender uuid references profiles(id),
  content text,
  attachments jsonb,
  created_at timestamptz default now()
);

-- User reviews and ratings
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  reviewer uuid references profiles(id),
  reviewee uuid references profiles(id),
  rating int check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

-- Geospatial index for proximity queries
create index if not exists tasks_location_idx on tasks using gist (location);
create index if not exists tasks_status_idx on tasks (status);
create index if not exists tasks_priority_idx on tasks (priority);
create index if not exists tasks_category_idx on tasks (category);
create index if not exists tasks_city_idx on tasks (city);
create index if not exists tasks_deadline_idx on tasks (deadline);
create index if not exists tasks_author_idx on tasks (author);
create index if not exists tasks_helper_idx on tasks (helper);
create index if not exists tasks_created_at_idx on tasks (created_at);
create index if not exists tasks_budget_idx on tasks (budget);
create index if not exists tasks_is_urgent_idx on tasks (is_urgent);
create index if not exists tasks_is_featured_idx on tasks (is_featured);
create index if not exists messages_task_id_idx on messages (task_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_tasks_updated_at
  before update on tasks
  for each row
  execute function update_updated_at_column();

-- Enable RLS
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;

-- Profiles policies
create policy "Users can view all profiles"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Tasks policies
create policy "Anyone can view open tasks"
  on tasks for select
  to authenticated
  using (true);

create policy "Users can create tasks"
  on tasks for insert
  to authenticated
  with check (auth.uid() = author);

create policy "Authors and helpers can update tasks"
  on tasks for update
  to authenticated
  using (auth.uid() = author or auth.uid() = helper);

create policy "Authors can delete their own tasks"
  on tasks for delete
  to authenticated
  using (auth.uid() = author and status = 'open');

create policy "Helpers can update task progress"
  on tasks for update
  to authenticated
  using (auth.uid() = helper)
  with check (
    status in ('in_progress', 'completed')
  );

-- Messages policies
create policy "Task participants can view messages"
  on messages for select
  to authenticated
  using (
    auth.uid() in (
      select author from tasks where id = task_id
      union
      select helper from tasks where id = task_id
    )
  );

create policy "Task participants can send messages"
  on messages for insert
  to authenticated
  with check (
    auth.uid() = sender and
    auth.uid() in (
      select author from tasks where id = task_id
      union
      select helper from tasks where id = task_id
    )
  );

-- Reviews policies
create policy "Anyone can view reviews"
  on reviews for select
  to authenticated
  using (true);

create policy "Task participants can create reviews"
  on reviews for insert
  to authenticated
  with check (
    auth.uid() = reviewer and
    auth.uid() in (
      select author from tasks where id = task_id
      union
      select helper from tasks where id = task_id
    )
  );