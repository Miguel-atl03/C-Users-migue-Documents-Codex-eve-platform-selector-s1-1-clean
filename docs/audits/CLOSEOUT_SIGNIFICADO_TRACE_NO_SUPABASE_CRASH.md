# CLOSEOUT · Significado trace sin crash por Supabase

## Causa raíz

La ruta `/admin/significado-trace/[sessionId]` importaba `buildSignificadoConsultantTrace`, que a su vez importaba `supabaseServer` desde `src/lib/supabase-server.ts` en el **module load**. Ese módulo lanzaba de inmediato:

```text
Supabase environment variables are missing.
```

En entorno local sin `.env`, Next.js no podía renderizar la página de detalle y mostraba error de servidor antes de llegar a la UI.

## Archivos modificados

- `src/lib/supabase-server.ts`
- `src/services/significado-consultant-trace.ts`
- `src/components/consultant/SignificadoConsultantTraceView.tsx`
- `tests/regression/significado-consultant-trace.test.ts`
- `docs/audits/CLOSEOUT_SIGNIFICADO_TRACE_NO_SUPABASE_CRASH.md`

No se modificó:

- EVE04
- chips
- runtime productivo
- registry
- `package.json`
- Producción Paralela

## Comportamiento antes / después

### Antes

- `/admin/significado-trace` cargaba (client component, sin Supabase).
- `/admin/significado-trace/<sessionId>` crasheaba al importar el servicio si faltaban variables Supabase.
- Error rojo de Next con stack trace.

### Después

- `/admin/significado-trace` sigue igual.
- `/admin/significado-trace/<sessionId>` renderiza la vista de trazabilidad aunque Supabase no esté configurado.
- El servicio devuelve `status: "supabase_missing_env"` con arrays vacíos y sin datos inventados.
- La UI muestra:
  - banner: “Supabase no configurado para esta prueba local”
  - mensaje: “No se consultaron datos reales”
  - `sessionId` visible
  - layout completo de trazabilidad (secciones vacías)
- No se muestra botón “Descargar Excel” en este estado.
- No se activa diagnóstico, export productivo ni transducción desde el servicio de trace.

## Cambios técnicos

1. **`supabase-server.ts`**: exporta `isSupabaseConfigured` y difiere la creación del cliente hasta el primer uso real (el error se mantiene solo si algo intenta consultar Supabase sin env).
2. **`significado-consultant-trace.ts`**: cortocircuito temprano con `supabase_missing_env`; imports dinámicos de repositorios solo cuando hay Supabase configurado.
3. **`SignificadoConsultantTraceView.tsx`**: banner y footer controlados; oculta export en modo local sin Supabase.

## Cómo probar visualmente

1. Asegurarse de no tener `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el entorno de dev (o usar un shell sin `.env`).
2. Levantar la app: `npm run dev`
3. Abrir: `/admin/significado-trace/test-session`
4. Verificar:
   - página renderizada sin crash
   - banner azul de Supabase no configurado
   - `sessionId: test-session` visible
   - secciones de trazabilidad presentes pero vacías
   - sin botón “Descargar Excel”
   - sin error rojo de Next

También probar `/admin/significado-trace` → ingresar un sessionId → navegar al detalle.

## Tests ejecutados

```bash
node --test tests/regression/significado-consultant-trace.test.ts
```

## Confirmación EVE04

No se tocaron archivos, tests ni rutas de EVE04 en este fix.
