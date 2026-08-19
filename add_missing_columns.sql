-- Chạy toàn bộ đoạn này trong SQL Editor của Supabase để bổ sung các cột còn thiếu
alter table vendor add column if not exists cat_other text;
alter table vendor add column if not exists designation text;
alter table vendor add column if not exists business_reg_no text;
alter table vendor add column if not exists reg_first_date date;
alter table vendor add column if not exists reg_history jsonb default '[]'::jsonb;
alter table vendor add column if not exists headcount integer;
alter table vendor add column if not exists products_services text;
alter table vendor add column if not exists sub_suppliers text;
alter table vendor add column if not exists charter_capital numeric;
alter table vendor add column if not exists website text;
alter table vendor add column if not exists map_url text;
alter table vendor add column if not exists ytd_purchase numeric;

alter table vendor add column if not exists bank_account_no text;
alter table vendor add column if not exists bank_name text;
alter table vendor add column if not exists bank_branch text;
alter table vendor add column if not exists bank_account_holder text;
alter table vendor add column if not exists acc_confirmed boolean default false;
alter table vendor add column if not exists acc_confirmed_by text;
alter table vendor add column if not exists acc_confirmed_at timestamptz;

alter table vendor add column if not exists mst_status text;
alter table vendor add column if not exists mst_status_note text;
alter table vendor add column if not exists mst_status_at timestamptz;

alter table vendor add column if not exists sa_date date;
alter table vendor add column if not exists sa_score numeric;
alter table vendor add column if not exists sa_rating text;
alter table vendor add column if not exists sa_purpose text;

alter table vendor add column if not exists submitted_by text;
alter table vendor add column if not exists approved_by text;
alter table vendor add column if not exists portal_email text;
alter table vendor add column if not exists segment text;
alter table vendor add column if not exists relationship text default 'Spend_Authorized';

NOTIFY pgrst, 'reload schema';
