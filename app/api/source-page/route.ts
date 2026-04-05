import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ReqBody = {
  pdfUrl?: string;
  pageNumber?: number;
};

function normalizePdfUrl(raw: string) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    return url.toString();
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ReqBody;

    const pdfUrl = normalizePdfUrl(body.pdfUrl || "");
    const pageNumber = Number(body.pageNumber || 0);

    if (!pdfUrl) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid pdfUrl" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(pageNumber) || pageNumber < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid pageNumber" },
        { status: 400 }
      );
    }

    const previewUrl = `${pdfUrl}#page=${pageNumber}&view=FitH`;

    return NextResponse.json({
      success: true,
      pdfUrl,
      pageNumber,
      previewUrl,
    });
  } catch (e: any) {
    console.error("source-page route error:", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to build source page URL" },
      { status: 500 }
    );
  }
}