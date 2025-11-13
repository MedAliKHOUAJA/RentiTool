import { ImageDto } from "./image";
import { Tool } from "./tool";
import { ToolDetails } from "./tool-details";
import { ToolFilters, ToolFormData } from "./tool.types";

export interface ToolRepository {
  // Lecture 
  findAll(limit?: number): Promise<Tool[]>;
  findById(id: string): Promise<ToolDetails | null>;
  findByOwnerId(ownerId: string):Promise<Tool[]>;
  // Lecture avec filtres
  findByFilters(filters: ToolFilters): Promise<Tool[]>;
  
  // Écriture 
  create(data: ToolFormData): Promise<Tool>;
  update(id: string, data: Partial<ToolFormData>): Promise<Tool>;
  delete(id: string): Promise<boolean>;
  
  // Images 
  findImagesByToolId(toolId: string): Promise<ImageDto[]>;
  findImageBinaryById(imageId: string): Promise<Buffer | null>;
  createImage(toolId: string, userId: string, imageBinary: Buffer): Promise<ImageDto>;
  deleteImage(imageId: string, toolId: string): Promise<void>;
  setPrimaryImage(imageId: string, toolId: string): Promise<void>;
  verifyImageOwnership(imageId: string, toolId: string): Promise<boolean>;
}