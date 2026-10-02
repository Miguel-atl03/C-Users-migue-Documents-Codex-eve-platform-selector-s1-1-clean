# Runtime Manifest Promotion Policy

Baseline promoted manifest: `1.0.0`

Promotion requires:

1. `npm run validate:manifest` passes.
2. `npm run test:e2e-runtime-contract` passes against the live Supabase schema.
3. `npm run audit:runtime-observability` passes with the post-baseline window.
4. `npm run test:runtime-vsm` passes.
5. `npm run audit:runtime-vsm` does not emit critical algedonic events.

Freeze criteria:

- manifest hash drift
- contract validation failure
- active local catalog reference
- confidence outside 0-100
- readiness/confidence collapse
- diagnostic boundary breach

Rollback criteria:

- S3* confirms critical semantic drift in post-baseline sessions
- promoted manifest is incompatible with `CAPA1_V2_1_RUNTIME_CONSUMER`
- runtime produces intermediate outputs that violate `consolidated_output != Capa 2`

No promotion may trade semantic fidelity for speed.