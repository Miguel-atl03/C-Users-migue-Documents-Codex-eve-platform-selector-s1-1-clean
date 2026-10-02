# Runtime to scene_* Projection Contract 045-R2C

Status: blocked before implementation

Runtime 40/20 remains the authoritative capture source. scene_* can only be a compatibility projection target for Capa 1 consumers. The allowed path is Runtime commit first, then membrane projection.

The material mapping is not yet sufficient: Runtime persistence currently writes scene_id as null, and there is no committed projection event that carries scene question identity, response revision, source slots, provenance and retry state. Therefore any projection to scene_question_answers would require invented binding or text/position matching, both forbidden.