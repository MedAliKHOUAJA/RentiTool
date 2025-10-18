
import { GetToolsUseCase } from "@/features/tools/application/get-tools.use-case";
import { PostgresToolRepository } from "@/features/tools/infrastructure/postgres-tool.repository";
import { ToolPresenter } from "@/features/tools/presentation/tool.presenter";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get("limit");

    const toolRepository = new PostgresToolRepository();
    const getToolsUseCase = new GetToolsUseCase(toolRepository);

    const tools = await getToolsUseCase.execute(limit ? parseInt(limit) : undefined);

    const presentedTools = tools.map(ToolPresenter.toToolDataType);

    return NextResponse.json(presentedTools);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
}
