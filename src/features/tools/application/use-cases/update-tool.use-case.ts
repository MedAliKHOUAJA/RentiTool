import { Tool } from "@/features/tools/domain/tool";
import { ToolRepository } from "@/features/tools/domain/tool.repository";
import { ToolFormData } from "@/features/tools/domain/tool.types";

export class UpdateToolUseCase {
  constructor(private readonly toolRepository: ToolRepository) {}

  async execute(id: string, data: Partial<ToolFormData>): Promise<Tool> {
    const existing = await this.toolRepository.findById(id);
    
    if (!existing) {
      throw new Error("Tool not found");
    }

    return this.toolRepository.update(id, data);
  }
}