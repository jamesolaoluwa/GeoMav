-- Phase Alignment: New tables for truth store, agent operations, ethics, correction timelines, ROI, and agent reports

create extension if not exists "uuid-ossp";

-- Business journey phase tracking
create table if not exists business_journey (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade unique,
  current_phase integer not null default 1,
  phase1_completed_at timestamptz,
  phase2_completed_at timestamptz,
  phase3_completed_at timestamptz,
  phase4_completed_at timestamptz,
  phase5_completed_at timestamptz,
  phase6_completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agent settings (user-configurable)
create table if not exists agent_settings (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade unique,
  monitored_llms jsonb not null default '["ChatGPT","Gemini","Claude","Perplexity","Bing","DeepSeek"]',
  scan_frequency text not null default 'weekly' check (scan_frequency in ('daily','weekly','biweekly','monthly')),
  scan_hour integer not null default 9,
  auto_deploy_corrections boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agent run logs for agent operation dashboard
create table if not exists agent_runs (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  agent_type text not null check (agent_type in ('analytics','enrichment','reinforcement')),
  status text not null default 'running' check (status in ('running','completed','failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms integer,
  items_processed integer default 0,
  llm_calls integer default 0,
  errors integer default 0,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Ethics flags
create table if not exists ethics_flags (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  flag_type text not null check (flag_type in ('bias','accuracy','sentiment_spike','disparity')),
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  title text not null,
  description text,
  source_agent text,
  source_data jsonb,
  status text not null default 'open' check (status in ('open','acknowledged','resolved','dismissed')),
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Claim events for correction timeline
create table if not exists claim_events (
  id uuid primary key default uuid_generate_v4(),
  claim_id uuid references claims(id) on delete cascade,
  event_type text not null check (event_type in ('detected','content_generated','correction_deployed','requery_24h','requery_48h','requery_72h','resolved','escalated')),
  description text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Agent performance reports
create table if not exists agent_performance_reports (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  report_period_start date not null,
  report_period_end date not null,
  analytics_contribution jsonb,
  enrichment_contribution jsonb,
  reinforcement_contribution jsonb,
  visibility_delta numeric,
  truth_score_delta numeric,
  claims_resolved integer default 0,
  content_deployed integer default 0,
  summary text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_business_journey_business on business_journey(business_id);
create index if not exists idx_agent_settings_business on agent_settings(business_id);
create index if not exists idx_agent_runs_business on agent_runs(business_id);
create index if not exists idx_agent_runs_type on agent_runs(agent_type);
create index if not exists idx_agent_runs_status on agent_runs(status);
create index if not exists idx_ethics_flags_business on ethics_flags(business_id);
create index if not exists idx_ethics_flags_status on ethics_flags(status);
create index if not exists idx_claim_events_claim on claim_events(claim_id);
create index if not exists idx_claim_events_type on claim_events(event_type);
create index if not exists idx_agent_perf_reports_business on agent_performance_reports(business_id);

-- RLS
alter table business_journey enable row level security;
alter table agent_settings enable row level security;
alter table agent_runs enable row level security;
alter table ethics_flags enable row level security;
alter table claim_events enable row level security;
alter table agent_performance_reports enable row level security;

-- Service role full access
create policy "Service role full access to business_journey"
  on business_journey for all using (true) with check (true);
create policy "Service role full access to agent_settings"
  on agent_settings for all using (true) with check (true);
create policy "Service role full access to agent_runs"
  on agent_runs for all using (true) with check (true);
create policy "Service role full access to ethics_flags"
  on ethics_flags for all using (true) with check (true);
create policy "Service role full access to claim_events"
  on claim_events for all using (true) with check (true);
create policy "Service role full access to agent_performance_reports"
  on agent_performance_reports for all using (true) with check (true);

-- User RLS policies
create policy "Users can view own business journey"
  on business_journey for select
  using (business_id in (select id from businesses where user_id = auth.uid()));

create policy "Users can view own agent settings"
  on agent_settings for select
  using (business_id in (select id from businesses where user_id = auth.uid()));

create policy "Users can manage own agent settings"
  on agent_settings for all
  using (business_id in (select id from businesses where user_id = auth.uid()));

create policy "Users can view own agent runs"
  on agent_runs for select
  using (business_id in (select id from businesses where user_id = auth.uid()));

create policy "Users can view own ethics flags"
  on ethics_flags for select
  using (business_id in (select id from businesses where user_id = auth.uid()));

create policy "Users can view own claim events"
  on claim_events for select
  using (claim_id in (
    select id from claims where response_id in (
      select id from llm_responses where query_id in (
        select id from queries where business_id in (
          select id from businesses where user_id = auth.uid()
        )
      )
    )
  ));

create policy "Users can view own agent performance reports"
  on agent_performance_reports for select
  using (business_id in (select id from businesses where user_id = auth.uid()));
