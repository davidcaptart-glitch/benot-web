import { NextRequest, NextResponse } from "next/server";
import fs   from "fs";
import path from "path";
import { ordersRepo } from "@/lib/db";
import { DATA_DIR }   from "@/lib/db";

/* ══════════════════════════════════════════════════════════════════
   GET /api/admin/orders/[ref]/file/[filename]
   Serves a frozen asset or production PDF for an order.
   Only files that belong to the order's snapshot folder are served.
══════════════════════════════════════════════════════════════════ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ref: string; filename: string }> }
) {
  const { ref, filename } = await params;

  // Auth check via cookie (middleware already protects /admin routes;
  // this API is called from admin pages only)
  const cookie = req.cookies.get("benot_admin")?.value;
  if (!cookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = ordersRepo.findByRef(ref.toUpperCase());
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only serve files from the order's snapshot directory
  const orderFolder = path.join(DATA_DIR, "orders", order.orderRef);
  const filePath    = path.join(orderFolder, filename);

  // Safety: ensure path doesn't escape the order folder
  if (!filePath.startsWith(orderFolder)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const ext    = path.extname(filename).toLowerCase();
  const contentType =
    ext === ".pdf"  ? "application/pdf" :
    ext === ".png"  ? "image/png"       :
    ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
    "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "private, no-store",
    },
  });
}
