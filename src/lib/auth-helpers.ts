import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Returns the authenticated user's ID from the current request context.
 * Returns null in test environments (VITEST=true) where no request context exists.
 * Throws "Unauthorized" if called in a real request with no valid session.
 */
export async function requireUserId(): Promise<string | null> {
  if (process.env.VITEST) return null;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session.user.id;
}
