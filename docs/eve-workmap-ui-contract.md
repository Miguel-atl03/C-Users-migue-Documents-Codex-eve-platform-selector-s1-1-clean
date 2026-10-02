# EVE · WorkMap UI Contract R0

## 1. Propósito

Este contrato define la plantilla visual rectora para pantallas posteriores a WorkMap. Su fuente es el WorkMap aprobado como H12 visual baseline, junto con los handoffs y closeouts de la cadena Login / Estado A / WorkMap / Significado.

El contrato no modifica WorkMap H12, no reabre sus handlers y no acopla pantallas futuras directamente a `WorkMapIntake`. Su función es convertir el patrón visual observado en una referencia reutilizable para Significado y futuras pantallas Runtime.

## 2. Principio rector

Agregar sobre lo aprobado.

No sustituir WorkMap, Estado A, Login ni Significado sin autorización explícita. Las nuevas pantallas deben heredar la familia visual EVE ya aprobada: shell sobrio, superficie blanca, baja carga visual, lenguaje humano y hoja central de captura.

## 3. Pantallas cubiertas

- Login / acceso: front-door aprobado mediante `ClientAuthScreen`.
- Estado A: inicio del levantamiento mediante `EmptyAssessmentState`.
- WorkMap: pantalla rectora para hoja de captura.
- Significado: pantalla posterior que debe heredar la plantilla visual WorkMap.
- Futuras pantallas Runtime: deben usar este contrato para mostrar interacciones sin exponer cableado interno.

WorkMap es la pantalla rectora para la hoja de captura porque concentra el patrón más estable: sidebar lateral, superficie blanca, header humano, avisos discretos, filas de captura y columna izquierda para pregunta/ayuda con columna derecha para respuesta.

## 4. Anatomía visual del WorkMap

- Fondo exterior: gris claro observado `#f5f5f5`, texto base `#272a32`.
- Sidebar: columna fija observada de `224px`, fondo gris `#dedede`, navegación vertical y footer de marca.
- Superficie blanca: contenedor principal blanco con radio observado de `14px` en shell y sombra amplia `0 10px 35px rgba(16, 24, 40, 0.08)`.
- Topbar: encabezado superior con saludo/título y menú de usuario alineado a la derecha.
- User menu: pill/avatar compacto en pantallas client; en WorkMap se inyecta mediante `ClientUserMenu`.
- Pasos laterales: lista de pasos con icono, etiqueta, estado activo blanco y check discreto.
- Guía lateral: card blanca dentro del sidebar, radio `10px`, sombra suave, textos de ayuda cortos y chips de verbos.
- Hoja central: `workMapCard`, superficie blanca con borde `#e5e7eb`, radio `12px`, header, cuerpo de filas y footer.
- Filas de captura: grid observado `240px minmax(0, 1fr)`. Izquierda contiene sección, número/título/ayuda; derecha contiene respuesta.
- Botones: primarios en gris `#4d4d4d` con texto blanco; secundarios blancos con borde suave.
- Inputs: borde `#e5e7eb` o `rgba(77, 77, 77, 0.14)`, radio `6px` a `8px`, foco con borde gris y ring `rgba(77, 77, 77, 0.08)`.
- Chips/radio options: compactos, borde suave, radio `8px`, wrap horizontal; seleccionado con acento gris/verde según contexto aprobado.
- Notices/avisos: bloques discretos con fondo `#fafafa` o warning `#fffbeb`, borde suave y copy de 11px a 12px.
- Estados de revisión: banners blancos o warning, listas compactas, cierre permitido con advertencia cuando aplique.

## 5. Tokens visuales

Valores observados:

| Token | Valor observado | Fuente |
|---|---:|---|
| Fondo exterior | `#f5f5f5` | `work-map-intake.module.css`, `ClientShell` |
| Texto principal | `#272a32` | WorkMap, ClientShell, Significado |
| Gris sidebar | `#dedede` | WorkMap sidebar |
| Gris de acción | `#4d4d4d` | botones, chips seleccionados, foco |
| Gris hover oscuro | `#3d3d3d` / `#2f333a` | Significado/Login variants |
| Texto secundario | `#6b7280`, `#6f7280` | subtítulos, ayudas |
| Borde estándar | `#e5e7eb` | card, filas, inputs |
| Borde suave EVE | `rgba(77, 77, 77, 0.14)` | chips e inputs compactos |
| Warning border | `#fcd34d` | validación |
| Warning bg | `#fffbeb` | validación |
| Warning text | `#92400e`, `#b45309` | validación |
| Verde aprobado | `#1f4f42`, `#cce8e0`, `#edf8f4` | Significado confirmación |
| Azul informativo | `#1e3a5f`, `#dbeafe`, `#f8fbff` | coach/help |
| Radio shell | `14px` | `appShell` |
| Radio card | `12px` | `workMapCard` |
| Radio controls | `6px` a `8px` | inputs, chips, buttons |
| Radio pill | `999px` | user pill, avatar, checks |
| Sombra shell | `0 10px 35px rgba(16, 24, 40, 0.08)` | `appShell` |
| Sombra card | `0 1px 4px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.04)` | `workMapCard` |
| Tipografía micro | `10px` a `11px` | footer, labels, hints |
| Tipografía formulario | `12px` | inputs, botones, filas |
| Tipografía sección | `12px` a `14px` | títulos de sección/header |
| Columna izquierda hoja | `240px` | WorkMap table grid |
| Grid principal shell | `224px minmax(0, 1fr)` | `appShell` |
| Padding main | `18px 24px 24px 20px` | WorkMap main |

