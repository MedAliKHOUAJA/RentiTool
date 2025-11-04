import { Tool } from "@/features/tools/domain/tool";
import { ToolRepository } from "@/features/tools/domain/tool.repository";
import { ToolFilters } from "@/features/tools/domain/tool.types";

export class GetUserToolsUseCase {
  constructor(private readonly toolRepository: ToolRepository) {}

  async execute(userId: string, filters?: Omit<ToolFilters, 'ownerId'>): Promise<Tool[]> {
    return this.toolRepository.findByFilters({
      ...filters,
      ownerId: userId,
    });
  }
}