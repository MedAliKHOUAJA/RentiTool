import { ToolRepository } from "../../domain/tool.repository";

interface SetPrimaryImageRequest {
  imageId: string;
  toolId: string;
  userId: string;
  ownerId: string;
}

export class SetPrimaryImageUseCase {
  constructor(private readonly toolRepository: ToolRepository) {}

  async execute(request: SetPrimaryImageRequest): Promise<void> {
    const { imageId, toolId, userId, ownerId } = request;

    // Vérifier la propriété
    if (userId !== ownerId) {
      throw new Error('You do not own this tool');
    }

    // Vérifier que l'image appartient à l'outil
    const isValid = await this.toolRepository.verifyImageOwnership(imageId, toolId);
    if (!isValid) {
      throw new Error('Image not found');
    }

    await this.toolRepository.setPrimaryImage(imageId, toolId);
  }
}