-- Dev/runtime permissions for scene_answer_bundles.
-- Required because eve-platform currently uses the anon Supabase key from server-side routes.
-- This matches the current dev permission model used by the other Capa 1 scene tables.

grant select, insert, update, delete on scene_answer_bundles to anon, authenticated;

alter table scene_answer_bundles disable row level security;
