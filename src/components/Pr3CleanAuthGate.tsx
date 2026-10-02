"use client";

import { createClient, type Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pr3PilotRuntimeRunner } from "./Pr3PilotRuntimeRunner";
import { PR3_PROJECT_REF, PR3_SUPABASE_URL } from "@/services/eve/pr3/target";

export function Pr3CleanAuthGate({ scopeRef, activityRef }: { scopeRef: string; activityRef: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_EVE_PR3_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_EVE_PR3_SUPABASE_PUBLISHABLE_KEY;
    if (url !== PR3_SUPABASE_URL || !key?.startsWith("sb_publishable_")) return null;
    return createClient(url, key, { auth: { storageKey: `eve-pr3-${PR3_PROJECT_REF}-auth` } });
  }, []);

  useEffect(() => {
    if (!client) return;
    const { data } = client.auth.onAuthStateChange((_event, current) => setSession(current));
    return () => data.subscription.unsubscribe();
  }, [client]);

  const scope = useMemo(() => ({ scopeRef, activityRef, principalRef: session?.user.id }), [scopeRef, activityRef, session?.user.id]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setMessage("No se pudo iniciar sesi\u00f3n con esas credenciales.");
      setPassword("");
    } catch { setMessage("El acceso no est\u00e1 disponible en este momento."); }
    finally { setBusy(false); }
  }

  async function signOut() {
    if (!client || busy) return;
    setBusy(true);
    try {
      const { error } = await client.auth.signOut();
      if (error) setMessage("No se pudo cerrar la sesi\u00f3n. Reintenta.");
    } catch { setMessage("No se pudo cerrar la sesi\u00f3n. Reintenta."); }
    finally { setBusy(false); }
  }

  if (!client) return <p role="status">{"El acceso no est\u00e1 disponible en este momento."}</p>;
  if (session) return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <span className="break-all text-sm">{session.user.email}</span>
        <button className="rounded border border-zinc-300 px-4 py-2 text-sm" disabled={busy} onClick={() => void signOut()}>{"Cerrar sesi\u00f3n"}</button>
      </div>
      {message && <p className="mb-4 text-sm text-red-700" role="alert">{message}</p>}
      <Pr3PilotRuntimeRunner key={session.user.id} scope={scope} accessToken={session.access_token} />
    </>
  );
  return (
    <form onSubmit={signIn} className="mx-auto grid max-w-sm gap-5">
      <h1 className="text-2xl font-semibold">{"Iniciar sesi\u00f3n"}</h1>
      <label className="grid gap-2 text-sm">{"Correo electr\u00f3nico"}
        <input className="min-w-0 rounded border border-zinc-300 px-3 py-2" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm">{"Contrase\u00f1a"}
        <input className="min-w-0 rounded border border-zinc-300 px-3 py-2" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
      </label>
      {message && <p className="text-sm text-red-700" role="alert">{message}</p>}
      <button className="rounded bg-zinc-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50" type="submit" disabled={busy}>{busy ? "Ingresando..." : "Ingresar"}</button>
    </form>
  );
}
