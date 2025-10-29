import { GetToolsUseCase } from "@/features/tools/application/get-tools.use-case";
import { PostgresToolRepository } from "@/features/tools/infrastructure/postgres-tool.repository";
import { NextRequest, NextResponse } from "next/server";
import { Tool } from "@/features/tools/domain/tool";
import { ToolDataType } from "@/features/tools/presentation/tool.dto";
import { AuthorType } from "@/data/types";
import { CreateToolUseCase } from "@/features/tools/application/create-tool.use-case";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get("limit");

    const toolRepository = new PostgresToolRepository();
    const getToolsUseCase = new GetToolsUseCase(toolRepository);

    const tools: Tool[] = await getToolsUseCase.execute(limit ? parseInt(limit) : undefined);

    const toolsForClient: ToolDataType[] = tools.map((tool) => {
      const author: AuthorType = {
        id: tool.owner.userId,
        firstName: tool.owner.firstName,
        lastName: tool.owner.lastName,
        displayName: `${tool.owner.firstName} ${tool.owner.lastName}`,
        avatar: "", 
        href: `/author?id=${tool.owner.userId}`,
        count: 0,
        desc: "",
        jobName: "",
        
      };

      return {
        id: tool.toolId,
        author,
        date: "", // Placeholder
        href: tool.href,
        title: tool.title,
        featuredImage: "",
        featuredImageBinary: tool.image?.imageBinary,
        commentCount: 0,
        viewCount: 0,
        address: tool.owner.locationName || "",
        reviewStart: 0,
        reviewCount: 0,
        like: false,
        price: `${tool.rentalPricePerDay}€`,
        listingCategory: {
          id: tool.categoryId,
          name: "Category",
          href: "/",
          taxonomy: "category",
        },
        map: { lat: 0, lng: 0 },
      };
    });

    return NextResponse.json(toolsForClient);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      categoryId,
      subCategoryId,
      brand,
      model,
      rentalPricePerDay,
      rentalPricePerWeek,
      isActive,
      statusId,
      ownerId,
    } = body;

    if (!title || !ownerId) {
      return NextResponse.json({ error: "Title and ownerId are required" }, { status: 400 });
    }

    const toolRepository = new PostgresToolRepository();
    const createToolUseCase = new CreateToolUseCase(toolRepository);

    const newTool = await createToolUseCase.execute({
      title,
      description,
      categoryId,
      subCategoryId,
      brand,
      model,
      rentalPricePerDay,
      rentalPricePerWeek,
      isActive,
      statusId,
      ownerId,
    });

    return NextResponse.json(newTool, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create tool' }, { status: 500 });
  }
}
