import { test, expect } from "@playwright/test";

const FORBIDDEN_VISIBLE_PATTERNS = [
  /\bMMABP\b/i,
  /\bVSM\b/i,
  /\bAHE\b/i,
  /\bGate\b/,
  /\bChip\b/,
  /Runtime table/i,
  /Object Inventory/i,
  /Integration Membrane/i,
  /Soft Governance/i,
  /canonical_variable_record/i,
  /runtime_interaction_instance/i,
  /readiness_gap_record/i,
  /readiness_decision_record/i,
  /\bregistry\b/i,
  /\bIR\b/,
  /export payload/i,
  /diagn[oó]stico final/i,
  /patolog[ií]a/i,
  /Capa 1/i,
  /transducci[oó]n causal/i,
  /readiness_state/i,
  /expediente estructural/i,
  /\bWorkMap\b/,
];

async function assertNoInternalLeakage(page: import("@playwright/test").Page) {
  const bodyText = await page.locator("body").innerText();
  for (const pattern of FORBIDDEN_VISIBLE_PATTERNS) {
    expect(bodyText).not.toMatch(pattern);
  }
}

test.describe("EVE client final UI local QA", () => {
  test("Estado A — login / acceso visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Acceso a la plataforma|Crear cuenta/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear cuenta" })).toBeVisible();
    await assertNoInternalLeakage(page);
  });

  test("Estado B — sesión activa preview", async ({ page }) => {
    await page.goto("/?preview=estado-b");
    await expect(page.getByText(/Levantamiento en curso|continuar/i).first()).toBeVisible();
    await expect(page.getByText(/Preguntas principales|progreso/i).first()).toBeVisible();
    await assertNoInternalLeakage(page);
  });

  test("Estado A — modo demo accesible sin diagnóstico final", async ({ page }) => {
    await page.goto("/");
    const demoButton = page.getByRole("button", { name: /demo/i });
    await expect(demoButton).toBeVisible();
    await assertNoInternalLeakage(page);
    expect(await page.getByText(/diagn[oó]stico final/i).count()).toBe(0);
  });
});
