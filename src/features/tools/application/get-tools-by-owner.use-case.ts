// src/features/tools/application/get-tools-by-owner.use-case.ts
import { Tool } from "@/features/tools/domain/tool";
import { ToolRepository } from "@/features/tools/domain/tool.repository";

export class GetToolsByOwnerUseCase {
  constructor(private readonly toolRepository: ToolRepository) {}

  execute(ownerId: string): Promise<Tool[]> {
    return this.toolRepository.findByOwnerId(ownerId);
  }
}
