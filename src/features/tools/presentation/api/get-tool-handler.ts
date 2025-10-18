
import { GetToolUseCase } from "@/features/tools/application/get-tool.use-case";
import { PostgresToolRepository } from "@/features/tools/infrastructure/postgres-tool.repository";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const toolRepository = new PostgresToolRepository();
    const getToolUseCase = new GetToolUseCase(toolRepository);

    const toolDetails = await getToolUseCase.execute(id);

    if (!toolDetails) {
      return new NextResponse("Tool not found", { status: 404 });
    }

    return NextResponse.json(toolDetails);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch tool' }, { status: 500 });
  }
}
