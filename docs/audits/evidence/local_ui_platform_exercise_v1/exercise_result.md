# RUN_LOCAL_UI_PLATFORM_EXERCISE_WITH_SYNTHETIC_FRONTIER_V1

- dictamen: LOCAL_UI_PLATFORM_EXERCISE_SYNTHETIC_FRONTIER_EXECUTED_FAILED
- comando ejecutado: `node .\node_modules\next\dist\bin\next dev --webpack`
- ruta/pantalla usada: `http://localhost:3000/dev/e2e-block0`
- accion de usuario simulado: entrar por "Demo controlada", empezar levantamiento, cargar ejemplo financiero local, guardar WorkMap, continuar a Significado y abrir traza demo.
- resultado observado: la UI cargo fixture financiero local con 3 responsabilidades y 17 actividades, guardo snapshot local, selecciono 8 actividades primarias y mostro actividad 1 de 8 en Significado con prefill de Block 0. Durante la pantalla Significado, una llamada auxiliar a `/api/coach/operational-description/intro-example` fallo porque intento resolver variables Supabase ausentes. No hubo conexion DB ni Supabase, pero la frontera local no quedo limpia.
- micro->macro acoplado: si, parcialmente. La traza muestra fuente local, conteos WorkMap guardados, actividades aplanadas, seleccion primaria y actividad actual conectada al prefill. El ciclo posterior queda bloqueado por dependencia auxiliar de entorno.
- next step: desacoplar o mockear `/api/coach/operational-description/intro-example` para modo demo/local antes de repetir el ciclo completo, sin DB real ni Supabase.

Nota de ejecucion: `npm run dev` fue intentado primero, pero Turbopack fallo por limite de longitud de ruta en Windows. Se uso el fallback documentado de Next `next dev --webpack`.
