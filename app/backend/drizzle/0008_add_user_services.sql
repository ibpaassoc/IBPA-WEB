alter table "users"
  add column if not exists "services" jsonb default '[]'::jsonb not null;

update "users"
  set "services" = '[]'::jsonb
  where "services" is null;
