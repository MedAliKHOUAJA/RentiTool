
import { ToolDetails } from "@/features/tools/domain/tool-details";
import { ToolRepository } from "@/features/tools/domain/tool.repository";

export class GetToolUseCase {
  constructor(private toolRepository: ToolRepository) {}

  async execute(id: string): Promise<ToolDetails | null> {
    return this.toolRepository.findById(id);
  }
}
