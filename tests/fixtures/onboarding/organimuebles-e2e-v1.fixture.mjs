export const organimueblesFixture = {
  fixture: "organimuebles-e2e-v1",
  source: "Operacion_Actual_Organimuebles_Espacios_EVE_Etapas_1_y_2 Final.docx",
  projectRef: "shrpiwkxcdgvbqymjecx",
  ids: {
    empresa: "a1111111-0000-4000-8000-000000000001",
    sponsorUsuario: "a1111111-0000-4000-8000-000000000002",
    clientRelationship: "a1111111-0000-4000-8000-000000000003",
    version: "a1111111-0000-4000-8000-000000000004",
    case: "a1111111-0000-4000-8000-000000000005",
  },
  company: {
    nombre: "Organimuebles + Espacios Contemporaneos",
    displayName: "Organimuebles",
    sector: "Mobiliario, diseno, fabricacion y distribucion",
    status: "active",
  },
  engagement: {
    displayName: "Diagnostico EVE - Operacion actual Organimuebles",
    status: "enabled",
    initialNeed:
      "Comprender como avanza un pedido desde la oportunidad comercial hasta la entrega o instalacion, incluyendo diseno, compras, fabricacion, administracion, bodega y logistica.",
    scope: "Operacion AS-IS documentada en Etapas 1 y 2.",
  },
  case: {
    displayName: "Caso E2E Organimuebles - Pedido mixto",
    initialStatus: "capa_1_triple",
  },
  sponsor: {
    nombre: "Sponsor Organimuebles",
    email: "sponsor.organimuebles@example.test",
    status: "active",
    isPrimary: true,
  },
  seedOperator: {
    email: "c1-seed-organimuebles-operator@example.invalid",
  },
  invitation: {
    expiresInDays: 7,
    metadata: {
      fixture: "organimuebles-e2e-v1",
      source: "Operacion_Actual_Organimuebles_Espacios_EVE_Etapas_1_y_2 Final.docx",
      test_only: true,
    },
  },
  participants: [
    {
      name: "Adriana Chavez",
      email: "adriana.chavez@example.test",
      profiles: ["Jefa Administrativa"],
    },
    {
      name: "Karen Rodriguez",
      email: "karen.rodriguez@example.test",
      profiles: ["Analista Administrativa Sr. - Tesoreria y Cuentas por Cobrar"],
    },
    {
      name: "Katia Hernandez",
      email: "katia.hernandez@example.test",
      profiles: ["Analista Administrativa Sr. - Facturacion, Cuentas por Pagar y Nomina"],
    },
    {
      name: "Iliana de Leon",
      email: "iliana.deleon@example.test",
      profiles: [
        "Jefatura funcional de Compras y Abastecimiento",
        "Coordinacion funcional de Logistica, Entrega e Instalacion",
      ],
    },
    {
      name: "Francisco",
      email: "francisco@example.test",
      profiles: ["Gerente Comercial"],
    },
    {
      name: "Gaby Johnson",
      email: "gaby.johnson@example.test",
      profiles: ["Ejecutiva Comercial"],
    },
    {
      name: "Lucas Edgecombe",
      email: "lucas.edgecombe@example.test",
      profiles: ["Disenador Comercial"],
    },
    {
      name: "Andrea Perez",
      email: "andrea.perez@example.test",
      profiles: ["Disenadora Comercial"],
    },
    {
      name: "Ramiro",
      email: "ramiro@example.test",
      profiles: ["Gerente de Produccion"],
    },
    {
      name: "Isai",
      email: "isai@example.test",
      profiles: ["Jefe de Corte"],
    },
    {
      name: "Alfredo",
      email: "alfredo@example.test",
      profiles: [
        "Administracion y Control de Ordenes de Produccion",
        "Compras y Abastecimiento para Produccion",
      ],
    },
    {
      name: "Adan",
      email: "adan@example.test",
      profiles: ["Instalador y Responsable de Cuadrilla de Produccion"],
    },
    {
      name: "Carlos",
      email: "carlos@example.test",
      profiles: ["Instalador y Chofer de Logistica"],
    },
  ],
};
