import { ImageDto } from '../../domain/image';
import { ToolRepository } from '../../domain/tool.repository';

interface UploadImageRequest {
  file: Buffer;
  toolId: string;
  userId: string;
  ownerId: string;
}

export class UploadToolImageUseCase {
  constructor(private readonly toolRepository: ToolRepository) {}

  async execute(request: UploadImageRequest): Promise<ImageDto> {
    const { file, toolId, userId, ownerId } = request;

    // Vérifier la propriété
    if (userId !== ownerId) {
      throw new Error('You do not own this tool');
    }

    return this.toolRepository.createImage(toolId, userId, file);
  }
}