
import { Tool } from "./tool";

export interface ToolRepository {
  findAll(limit?: number): Promise<Tool[]>;
  findById(id: string): Promise<Tool | null>;
}
