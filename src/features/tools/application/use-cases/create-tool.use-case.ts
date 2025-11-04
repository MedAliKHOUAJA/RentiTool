import { Tool } from "@/features/tools/domain/tool";
import { ToolRepository } from "@/features/tools/domain/tool.repository";
import { ToolFormData } from "@/features/tools/domain/tool.types";

export class CreateToolUseCase {
  constructor(private readonly toolRepository: ToolRepository) {}

  async execute(data: ToolFormData): Promise<Tool> {
    // Validation
    if (!data.title?.trim()) {
      throw new Error("Title is required");
    }

    if (!data.ownerId) {
      throw new Error("Owner ID is required");
    }

    // Création
    return this.toolRepository.create(data);
  }
}