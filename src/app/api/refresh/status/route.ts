import { getJob } from "@/lib/collector";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ job: getJob() });
}
