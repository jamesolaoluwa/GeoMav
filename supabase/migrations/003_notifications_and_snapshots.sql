-- Notifications & Historical Snapshots
-- Adds notification preferences, notification log, and visibility snapshots

-- ============================================
-- TABLES
-- ============================================

create table if not exists notification_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  hallucination_alerts boolean not null default true,
  weekly_report boolean not null default true,
  opportunity_alerts boolean not null default false,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

create table if not exists notification_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('hallucination_alert', 'weekly_report', 'opportunity_alert')),
  subject text not null,
  sent_at timestamptz default now(),
  status text not null default 'sent' check (status in ('sent', 'failed'))
);

create table if not exists visibility_snapshots (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  snapshot_date date not null default current_date,
  visibility_score numeric,
  mention_count integer default 0,
  claim_count integer default 0,
  pending_claims integer default 0,
  avg_sentiment numeric,
  competitor_data jsonb,
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index if not exists idx_notif_prefs_user on notification_preferences(user_id);
create index if not exists idx_notif_log_user on notification_log(user_id);
create index if not exists idx_notif_log_type on notification_log(type);
create index if not exists idx_vis_snapshots_business on visibility_snapshots(business_id);
create index if not exists idx_vis_snapshots_date on visibility_snapshots(snapshot_date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table notification_preferences enable row level security;
alter table notification_log enable row level security;
alter table visibility_snapshots enable row level security;

create policy "Users can view own notification preferences"
  on notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can manage own notification preferences"
  on notification_preferences for all
  using (auth.uid() = user_id);

create policy "Users can view own notification log"
  on notification_log for select
  using (auth.uid() = user_id);

create policy "Users can view snapshots for own businesses"
  on visibility_snapshots for select
  using (business_id in (select id from businesses where user_id = auth.uid()));

-- Service role full access
create policy "Service role full access to notification_preferences"
  on notification_preferences for all
  using (true)
  with check (true);

create policy "Service role full access to notification_log"
  on notification_log for all
  using (true)
  with check (true);

create policy "Service role full access to visibility_snapshots"
  on visibility_snapshots for all
  using (true)
  with check (true);
