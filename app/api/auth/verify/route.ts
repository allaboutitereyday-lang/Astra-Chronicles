import { NextResponse } from "next/server";
import { validateUserKey } from "@/lib/userAccess";

export const dynamic = "force-static";
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Key parameter required" }, { status: 400 });
    }

    const result = validateUserKey(key);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, error: error.message || "Verification failed." },
      { status: 500 }
    );
  }
}
