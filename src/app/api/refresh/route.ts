import { startRefresh } from "@/lib/collector";

export const dynamic = "force-dynamic";

export async function POST() {
  const job = startRefresh();
  return Response.json({ job });
}
