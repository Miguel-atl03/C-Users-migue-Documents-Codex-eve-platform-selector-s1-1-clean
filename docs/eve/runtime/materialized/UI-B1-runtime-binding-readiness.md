# UI-B1 runtime binding readiness

Structure ready; **no Runtime connection** in this wave.

| capability | status |
|---|---|
| field_key (= Madre source_code) | yes |
| optional slot_ref passthrough attrs (`data-slot-ref`) | yes (Instrumento controls + question sections) |
| answers map + onChange patch | yes |
| options / help / required on slots | yes |
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

Canonical UI shell: `OfficialCanvasB1InstrumentSection`.  
Next authorized wave: **`045-R3A-X4-1`** (only after user integration confirmation + X4 instruction).
