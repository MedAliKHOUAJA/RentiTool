import { ToolRepository } from "../../domain/tool.repository";
import { ImageDto } from "../../domain/image";

export class GetToolImagesUseCase {
  constructor(private readonly toolRepository: ToolRepository) {}

  async execute(toolId: string): Promise<ImageDto[]> {
    return this.toolRepository.findImagesByToolId(toolId);
  }
}