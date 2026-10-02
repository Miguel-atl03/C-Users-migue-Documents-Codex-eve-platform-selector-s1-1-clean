import { NextResponse } from "next/server";
import { exportActivityCollectionXlsx } from "@/services/export/activity-collection-xlsx";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Falta sessionId para generar el Excel." },
      { status: 400 },
    );
  }

  try {
    const exportResult = await exportActivityCollectionXlsx(sessionId);

    return new Response(Buffer.from(exportResult.bytes), {
      headers: {
        "Content-Type": exportResult.contentType,
        "Content-Disposition": `attachment; filename="${exportResult.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pude generar el Excel del levantamiento.",
      },
      { status: 500 },
    );
  }
}
