-- LOCAL F5 CURRENT-RUNTIME ADAPTER CANDIDATE VERIFY
-- NOT APPROVED FOR STAGING OR PRODUCTION

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'eve_object_inventory_version',
    'eve_object_definition',
    'eve_object_state_definition',
    'runtime_object_binding',
    'object_materialization_event'
  )
ORDER BY table_name;

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'eve_object_inventory_version',
    'eve_object_definition',
    'eve_object_state_definition',
    'runtime_object_binding',
    'object_materialization_event'
  )
ORDER BY tablename, policyname;