Valores que requieren confirmación visual:

- Radio-cards con acento verde como estándar universal: en WorkMap el seleccionado principal usa gris; en Significado los estados de confirmación usan verde.
- Breakpoints exactos de WorkMap: no se observó media query propia en el CSS leído; Significado sí declara ajustes en `900px`, `768px` y `640px`.
- Captura visual final de Login / Estado A / WorkMap en runtime local completo: el closeout rector reporta limitación por Supabase ausente.

## 6. Patrón de hoja central

Patrón obligatorio para Significado / Runtime:

Desktop:

- Columna izquierda: pregunta, ayuda, explicación breve o contexto humano.
- Columna derecha: campo, textarea, subcampos u opciones.
- No badges internos visibles.
- No tarjetas pesadas por pregunta.
- Mantener filas separadas por borde suave y ritmo vertical compacto.

Mobile:

- Pregunta arriba.
- Respuesta debajo.
- Conservar ayuda visible.
- Permitir wrap de opciones y textos largos sin desbordar.
- Mantener CTA y navegación sin jerga técnica.

## 7. Patrón de opciones

Las opciones deben seguir el patrón Estado A / WorkMap:

- Radio-cards/chips simples.
- Respuesta en columna derecha.
- Borde suave.
- Seleccionado con acento verde cuando sea confirmación/validación y con acento gris cuando sea selección estructural neutra.
- Wrap en móvil.
- No botones gigantes.
- Texto corto, escaneable y sin etiquetas técnicas.

## 8. Patrón de pregunta abierta

- Usar input o textarea en columna derecha.
- Mantener ayuda debajo de la pregunta en columna izquierda.
- No mostrar etiquetas internas al usuario.
- Los campos prellenados pueden aparecer, pero sin decir "prellenado" al usuario salvo autorización explícita.
- El foco debe usar borde/ring discreto, no un estado visual agresivo.
- La ayuda debe explicar qué responder, no el origen técnico de la pregunta.

## 9. Qué NO debe ver el usuario

Estas marcas pueden existir internamente, pero no como UI visible:

- Prellenado desde WorkMap
- Requiere confirmación
- Obligatoria
- Opcional
- canonical
- fallback
- CANONICAL_HELP_MISSING
- captured_user_evidence
- inferred_from_workmap
- context_from_workmap
- payload
- bundle
- ranking
- score
- gates
- Bloque 0
- runtime
- diagnóstico
- transducción
- export
- Producción Paralela
- VSM
- MMABP
- AHE
- prioridad
- claridad
- energía
- carga
- ids técnicos

La UI puede usar datos internos para decidir qué mostrar, pero debe traducirlos a lenguaje operativo y humano.

## 10. Relación con Significado

Significado debe:

- Usar la misma plantilla visual de hoja WorkMap.
- Mostrar actividad actual.
- Mostrar preguntas Runtime como filas tipo WorkMap.
- Mostrar ayuda canónica o fallback documentado.
- Mostrar respuesta/opciones en columna derecha.
- Mantener metadata epistemológica interna.
- No mostrar selector, ranking, score ni gates.
- Operar como confirmación asistida de baja carga.

Significado no debe depender de `work-map-intake.module.css` como contrato oculto permanente. Puede reutilizar temporalmente clases aprobadas mientras exista closeout explícito, pero las futuras pantallas deben extraer tokens/patrones a una capa visual propia o documentada.

## 11. Relación con Runtime 40/20

Este contrato no implementa Runtime.

Solo define cómo deben verse las interacciones cuando Runtime entregue `InteractionViewModel`: hoja central, pregunta/ayuda a la izquierda, respuesta a la derecha, lenguaje no técnico, sin exposición de score, gates, payload, ranking ni diagnóstico.

## 12. No-go

- No tocar `WorkMapIntake` para hacer Significado.
- No reutilizar `work-map-intake.module.css` como dependencia oculta si genera acoplamiento.
- No cambiar Guardar.
- No reabrir asistencia inline.
- No rediseñar Estado A/Login en esta fase.
- No crear APIs/Supabase/Runtime engine.
- No convertir etiquetas internas en UI.
- No mostrar jerga arquitectónica al usuario final.
- No sustituir el patrón de hoja por cards pesadas por pregunta.

## 13. Checklist de aceptación visual

- ¿Usa fondo/superficie/shell EVE?
- ¿Pregunta izquierda/respuesta derecha?
- ¿Ayuda visible?
- ¿Sin cableado interno?
- ¿Sin jerga?
- ¿CTA consistente?
- ¿No toca WorkMap?
- ¿Responsive básico?
- ¿Opciones compactas con wrap?
- ¿Inputs con foco discreto?
- ¿Avisos humanos y no técnicos?
- ¿Metadata interna fuera de la UI visible?
