
import { NextResponse } from "next/server";

// TODO: Implement this API endpoint
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  return NextResponse.json({ message: `Hello from reviews API for id ${id}` });
}
