with version as (
  select id from versiones_herramienta where numero_version = 'v1.0'
)
insert into catalogo_preguntas_relatos (
  id,
  version_id,
  tipo_relato,
  numero_pregunta,
  texto_pregunta,
  tipo_campo,
  opciones_json,
  placeholder_texto
)
select
  concat('relato_incendio_', numero_pregunta, '_v1.0'),
  version.id,
  'ultimo_incendio'::tipo_relato,
  numero_pregunta,
  texto_pregunta,
  tipo_campo::tipo_campo,
  opciones_json::jsonb,
  placeholder_texto
from version,
(values
  (1, 'Actividad relacionada', 'select_actividades', null, null),
  (2, 'Que estabas intentando lograr en esta actividad?', 'texto_corto', null, 'Describe el objetivo inmediato'),
  (3, 'Que fue lo primero que salio mal?', 'texto_corto', null, 'Describe el primer quiebre'),
  (4, 'Que hiciste para intentar resolverlo?', 'texto_corto', null, 'Describe tu primera accion'),
  (5, 'De quien o de que dependias para sacarlo adelante?', 'texto_corto', null, 'Persona, area, sistema o condicion'),
  (6, 'Que terminaste sacrificando para resolverlo?', 'texto_corto', null, 'Tiempo, calidad, alcance, margen, relacion u otra cosa'),
  (7, 'Como termino saliendo esta actividad al final?', 'texto_corto', null, 'Describe el resultado real')
) as preguntas(numero_pregunta, texto_pregunta, tipo_campo, opciones_json, placeholder_texto)
on conflict (id) do update set
  texto_pregunta = excluded.texto_pregunta,
  tipo_campo = excluded.tipo_campo,
  opciones_json = excluded.opciones_json,
  placeholder_texto = excluded.placeholder_texto;

with version as (
  select id from versiones_herramienta where numero_version = 'v1.0'
)
insert into catalogo_preguntas_relatos (
  id,
  version_id,
  tipo_relato,
  numero_pregunta,
  texto_pregunta,
  tipo_campo,
  opciones_json,
  placeholder_texto
)
select
  concat('relato_no_deberia_', numero_pregunta, '_v1.0'),
  version.id,
  'lo_que_no_deberia_pasar'::tipo_relato,
  numero_pregunta,
  texto_pregunta,
  tipo_campo::tipo_campo,
  opciones_json::jsonb,
  placeholder_texto
from version,
(values
  (1, 'Actividad relacionada', 'select_actividades', null, null),
  (2, 'Que pasa normalmente en esta actividad que sabes que no deberia pasar?', 'texto_corto', null, 'Describe lo que ya se normalizo'),
  (3, 'Cada cuanto ocurre?', 'texto_corto', null, 'Di si pasa diario, semanal, mensual o bajo ciertas condiciones'),
  (4, 'Que hace normalmente la gente para que la actividad salga adelante cuando pasa eso?', 'texto_corto', null, 'Describe la compensacion habitual'),
  (5, 'Que problema tendria alguien si intentara hacer esta actividad correctamente?', 'texto_corto', null, 'Describe la friccion de hacerlo bien'),
  (6, 'Que se termina sacrificando para que esta actividad siga saliendo?', 'texto_corto', null, 'Tiempo, calidad, trazabilidad, bienestar u otra cosa'),
  (7, 'Por que crees que esto sigue pasando en esta actividad?', 'texto_corto', null, 'Describe la razon estructural que sospechas')
) as preguntas(numero_pregunta, texto_pregunta, tipo_campo, opciones_json, placeholder_texto)
on conflict (id) do update set
  texto_pregunta = excluded.texto_pregunta,
  tipo_campo = excluded.tipo_campo,
  opciones_json = excluded.opciones_json,
  placeholder_texto = excluded.placeholder_texto;

