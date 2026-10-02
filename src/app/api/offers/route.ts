import { NextResponse } from "next/server";
import { offers } from "@/lib/offers";

export async function GET() {
  return NextResponse.json({ data: offers, source: "local-demo" });
}
