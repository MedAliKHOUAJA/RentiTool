
import { NextRequest, NextResponse } from "next/server";
import { PostgresToolRepository } from "../../infrastructure/postgres-tool.repository";
import { GetToolsUseCase } from "../../application/get-tools.use-case";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get("limit");

    const toolRepository = new PostgresToolRepository();
    const getToolsUseCase = new GetToolsUseCase(toolRepository);

    const tools = await getToolsUseCase.execute(limit ? parseInt(limit) : undefined);

  

    return NextResponse.json(tools);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
}