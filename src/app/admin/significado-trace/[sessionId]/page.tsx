import { SignificadoConsultantTraceView } from "@/components/consultant/SignificadoConsultantTraceView";
import { buildSignificadoConsultantTrace } from "@/services/significado-consultant-trace";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function SignificadoTraceSessionPage({ params }: PageProps) {
  const { sessionId } = await params;
  const trace = await buildSignificadoConsultantTrace(sessionId);

  return <SignificadoConsultantTraceView trace={trace} />;
}
