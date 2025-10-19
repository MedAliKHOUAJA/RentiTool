
import { DEMO_TOOL_LISTINGS } from "@/data/listings";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const tool = DEMO_TOOL_LISTINGS.find((tool) => tool.id === id);

  if (tool) {
    return NextResponse.json(tool);
  } else {
    return new NextResponse("Tool not found", { status: 404 });
  }
}
