alter type estado_sesion add value if not exists 'capa_1_triple';
alter type estado_sesion add value if not exists 'capa_2_estructural';
alter type estado_sesion add value if not exists 'capa_2_5_s2';
alter type estado_sesion add value if not exists 'capa_3a_patron';
alter type estado_sesion add value if not exists 'pausa_s4';
alter type estado_sesion add value if not exists 'capa_3b_ruptura';

alter type capa_metricas add value if not exists 'capa_1_triple';
alter type capa_metricas add value if not exists 'capa_2_estructural';
alter type capa_metricas add value if not exists 'capa_2_5_s2';
alter type capa_metricas add value if not exists 'capa_3a_patron';
alter type capa_metricas add value if not exists 'pausa_s4';
alter type capa_metricas add value if not exists 'capa_3b_ruptura';

alter type tipo_evento_sistema add value if not exists 'evento_algedonico';

alter table actividades
  add column if not exists interconexion_score integer not null default 0 check (interconexion_score between 0 and 5),
  add column if not exists impacto_score integer not null default 0 check (impacto_score between 0 and 5),
  add column if not exists variabilidad_score integer not null default 0 check (variabilidad_score between 0 and 5);

create table if not exists respuestas_patron (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  pregunta_id text not null,
  respuesta_global text not null,
  excepciones_json jsonb not null default '{}'::jsonb,
  total_no_aplica integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sesion_id, pregunta_id)
);

create table if not exists mapa_coordinacion_s2 (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  actividades_seleccionadas uuid[] not null,
  patron_coordinacion text not null,
  created_at timestamptz not null default now()
);

create table if not exists micro_momentos_s4 (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  tipo_pausa text not null check (tipo_pausa in ('pasiva', 'activa')),
  resumen_contradicciones text,
  respuesta_clasificacion text,
  created_at timestamptz not null default now()
);

create table if not exists eventos_algedonicos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid references sesiones_llenado(id) on delete set null,
  actividad_id uuid references actividades(id) on delete set null,
  tipo_falla text not null,
  reaccion_inicial text not null,
  escalamiento text,
  resolutor text,
  impacto text,
  aprendizaje text,
  cambio_posterior text,
  severidad severidad_log not null default 'warning',
  created_at timestamptz not null default now()
);

create index if not exists idx_eventos_algedonicos_sesion on eventos_algedonicos(sesion_id, created_at);
