# Supabase PR3 — clean production target

This folder is the source-controlled database baseline for the EVE PR3 B0→B2 production pilot.

## Authoritative target

- Supabase project: `Cadena de produccion - EVE`
- Project ref: `keqrkyumfyhfivllvdbl`
- Region: `us-east-1`
- State plane: `eve_pr3`

## Rules

- The legacy projects `bwflscplkjohdhkiqqoc` and `shrpiwkxcdgvbqymjecx` are not baselines.
- Do not copy schemas, migrations, data, auth state, or catalog rows from legacy projects into PR3.
- Browser roles do not receive direct access to the `eve_pr3` schema.
- Product writes are server-side/BFF only.
- B0/B0.5/B1/B2 semantic contracts are not redefined by database migrations.
- `candidate != evidence`; `proposal != evidence`; `unknown != false`.
- Release, receipt, and consumption remain distinct handoff facts.
- Retry must not duplicate side effects; correction creates revision + supersedes.

## Migration lineage

The files in `migrations/` reproduce the successful PR3 clean-target migration sequence, including:
1. clean state plane;
2. authority seed;
3. security hardening;
4. AI provenance fields/constraints;
5. evaluator authority provenance;
6. B2 evaluator candidate;
7. evaluator source-fidelity fields.

No secrets belong in this repository.
