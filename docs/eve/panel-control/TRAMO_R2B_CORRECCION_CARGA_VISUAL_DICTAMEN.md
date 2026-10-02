# Dictamen — Tramo R2B corrección carga y visibilidad

Fecha: 2026-07-16  
Alcance: desbloqueo de contexto Amber, visibilidad de **Personas participantes** en Monitoreo  
**KPI Usuarios / Roles: —.** Responsabilidades, actividades y Runtime 40+20: **no iniciados.**  
Staging/producción: sin cambios.

## Veredicto

**R2B corrección aceptada en local.** Contexto Amber llega a `active` sin «Cargando empresas…» permanente. `CaseParticipantsPanel` visible en el workspace de Monitoreo (antes de estructura de proceso). Amber muestra vacío factual. Playwright R2B: **5/5**.

## Causa exacta del bloqueo de carga

Carrera entre **React Strict Mode / re-suscripción de auth** y el estado derivado `companiesLoading`:

1. El efecto de auth en `use-client-context.ts` volvía a poner `authReadiness = "checking"` en cada remount aunque ya existiera bearer y empresas cargadas.
2. `companiesLoading` dependía implícitamente de `checking`, por lo que seguía en `true` tras resolver relación/caso (`status === "active"`).
3. `ClientContextState` y el combobox mostraban **«Cargando empresas…»** en paralelo con el workspace de caso activo (Amber + INC16).

No era un fallo del BFF `/client-companies` ni de Supabase en sí: el fetch podía completar y el contexto activarse, pero la UI de carga no se apagaba.

## Archivos corregidos

| Archivo | Cambio |
|---------|--------|
| `hooks/use-client-context.ts` | `accessTokenRef`, `companiesLoadedRef`; no resetear a `checking` si hay token o empresas; `companiesLoading` solo cuando `!companiesLoaded` |
| `components/ClientContextState.tsx` | Con `status === "active"`, mensaje vacío (nunca «Cargando empresas…») |
| `components/ClientContextSelector.tsx` | `isLoading` ignora `companiesLoading` cuando contexto ya es `active` |
| `components/OfficialControlPanelShell.tsx` | `CaseParticipantsPanel` antes de `CaseMilestoneDetail` en `monitoringStack` |
| `styles/official-control-panel.module.css` | Estilo de tarjeta `.participantsPanel` para visibilidad en primer viewport |
| `hooks/use-case-participants.ts` | Navegación sin `history.pushState` manual; `router.push` + lectura de URL actual (evita desincronía al cambiar participante tras seleccionar perfil) |

## Transición de estado corregida

```
AuthReadiness (checking solo si no hay token ni empresas)
  → fetch /client-companies (AbortError ignorado; companiesLoadedRef persiste)
  → relación / caso
  → status: active
  → companiesLoading: false (permanente tras primera carga)
  → ClientContextState: sin mensaje de empresas
  → CaseParticipantsPanel montado en Monitoreo
```

Prioridad de estados participantes respetada: auth error → context loading → no case → loading → empty → partial → active → error.

## Ubicación final de CaseParticipantsPanel

Dentro de `OfficialControlPanelShell` → workspace **Monitoreo de Empresa Cliente** → `monitoringStack`:

1. **Personas participantes** (`CaseParticipantsPanel`)
2. **Estructura de proceso** (`CaseMilestoneDetail`)

No usa el rail de hitos. Ambos bloques visibles sin scroll profundo en desktop Amber.

## Validación Amber (URL canónica)

```
/admin/official-consultant-control-panel?mode=client-company&view=monitoring
&company=5c08029f-15e9-4bbd-b13e-0ff4765e23b8
&relationship=7c499a1c-31c6-4fc9-8b20-2fd8cdc57043
&case=19fc9eff-4219-43f0-854c-e2b3350f23f2
```

- Empresa: **Cervecería Amber**
- Relación: **Relación activa de Cervecería Amber**
- Caso: **Caso INC16 Cervecería Amber Ancestral**
- Participantes: **«Este caso no tiene personas participantes registradas.»** (0 filas en `case_participants`)

## Pruebas

- Regresión: `official-control-panel-local-session.test.mjs`, `official-control-panel-tramo-r2b.test.mjs` — OK
- Playwright: `official-consultant-control-panel-tramo-r2b.spec.ts` — **5/5**
  - Contexto Amber `active`, sin «Cargando empresas…»
  - Bloque Personas visible + vacío factual
  - Participante/perfil expandibles (mocks test-only)
  - URL `participant` / `profile`, KPI **—**

## Capturas

`reports/local/r2b/screenshots/` — `09` … `15` generadas (incl. `10-amber-personas-vacio-visible.png` con Amber + INC16 + vacío factual sin loading).

## Confirmaciones de alcance

- KPI **Usuarios** y **Roles funcionales**: **—** (sin activar)
- Proceso / hitos H0–H6: intactos
- Responsabilidades, actividades, Runtime: **no iniciados**
