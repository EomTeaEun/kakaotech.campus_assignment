import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const BACKEND_URL = process.env.BACKEND_URL;
if (!BACKEND_URL) {
  throw new Error("BACKEND_URL is not set. Check frontend/.env.local");
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.search;
  const res = await fetch(`${BACKEND_URL}/todos${query}`, { cache: "no-store" });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${BACKEND_URL}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (res.ok) {
    revalidatePath("/todos");
  }
  return NextResponse.json(data, { status: res.status });
}
