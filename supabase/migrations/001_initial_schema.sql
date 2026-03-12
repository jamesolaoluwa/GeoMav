-- GeoMav Database Schema
-- Run this in your Supabase SQL Editor to set up all tables

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

create table if not exists businesses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  website text,
  category text,
  description text,
  hours text,
  location text,
  pricing text,
  services text,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists queries (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  category text,
  business_id uuid references businesses(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists llm_responses (
  id uuid primary key default uuid_generate_v4(),
  query_id uuid references queries(id) on delete cascade,
  llm_name text not null,
  response_text text,
  created_at timestamptz default now()
);

create table if not exists mentions (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  response_id uuid references llm_responses(id) on delete cascade,
  rank integer,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  created_at timestamptz default now()
);

create table if not exists claims (
  id uuid primary key default uuid_generate_v4(),
  response_id uuid references llm_responses(id) on delete set null,
  claim_type text not null,
  claim_value text not null,
  verified_value text,
  status text not null default 'pending'
    check (status in ('pending', 'correction_deployed', 'resolved')),
  created_at timestamptz default now()
);

create table if not exists content_sections (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  type text not null check (type in ('summary', 'llms_txt', 'json_ld')),
  title text not null,
  content text,
  updated_at timestamptz default now()
);

create table if not exists opportunities (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  category text not null
    check (category in ('missing_mention', 'low_sentiment', 'hallucination', 'content_gap')),
  title text not null,
  description text,
  impact text check (impact in ('high', 'medium', 'low')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'completed')),
  suggested_fix text,
  created_at timestamptz default now()
);

create table if not exists competitors (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  visibility_score numeric,
  change numeric,
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index if not exists idx_queries_business on queries(business_id);
create index if not exists idx_llm_responses_query on llm_responses(query_id);
create index if not exists idx_mentions_business on mentions(business_id);
create index if not exists idx_mentions_response on mentions(response_id);
create index if not exists idx_claims_response on claims(response_id);
create index if not exists idx_claims_status on claims(status);
create index if not exists idx_content_sections_business on content_sections(business_id);
create index if not exists idx_opportunities_business on opportunities(business_id);
create index if not exists idx_competitors_business on competitors(business_id);
create index if not exists idx_businesses_user on businesses(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table businesses enable row level security;
alter table queries enable row level security;
alter table llm_responses enable row level security;
alter table mentions enable row level security;
alter table claims enable row level security;
alter table content_sections enable row level security;
alter table opportunities enable row level security;
alter table competitors enable row level security;

-- Businesses: users can only see/edit their own
create policy "Users can view own businesses"
  on businesses for select
  using (auth.uid() = user_id);

create policy "Users can insert own businesses"
  on businesses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own businesses"
  on businesses for update
  using (auth.uid() = user_id);

-- Queries: users can access queries for their businesses
create policy "Users can view queries for own businesses"
  on queries for select
  using (business_id in (select id from businesses where user_id = auth.uid()));

create policy "Users can insert queries for own businesses"
  on queries for insert
  with check (business_id in (select id from businesses where user_id = auth.uid()));

create policy "Users can delete queries for own businesses"
  on queries for delete
  using (business_id in (select id from businesses where user_id = auth.uid()));

-- LLM Responses: access through query -> business chain
create policy "Users can view responses for own queries"
  on llm_responses for select
  using (query_id in (
    select id from queries where business_id in (
      select id from businesses where user_id = auth.uid()
    )
  ));

-- Mentions: access through business
create policy "Users can view mentions for own businesses"
  on mentions for select
  using (business_id in (select id from businesses where user_id = auth.uid()));

-- Claims: access through response -> query -> business chain
create policy "Users can view claims for own responses"
  on claims for select
  using (response_id in (
    select id from llm_responses where query_id in (
      select id from queries where business_id in (
        select id from businesses where user_id = auth.uid()
      )
    )
  ));

create policy "Users can update claims for own responses"
  on claims for update
  using (response_id in (
    select id from llm_responses where query_id in (
      select id from queries where business_id in (
        select id from businesses where user_id = auth.uid()
      )
    )
  ));

-- Content sections: access through business
create policy "Users can view content for own businesses"
  on content_sections for select
  using (business_id in (select id from businesses where user_id = auth.uid()));

create policy "Users can manage content for own businesses"
  on content_sections for all
  using (business_id in (select id from businesses where user_id = auth.uid()));

-- Opportunities: access through business
create policy "Users can view opportunities for own businesses"
  on opportunities for select
  using (business_id in (select id from businesses where user_id = auth.uid()));

create policy "Users can update opportunities for own businesses"
  on opportunities for update
  using (business_id in (select id from businesses where user_id = auth.uid()));

-- Competitors: access through business
create policy "Users can view competitors for own businesses"
  on competitors for select
  using (business_id in (select id from businesses where user_id = auth.uid()));

-- ============================================
-- SERVICE ROLE POLICIES (for backend agents)
-- ============================================

-- Allow service role full access (backend uses service_role key)
create policy "Service role full access to businesses"
  on businesses for all
  using (true)
  with check (true);

create policy "Service role full access to queries"
  on queries for all
  using (true)
  with check (true);

create policy "Service role full access to llm_responses"
  on llm_responses for all
  using (true)
  with check (true);

create policy "Service role full access to mentions"
  on mentions for all
  using (true)
  with check (true);

create policy "Service role full access to claims"
  on claims for all
  using (true)
  with check (true);

create policy "Service role full access to content_sections"
  on content_sections for all
  using (true)
  with check (true);

create policy "Service role full access to opportunities"
  on opportunities for all
  using (true)
  with check (true);

create policy "Service role full access to competitors"
  on competitors for all
  using (true)
  with check (true);
