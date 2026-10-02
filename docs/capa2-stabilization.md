# Principios de calibración de Capa 2

## Propósito
La calibración de la Capa 2 no existe para forzar que el motor entregue el nodo “esperado” por el consultor o por el diseñador del sistema.

Su propósito es mejorar la capacidad del motor para:
- discriminar entre hipótesis causales rivales;
- detectar bundles de evidencia demasiado amplios;
- identificar dominancia artificial de nodos;
- declarar incertidumbre cuando corresponde;
- y mantener trazabilidad entre evidencia, regla activada, nodo y narrativa preliminar.

## Regla epistemológica central
**Calibrar no es perseguir el resultado deseado.**
**Calibrar es mejorar la capacidad de discriminación del motor.**

## Qué sí se puede ajustar
- umbrales de activación de reglas;
- separación entre evidencia primaria y apoyo inferencial;
- pesos relativos de bundles;
- reason codes de reentrada y revisión experta;
- condiciones de confianza;
- criterios de dominancia de raíz;
- pruebas de sensibilidad, ablación y discriminación.

## Qué no se debe hacer
- bajar un nodo solo porque “sale demasiado”;
- subir un nodo solo porque “se parece más al caso” según intuición;
- usar calibración para hacer que el resultado coincida con una expectativa previa;
- borrar la incertidumbre del sistema para forzar diagnósticos limpios.

## Pruebas obligatorias de estabilización
Antes de ampliar nodos o pasar a una capa de agregación cliente, Capa 2 por sesión debe demostrar:

1. Pruebas de sensibilidad:
   - qué señales empujan más cada nodo;
   - qué pasa si se modifica su peso.

2. Pruebas de ablación:
   - qué ocurre si se remueven temporalmente ciertos grupos de evidencia.

3. Pruebas de discriminación:
   - que el motor puede distinguir entre nodos rivales y no colapsa siempre en el mismo.

4. Pruebas de contradicción:
   - que el motor puede declarar `needs_reentry` o `needs_expert_review` cuando corresponde.

## Regla sobre Bloque 7
Las inferencias ligeras de Bloque 7 nunca sustituyen la evidencia estructural de Bloques 0.5 a 6.
Pueden servir como apoyo secundario, desempate o prior suave, pero no como fuente principal de activación causal.

## Condición para pasar a Capa 2.5
No se debe diseñar la agregación causal por cliente hasta que la Capa 2 por sesión haya demostrado estabilidad suficiente en:
- discriminación entre nodos,
- manejo de incertidumbre,
- explicabilidad de confianza,
- y no-dominancia artificial.