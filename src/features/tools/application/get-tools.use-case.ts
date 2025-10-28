
import { Tool } from "@/features/tools/domain/tool";
import { ToolRepository } from "@/features/tools/domain/tool.repository";

export class GetToolsUseCase {
  constructor(private readonly toolRepository: ToolRepository) {}

  execute(limit?: number): Promise<Tool[]> {
    return this.toolRepository.findAll(limit);
  }
}
