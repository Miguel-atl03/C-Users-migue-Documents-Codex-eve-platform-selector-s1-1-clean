import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Audit route disabled." }, { status: 404 });
}
