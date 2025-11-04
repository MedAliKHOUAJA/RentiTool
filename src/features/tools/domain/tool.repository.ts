import { Tool } from "./tool";
import { ToolDetails } from "./tool-details";
import { ToolFilters, ToolFormData } from "./tool.types";

export interface ToolRepository {
  // Lecture (existant)
  findAll(limit?: number): Promise<Tool[]>;
  findById(id: string): Promise<ToolDetails | null>;
  findByOwnerId(ownerId: string):Promise<Tool[]>;
  // Lecture avec filtres (nouveau)
  findByFilters(filters: ToolFilters): Promise<Tool[]>;
  
  // Écriture (nouveau)
  create(data: ToolFormData): Promise<Tool>;
  update(id: string, data: Partial<ToolFormData>): Promise<Tool>;
  delete(id: string): Promise<boolean>;
  
  // Images (nouveau)
  addImage(toolId: string, imageUrl: string): Promise<void>;
  removeImage(toolId: string, imageId: string): Promise<void>;
  setPrimaryImage(toolId: string, imageId: string): Promise<void>;
}