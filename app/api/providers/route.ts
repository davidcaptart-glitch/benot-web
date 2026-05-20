import { NextRequest, NextResponse } from "next/server";
import { providersRepo } from "@/lib/db";
import type { ProductType } from "@/lib/types";

/* ══════════════════════════════════════════════════════════════════
   GET  /api/providers   — list all providers
   POST /api/providers   — create a new provider

   Auth: requires x-admin-secret header.
══════════════════════════════════════════════════════════════════ */

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const providers = await providersRepo.all();
  return NextResponse.json({ providers });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    name:                  string;
    email:                 string;
    supportedProductTypes: ProductType[];
    feePercent:            number;
    active?:               boolean;
  };

  if (!body.name || !body.email || !Array.isArray(body.supportedProductTypes)) {
    return NextResponse.json(
      { error: "Required: name, email, supportedProductTypes" },
      { status: 400 }
    );
  }

  const provider = await providersRepo.create({
    name:                  body.name,
    email:                 body.email,
    supportedProductTypes: body.supportedProductTypes,
    feePercent:            body.feePercent ?? 30,
    active:                body.active ?? true,
  });

  return NextResponse.json({ provider }, { status: 201 });
}
