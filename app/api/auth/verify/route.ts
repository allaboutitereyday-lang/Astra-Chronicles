import { NextResponse } from "next/server";
import { validateUserKey } from "@/lib/userAccess";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { accessKey } = await req.json();

    const result = validateUserKey(accessKey);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error, user: result.user },
        { status: result.user?.remainingTurns === 0 ? 403 : 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      user: result.user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, error: error.message || "Failed to verify key." },
      { status: 500 }
    );
  }
}
