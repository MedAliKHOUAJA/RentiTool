import { DEMO_TOOL_LISTINGS } from "@/data/listings";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(DEMO_TOOL_LISTINGS);
}
