import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({
      ok: true,
      service: "eve-platform",
      supabaseConfigured: false,
      databaseReachable: false,
    });
  }

  const { data, error } = await supabaseServer
    .from("versiones_herramienta")
    .select("numero_version, activa")
    .eq("activa", true)
    .limit(1);

  return NextResponse.json({
    ok: !error,
    service: "eve-platform",
    supabaseConfigured: isSupabaseConfigured,
    databaseReachable: !error,
    activeVersion: data?.[0]?.numero_version ?? null,
    error: error?.message ?? null,
  });
}
