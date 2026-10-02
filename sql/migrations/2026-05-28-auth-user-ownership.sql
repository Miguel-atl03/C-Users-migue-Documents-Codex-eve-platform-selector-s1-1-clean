alter table if exists usuarios
  add column if not exists auth_user_id uuid null;

create unique index if not exists usuarios_auth_user_id_unique_not_null
  on usuarios(auth_user_id)
  where auth_user_id is not null;
