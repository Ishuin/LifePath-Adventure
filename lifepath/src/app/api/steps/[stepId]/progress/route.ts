import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setStepStatus } from "@/lib/plan/progress";

export const runtime = "nodejs";

const bodySchema = z.object({
  status: z.enum(["locked", "available", "in_progress", "done", "skipped"]),
});

/**
 * PATCH /api/steps/[stepId]/progress — transition a step the caller owns. The
 * `set_step_status` RPC does the ledger bookkeeping, dependent unlocking, and
 * level recompute; ownership is enforced there and by RLS.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ stepId: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { stepId } = await params;
  if (!z.string().uuid().safeParse(stepId).success) {
    return NextResponse.json({ error: "Invalid step id." }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Expected { status: step_status }." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  try {
    const result = await setStepStatus(supabase, stepId, parsed.data.status);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
