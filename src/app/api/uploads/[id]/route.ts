import { db } from "@/db";
import { upload } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const row = await db.query.upload.findFirst({
    where: eq(upload.id, id),
    columns: { data: true, mimeType: true },
  });

  if (!row) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
