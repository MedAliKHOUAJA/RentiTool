import { NextRequest, NextResponse } from "next/server";
import { PostgresToolRepository } from "@/features/tools/infrastructure/postgres-tool.repository";
import { GetToolUseCase } from "@/features/tools/application/get-tool.use-case";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Tool ID is required" }, { status: 400 });
    }

    const toolRepository = new PostgresToolRepository();
    const getToolUseCase = new GetToolUseCase(toolRepository);

    const toolDetails = await getToolUseCase.execute(id);

    if (!toolDetails) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    return NextResponse.json(toolDetails);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch tool" }, { status: 500 });
  }
}