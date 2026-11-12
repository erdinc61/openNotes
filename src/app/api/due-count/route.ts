import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDueCount } from "@/lib/due";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ count: 0 }, { status: 401 });
  }
  const count = await getDueCount(session.user.id);
  return NextResponse.json({ count });
}
