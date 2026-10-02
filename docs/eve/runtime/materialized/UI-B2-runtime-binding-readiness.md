# UI-B2 runtime binding readiness

Structure ready; **no Runtime connection** in this wave.

| capability | status |
|---|---|
| field_key (= Madre source_code) | yes |
| optional slot_ref passthrough attrs | yes |
| answers map + onChange patch | yes |
| options / help / required on slots | yes |
| ranking via rankedIds | yes |
| onContinue callback (no next sequencer) | yes |
| Renderer connected | **false** |
| live InteractionViewModel | **false** |
| BFF submit / ingest | **false** |
| branching / next interaction | **false** |

Flags:

```json
{
  "renderer_connected": false,
  "interaction_view_model_live": false,
  "slot_ref_server_issued": false,
  "bff_submit": false,
  "local_sequence_authority": false,
  "fixture_authority": false,
  "functional_conformance": "pending"
}
```

Next authorized wave: **`045-R3A-X4-2`** (only after user instruction).  
B1 integration remains deferred (lienzo en reparación).
