import { NextResponse } from "next/server";
import {
  participantContextHttpStatus,
  resolveAuthenticatedParticipantContext,
} from "@/lib/participant-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const context = await resolveAuthenticatedParticipantContext(request);
    return NextResponse.json(context, {
      status: participantContextHttpStatus(context),
    });
  } catch {
    return NextResponse.json(
      {
        status: "no_context",
        reason: "participant_context_unavailable",
      },
      { status: 500 },
    );
  }
}
