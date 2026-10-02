# Runtime 40/20 - Gaby Reentry 045

Classification: `blocked_gaby_reentry`

FULL activo verificado en staging por lectura: `EVE_RUNTIME_40_20_FULL_OA_V1_1_1_MC1_0_IH_EF614C98B10611411C6AA62E0332856E726F4DC622D42EDBB550F4A4221A604F`.

No se ejecutó una sesión real de Gaby. La evidencia material muestra que la ruta gobernada 044 usa `start_synthetic_run` y exige `synthetic_case_token`; la ruta BFF real existe como candidato local, pero queda bloqueada por flags/dependencias locales y por el guard de seguridad del BFF.

Seguridad: staging writes none; production consulted no; B0 modified no; Gaby modified no.
