# Exclusion of Prior Synthetic R4/R5 Evidence

This file freezes prior synthetic/material-support artifacts for the R4/R5 physical closeout.

Excluded from the nine-proof physical verifier:

- `scripts/eve/official-control-panel/r4/generate-r4-r5-material-support.mjs`
- Synthetic `domSnapshot()` output produced by that material-support flow
- Synthetic `writeSecurityArtifacts()` output produced by that material-support flow
- Declarative `writeA11yInventory()` output produced by that material-support flow
- `dbEvidence()` output built from booleans rather than live database readback
- `reports/local/rector-r4-r5-final/`

The accepted evidence root for the new closeout is:

- `reports/local/rector-r4-r5-physical/`

The strict verifier must read only primary evidence emitted by the nine physical proofs:

- `CP-002-X-WITHOUT-Y`
- `CP-002-Y-WITHOUT-X`
- `CP-006-PHYSICAL`
- `CP-012-PHYSICAL`
- `SEC-001-PHYSICAL`
- `A11Y-001-PHYSICAL`
- `R5-Q1-PHYSICAL`
- `R5-Q2-PHYSICAL`
- `R5-Q3-PHYSICAL`
- `R5-Q4-PHYSICAL`

No prior synthetic artifact is valid as a substitute for DOM captured by Playwright, HTTP transcripts captured from real requests, live database before/after readback, screenshots, hashes, or the live migration head.
