# Gate 3 Restricted Start Preconditions

## Dictamen
GATE_3_RESTRICTED_INTERNAL_SUPERVISED_ACTIVATION_READY_TO_PLAN

## Permitido en Gate 3 restringido
- activar capacidades internas supervisadas en modo controlado;
- usar fixtures, local, dry-run o fuentes supervisadas;
- probar captura real si no genera writes irreversibles;
- probar runtime real bajo supervision;
- generar candidate outputs marcados como draft/candidate;
- exigir revision humana S3*.

## Prohibido
- writes irreversibles;
- registry final;
- export final;
- diagnosis final;
- Produccion Paralela real;
- Fase 9 piloto cliente;
- Gate 4;
- Gate 5;
- ocultar G2-RISK-001.

## Carry-forward desde Gate 2
G2-RISK-001 queda abierto:
no hubo eventos reales shadow por falta de target no productivo.

## Next step
PLAN_GATE_3_RESTRICTED_INTERNAL_SUPERVISED_ACTIVATION_V1
