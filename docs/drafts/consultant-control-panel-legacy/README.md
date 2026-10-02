# Consultant Control Panel Legacy

Estado: Borrador no oficial.

Este módulo se conserva como referencia histórica.

No es fuente oficial para:
- arquitectura del panel;
- modelo de monitoreo;
- jerarquía de observación;
- distribución de vistas;
- lógica de negocio;
- experiencia de usuario.

No continuar desarrollo funcional sobre este módulo.

Solo pueden evaluarse para reutilización:
- theme MUI;
- auth guard;
- layout genérico;
- cliente BFF;
- utilidades;
- componentes visuales neutrales.

El nuevo Panel de Control EVE debe construirse en una estructura independiente y bajo un documento canónico distinto.

## Ubicación técnica (histórica)

- Ruta: `/admin/consultant-control-panel`
- Alias: `/consultant/control-panel` → redirect al admin
- UI: `src/components/consultant/control-panel/`
- Servicios: `src/services/eve/consultant-control-panel/`
- Metadata: `legacy-consultant-control-panel-status.ts`
