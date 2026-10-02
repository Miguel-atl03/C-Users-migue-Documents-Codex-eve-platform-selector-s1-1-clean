# Configuracion inicial de Supabase para EVE

1. Entra a Supabase y crea un proyecto nuevo.
2. Abre `SQL Editor`.
3. Ejecuta primero `sql/schema.sql`.
4. Ejecuta despues `sql/seed.sql`.
5. Ve a `Project Settings > API`.
6. Copia `Project URL` y `anon public key`.
7. Crea un archivo `.env.local` en la raiz del proyecto con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_public_key
```

No pegues aqui la service role key. Esa llave se usara mas adelante solo si
necesitamos operaciones administrativas desde rutas internas.

