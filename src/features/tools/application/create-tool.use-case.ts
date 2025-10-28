import { Tool } from "@/features/tools/domain/tool";
import { ToolRepository } from "@/features/tools/domain/tool.repository";

export class CreateToolUseCase {
  constructor(private readonly toolRepository: ToolRepository) {}

  async execute(
    params: Omit<Tool, 'toolId' | 'href' | 'owner'> & { 
      ownerId: string;
      images?: Buffer[]; 
    }
  ): Promise<Tool> {
    return this.toolRepository.create(params); 
  }
}
