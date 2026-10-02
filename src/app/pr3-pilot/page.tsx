import { Pr3CleanAuthGate } from "@/components/Pr3CleanAuthGate";

export const dynamic = "force-dynamic";

export default function Pr3PilotPage() {
  const enabled = process.env.NEXT_PUBLIC_EVE_PR3_PILOT_ENABLED === "true";
  const scopeRef = process.env.EVE_PR3_PILOT_SCOPE_REF ?? "";
  const activityRef = process.env.EVE_PR3_PILOT_ACTIVITY_REF ?? "";
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <header className="border-b border-zinc-200 px-6 py-5">
        <div className="mx-auto max-w-5xl text-xl font-semibold">EVE PR3</div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-10">
        {enabled && scopeRef && activityRef ? (
          <Pr3CleanAuthGate scopeRef={scopeRef} activityRef={activityRef} />
        ) : (
          <p role="status">El acceso al piloto permanece cerrado.</p>
        )}
      </div>
    </main>
  );
}
