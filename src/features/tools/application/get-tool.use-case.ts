import { ToolDetails } from "@/features/tools/domain/tool-details";
import { ToolRepository } from "@/features/tools/domain/tool.repository";

export class GetToolUseCase {
  constructor(private readonly toolRepository: ToolRepository) {}

  execute(id: string): Promise<ToolDetails | null> {
    return this.toolRepository.findById(id);
  }
}