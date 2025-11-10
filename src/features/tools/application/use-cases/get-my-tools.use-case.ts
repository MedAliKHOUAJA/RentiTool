import { Tool } from "../../domain/tool";
import { ToolRepository } from "../../domain/tool.repository";


export class GetMyToolsUseCase {
  constructor(private readonly toolRepository: ToolRepository) {}

  async execute(userId: string): Promise<Tool[]> {
    console.log('📦 [UseCase] GetMyTools pour userId:', userId);
    return this.toolRepository.findByOwnerId(userId);
  }
}