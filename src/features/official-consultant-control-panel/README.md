# Official Consultant Control Panel

## Unidad 1 — Shell oficial

Ruta: `/admin/official-consultant-control-panel`

La Unidad 1 implementa exclusivamente el shell visual del Modo Empresa Cliente
en estado vacío, sin datos de negocio ni avance funcional hacia otra unidad.

### Acceso

La superficie es exclusiva para el Consultor y está protegida por
`assertPageConsultantAccess`. La identidad visible `Rol: Consultor` es estática,
no representa roles funcionales EVE y no se deriva de parámetros de URL.

Los únicos query params consumidos por la ruta son:

- `mode`
- `view`
- `shellState`, únicamente fuera de producción

### Render implementado

- Cabecera contextual con siete campos.
- Banda de siete KPIs.
- Eje X vacío.
- Rail Y vacío.
- Drawer contextual colapsable.
- Tres subvistas: Monitoreo, Seguimiento y Gobernanza.
- Estados `loading`, `error` y `ready-empty`.

El drawer expone apertura y cierre accesibles, cierre con Escape, restitución de
foco y estado mediante `aria-expanded`. Las subvistas exponen
`aria-selected`.

### Aislamiento

- No importa componentes del panel legacy.
- No modifica ni redirige al panel legacy.
- No usa red, Supabase, BFF ni fixtures de negocio.
- No implementa procesos, hitos, alertas, Runtime ni datos reales.

### Pruebas

- Regresión estructural:
  `tests/regression/consultant-control-panel/official-control-panel-unit1.test.mjs`
- Interacción y accesibilidad:
  `tests/e2e/official-consultant-control-panel-unit1.spec.ts`
