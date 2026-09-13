import { NextResponse } from "next/server";
import { getDailyReadings, getMonthlyReadings } from "@/lib/api";

/**
 * Series for one system, for the Monitoring workspace's system switcher.
 *
 * The workspace is a client component and can't hold the API token, so it hops
 * through here — this route runs on the server, where the seam and its
 * credential live.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ systemId: string }> },
) {
  const { systemId } = await params;
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? 60);
  const months = Number(searchParams.get("months") ?? 12);

  try {
    const [daily, monthly] = await Promise.all([
      getDailyReadings(systemId, days),
      getMonthlyReadings(systemId, months),
    ]);

    return NextResponse.json({ daily, monthly });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load the series." },
      { status: 502 },
    );
  }
}
