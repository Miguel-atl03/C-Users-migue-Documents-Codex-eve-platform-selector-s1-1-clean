create extension if not exists "pgcrypto";

do $$ begin
  create type estado_sesion as enum (
    'capa_1_triple',
    'capa_2_estructural',
    'capa_2_5_s2',
    'capa_3a_patron',
    'pausa_s4',
    'capa_3b_ruptura',
    'completado'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type origen_actividad as enum ('usuario_redactada', 'ia_inferida');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type tipo_relato as enum ('ultimo_incendio', 'lo_que_no_deberia_pasar');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type tipo_campo as enum (
    'lista_desplegable',
    'texto_corto',
    'texto_largo',
    'booleano',
    'select_actividades',
    'opciones_multiples'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type velocidad_pregunta as enum ('V1', 'V2', 'V3');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type tipo_evento_sistema as enum (
    'trigger_error',
    'evaluacion_tension_error',
    'respuesta_inconsistente',
    'sync_error',
    'ui_error',
    'evento_algedonico'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type severidad_log as enum ('info', 'warning', 'critical');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type estado_tension as enum (
    'detectada',
    'mostrada_al_usuario',
    'resuelta',
    'ignorada'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type capa_metricas as enum (
    'capa_1_triple',
    'capa_2_estructural',
    'capa_2_5_s2',
    'capa_3a_patron',
    'pausa_s4',
    'capa_3b_ruptura'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type razon_abandono as enum (
    'timeout',
    'error_sistema',
    'desconexion',
    'desistimiento_voluntario',
    'desconocida'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type tipo_rescate as enum (
    'recordatorio_email',
    'reentrada_guiada',
    'reset_parcial'
  );
exception when duplicate_object then null;
end $$;

create table if not exists empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  sector text,
  created_at timestamptz not null default now()
);

create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  rol_declarado text,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists versiones_herramienta (
  id uuid primary key default gen_random_uuid(),
  numero_version text not null unique,
  activa boolean not null default false,
  fecha_despliegue timestamptz not null default now()
);

create table if not exists sesiones_llenado (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  version_herramienta_id uuid not null references versiones_herramienta(id),
  estado_actual estado_sesion not null default 'capa_1_triple',
  ultima_actividad_id uuid,
  porcentaje_avance integer not null default 0 check (porcentaje_avance between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists actividades (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  ancla_narrativa text not null,
  verbo_identificado text,
  objeto_negocio text,
  es_critica boolean not null default false,
  interconexion_score integer not null default 0 check (interconexion_score between 0 and 5),
  impacto_score integer not null default 0 check (impacto_score between 0 and 5),
  variabilidad_score integer not null default 0 check (variabilidad_score between 0 and 5),
  origen origen_actividad not null default 'usuario_redactada',
  aceptada boolean not null default true,
  created_at timestamptz not null default now()
);

alter table sesiones_llenado
  drop constraint if exists sesiones_llenado_ultima_actividad_id_fkey;

alter table sesiones_llenado
  add constraint sesiones_llenado_ultima_actividad_id_fkey
  foreign key (ultima_actividad_id) references actividades(id) on delete set null;

create table if not exists respuestas_relatos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  tipo_relato tipo_relato not null,
  numero_pregunta integer not null check (numero_pregunta between 1 and 7),
  respuesta_texto text,
  respuesta_seleccionada text,
  actividad_id_seleccionada uuid references actividades(id) on delete set null,
  timestamp_respuesta timestamptz not null default now(),
  version_herramienta_id uuid not null references versiones_herramienta(id),
  unique (sesion_id, tipo_relato, numero_pregunta)
);

create table if not exists respuestas_estructuradas (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  actividad_id uuid references actividades(id) on delete cascade,
  pregunta_id text not null,
  valor_seleccionado text,
  texto_libre text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sesion_id, actividad_id, pregunta_id)
);

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

create table if not exists catalogo_preguntas (
  id text primary key,
  version_id uuid not null references versiones_herramienta(id) on delete cascade,
  codigo_pregunta text not null,
  texto_amigable text not null,
  tipo_campo tipo_campo not null,
  opciones_json jsonb,
  velocidad velocidad_pregunta not null
);

create table if not exists catalogo_preguntas_relatos (
  id text primary key,
  version_id uuid not null references versiones_herramienta(id) on delete cascade,
  tipo_relato tipo_relato not null,
  numero_pregunta integer not null check (numero_pregunta between 1 and 7),
  texto_pregunta text not null,
  tipo_campo tipo_campo not null,
  opciones_json jsonb,
  placeholder_texto text,
  tiempo_maximo_minutos integer not null default 5
);

create table if not exists matriz_tensiones (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references versiones_herramienta(id) on delete cascade,
  codigo_tension text not null,
  condicion_logica_json jsonb not null,
  pregunta_emergente_texto text not null,
  opciones_emergentes_json jsonb not null,
  unique (version_id, codigo_tension)
);

create table if not exists system_logs (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  tipo_evento tipo_evento_sistema not null,
  sesion_id uuid references sesiones_llenado(id) on delete set null,
  actividad_id uuid references actividades(id) on delete set null,
  descripcion_error text not null,
  stack_trace text,
  severidad severidad_log not null default 'info',
  resuelto boolean not null default false
);

create table if not exists error_alerts (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references system_logs(id) on delete cascade,
  notificacion_enviada boolean not null default false,
  timestamp_alerta timestamptz not null default now()
);

create table if not exists evaluaciones_en_progreso (
  id uuid primary key default gen_random_uuid(),
  actividad_id uuid not null unique references actividades(id) on delete cascade,
  timestamp_inicio timestamptz not null default now(),
  timeout_segundos integer not null default 5,
  worker_id text not null
);

create table if not exists tensiones_activas (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  actividad_id uuid references actividades(id) on delete cascade,
  codigo_tension text not null,
  estado estado_tension not null default 'detectada',
  timestamp_deteccion timestamptz not null default now(),
  timestamp_resolucion timestamptz,
  respuesta_usuario_json jsonb,
  unique (sesion_id, actividad_id, codigo_tension)
);

create table if not exists tensiones_resueltas_historial (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  codigo_tension text not null,
  tiempo_resolucion_segundos integer,
  fue_ignorada boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists metricas_por_capa (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  capa capa_metricas not null,
  timestamp_entrada timestamptz not null default now(),
  timestamp_salida timestamptz,
  tiempo_total_segundos integer,
  completada boolean not null default false,
  unique (sesion_id, capa)
);

create table if not exists metricas_por_pregunta (
  id uuid primary key default gen_random_uuid(),
  pregunta_id text not null,
  version_id uuid not null references versiones_herramienta(id) on delete cascade,
  total_respondidas integer not null default 0,
  total_saltadas integer not null default 0,
  total_prefiero_no_contestar integer not null default 0,
  tiempo_promedio_respuesta_segundos numeric,
  unique (pregunta_id, version_id)
);

create table if not exists metricas_abandono (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  ultima_capa_alcanzada estado_sesion not null,
  ultima_actividad_alcanzada uuid references actividades(id) on delete set null,
  tiempo_total_sesion_segundos integer,
  timestamp_abandono timestamptz not null default now(),
  razon_probable razon_abandono not null default 'desconocida'
);

create table if not exists sesiones_rescate (
  id uuid primary key default gen_random_uuid(),
  sesion_original_id uuid not null references sesiones_llenado(id) on delete cascade,
  tipo_rescate tipo_rescate not null,
  timestamp_intento timestamptz not null default now(),
  exitoso boolean not null default false,
  timestamp_reactivacion timestamptz
);

create index if not exists idx_sesiones_estado on sesiones_llenado(estado_actual);
create index if not exists idx_sesiones_updated_at on sesiones_llenado(updated_at);
create index if not exists idx_actividades_sesion on actividades(sesion_id);
create index if not exists idx_respuestas_relatos_sesion on respuestas_relatos(sesion_id);
create index if not exists idx_logs_severidad on system_logs(severidad, resuelto);
create index if not exists idx_tensiones_sesion on tensiones_activas(sesion_id, estado);
create index if not exists idx_eventos_algedonicos_sesion on eventos_algedonicos(sesion_id, created_at);
