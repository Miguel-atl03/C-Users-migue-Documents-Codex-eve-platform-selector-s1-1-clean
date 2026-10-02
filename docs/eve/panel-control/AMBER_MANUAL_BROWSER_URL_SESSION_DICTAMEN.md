# Dictamen — Revisión visual del Panel Oficial (Amber / Unit 2 local)

Fecha: 2026-07-15  
Alcance: diagnóstico de la captura del usuario + cierre de gap de sesión en navegador manual.

## Veredicto

El código de coherencia visual **sí estaba aplicado**. La captura del usuario no mostraba Cervecería Amber por **dos causas operativas**, no por falta de despliegue del cambio:

1. **URL incompleta** — solo `mode=client-company&view=monitoring`, sin `company` / `relationship` / `case` canónicos.
2. **Sesión de Consultor ausente o bootstrap trabado** — mensaje `No fue posible validar la sesión del Consultor.` (copy nuevo de sesión), con selectores ocultos y banda “Sesión no validada”.

Tras correcciones de bootstrap (cache compartida + timeout) y URL canónica, el panel muestra:

- Empresa: **Cervecería Amber**
- Relación: **Relación activa de Cervecería Amber**
- Caso: **Caso INC16 Cervecería Amber Ancestral**
- Banda activa: chip **Caso** con etiqueta INC16
- `estado_actual` / placeholders: **No disponible** (esperado; Unit 3 fuera de alcance)

## URL canónica

```
http://127.0.0.1:3000/admin/official-consultant-control-panel?mode=client-company&view=monitoring&company=5c08029f-15e9-4bbd-b13e-0ff4765e23b8&relationship=7c499a1c-31c6-4fc9-8b20-2fd8cdc57043&case=19fc9eff-4219-43f0-854c-e2b3350f23f2
```

## Cambios de esta pasada (sesión browser)

| Archivo | Qué |
|---------|-----|
| `local-session-bootstrap.ts` | Bootstrap compartido anti Strict Mode + timeout 12s; sin gate cliente antes de `/local-session` |
| `use-client-context.ts` | Remount seguro (`active`); reset solo en `retry` |
| `ClientContextState.tsx` | Helper local en fallo de sesión |
| `OfficialPanelLocalAccessHelper.tsx` | Botón Acceder → JWT real + URL Amber |
| Tests regression local-session / staging-gate | Alineados al nuevo contrato |

## Confirmación usuario

Usuario confirmó: ya ve Cervecería Amber / INC16 en selectores.
