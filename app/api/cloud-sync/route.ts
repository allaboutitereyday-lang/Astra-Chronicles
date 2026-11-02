import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

interface StoredAccount {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}

interface StoredCloudBundle {
  userId: string;
  email?: string;
  updatedAt: string;
  bundle: any;
}

const CLOUD_DIR = path.join(process.cwd(), "data", "cloud_saves");
const ACCOUNTS_FILE = path.join(CLOUD_DIR, "accounts.json");

// In-memory fallback for environments where disk writes are restricted
const memoryAccounts: Record<string, StoredAccount> = {};
const memoryBundles: Record<string, StoredCloudBundle> = {};

function ensureDir() {
  try {
    if (!fs.existsSync(CLOUD_DIR)) {
      fs.mkdirSync(CLOUD_DIR, { recursive: true });
    }
  } catch {}
}

function hashPassword(email: string, password: string): string {
  return crypto
    .createHash("sha256")
    .update(`astra_salt_v1:${email.toLowerCase().trim()}:${password}`)
    .digest("hex");
}

function sanitizeUserId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
}

function loadAccounts(): Record<string, StoredAccount> {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, "utf-8"));
      return { ...parsed, ...memoryAccounts };
    }
  } catch {}
  return { ...memoryAccounts };
}

function saveAccounts(accounts: Record<string, StoredAccount>) {
  Object.assign(memoryAccounts, accounts);
  try {
    ensureDir();
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), "utf-8");
  } catch {}
}

function getBundlePath(userId: string): string {
  return path.join(CLOUD_DIR, `bundle_${sanitizeUserId(userId)}.json`);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter." }, { status: 400 });
    }

    const safeId = sanitizeUserId(userId);
    const filePath = getBundlePath(safeId);

    if (memoryBundles[safeId]) {
      return NextResponse.json({
        found: true,
        updatedAt: memoryBundles[safeId].updatedAt,
        bundle: memoryBundles[safeId].bundle,
      });
    }

    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw) as StoredCloudBundle;
      return NextResponse.json({
        found: true,
        updatedAt: parsed.updatedAt,
        bundle: parsed.bundle,
      });
    }

    return NextResponse.json({
      found: false,
      updatedAt: null,
      bundle: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to read cloud progression." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body?.action;

    if (action === "register" || action === "login") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const displayName = String(body.displayName || email.split("@")[0] || "Traveler").trim();

      if (!email || !email.includes("@")) {
        return NextResponse.json({ error: "Valid email address is required." }, { status: 400 });
      }
      if (!password || password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
      }

      const accounts = loadAccounts();
      const existing = accounts[email];
      const hashed = hashPassword(email, password);

      if (action === "register") {
        if (existing) {
          // If password matches, allow seamless sign-in
          if (existing.passwordHash === hashed) {
            return NextResponse.json({
              user: {
                id: existing.id,
                email: existing.email,
                displayName: existing.displayName,
              },
            });
          }
          return NextResponse.json(
            { error: "An account with this email already exists. Please sign in instead." },
            { status: 409 }
          );
        }

        const id = `usr_${crypto.createHash("md5").update(email).digest("hex").slice(0, 16)}`;
        const newAccount: StoredAccount = {
          id,
          email,
          displayName,
          passwordHash: hashed,
          createdAt: new Date().toISOString(),
        };
        accounts[email] = newAccount;
        saveAccounts(accounts);

        return NextResponse.json({
          user: {
            id: newAccount.id,
            email: newAccount.email,
            displayName: newAccount.displayName,
          },
        });
      }

      // action === "login"
      if (!existing) {
        // Auto-provision on first login if no account exists yet for frictionless onboarding
        const id = `usr_${crypto.createHash("md5").update(email).digest("hex").slice(0, 16)}`;
        const newAccount: StoredAccount = {
          id,
          email,
          displayName,
          passwordHash: hashed,
          createdAt: new Date().toISOString(),
        };
        accounts[email] = newAccount;
        saveAccounts(accounts);
        return NextResponse.json({
          user: {
            id: newAccount.id,
            email: newAccount.email,
            displayName: newAccount.displayName,
          },
        });
      }

      if (existing.passwordHash !== hashed) {
        return NextResponse.json(
          { error: "Incorrect password for this account." },
          { status: 401 }
        );
      }

      return NextResponse.json({
        user: {
          id: existing.id,
          email: existing.email,
          displayName: existing.displayName,
        },
      });
    }

    if (action === "push") {
      const userId = String(body.userId || "").trim();
      const email = String(body.email || "").trim();
      const bundle = body.bundle;

      if (!userId || !bundle) {
        return NextResponse.json(
          { error: "Missing userId or progression bundle." },
          { status: 400 }
        );
      }

      const safeId = sanitizeUserId(userId);
      const updatedAt = new Date().toISOString();
      const record: StoredCloudBundle = {
        userId: safeId,
        email,
        updatedAt,
        bundle,
      };

      memoryBundles[safeId] = record;

      try {
        ensureDir();
        fs.writeFileSync(getBundlePath(safeId), JSON.stringify(record), "utf-8");
      } catch (diskErr) {
        console.warn("Disk write skipped for cloud save (stored in memory):", diskErr);
      }

      return NextResponse.json({
        success: true,
        updatedAt,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Cloud sync server error." },
      { status: 500 }
    );
  }
}

