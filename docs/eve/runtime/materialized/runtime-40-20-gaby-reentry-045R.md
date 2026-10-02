# Gaby Reentry 045-R

Classification: `blocked_gaby_real_entrypoint`

First factual blocker: No existe accion real equivalente en la frontera gobernada: ALLOWED_ACTIONS y GovernedExecutionAction solo incluyen start_synthetic_run para crear run; la ruta API exige synthetic_case_token antes de invocar el servicio.

## Evidence

- Governed execution focal test: PASS 4/4; synthetic QA path intact.
- Client BFF focal test: FAIL 38/39; import guard still detects direct Supabase import in client-bff answer route.
- No `start_real_run` or equivalent material action found in governed execution service/route.
- Staging execution was not attempted after the first blocker.

## Safety

staging consulted: no
staging writes: none
production consulted: no
production writes: 0
catalog activated: no
B0 modified: no
Gaby modified: no
commit created: no

