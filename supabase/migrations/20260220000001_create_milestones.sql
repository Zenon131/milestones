-- Migration: Create milestones table
-- Stores all relationship milestone data

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text not null check (char_length(title) <= 200),
  description text not null,
  category text not null check (category in ('Travel', 'Event', 'Personal', 'Anniversary', 'Achievement')),
  location text,
  image_url text,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for chronological queries
create index if not exists idx_milestones_date on public.milestones (date asc);

-- Index for category filtering
create index if not exists idx_milestones_category on public.milestones (category);

-- Auto-update updated_at on row changes
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_milestone_updated
  before update on public.milestones
  for each row
  execute function public.handle_updated_at();

-- Enable Row Level Security
alter table public.milestones enable row level security;

-- Public read/write policies (no auth required for this personal app)
-- Adjust these if you add authentication later
create policy "Allow public read access"
  on public.milestones for select
  using (true);

create policy "Allow public insert access"
  on public.milestones for insert
  with check (true);

create policy "Allow public update access"
  on public.milestones for update
  using (true);

create policy "Allow public delete access"
  on public.milestones for delete
  using (true);
