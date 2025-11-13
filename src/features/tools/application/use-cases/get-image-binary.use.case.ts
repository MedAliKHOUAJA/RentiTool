import { ToolRepository } from "../../domain/tool.repository";

export class GetImageBinaryUseCase {
  constructor(private readonly toolRepository: ToolRepository) {}

  async execute(imageId: string): Promise<Buffer | null> {
    return this.toolRepository.findImageBinaryById(imageId);
  }
}