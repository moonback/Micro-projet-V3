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
  budget numeric(10,2) not null,
  currency text default 'EUR',
  deadline timestamptz,
  location geometry(Point, 4326),
  address text,
  author uuid references profiles(id) on delete cascade,
  status text default 'open',
  helper uuid references profiles(id),
  stripe_payment_intent text,
  created_at timestamptz default now()
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
create index if not exists messages_task_id_idx on messages (task_id);

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