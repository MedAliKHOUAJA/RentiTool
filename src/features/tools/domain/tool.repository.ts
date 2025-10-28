
import { Tool } from "./tool";
import { ToolDetails } from "./tool-details";

export interface ToolRepository {
  findAll(limit?: number): Promise<Tool[]>;
  findById(id: string): Promise<ToolDetails | null>;
  findByOwnerId(ownerId: string): Promise<Tool[]>;
  create(tool: Omit<Tool, 'toolId' | 'href' | 'owner'> & { ownerId: string }): Promise<Tool>;
}
