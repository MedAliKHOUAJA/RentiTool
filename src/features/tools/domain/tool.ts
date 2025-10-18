
import { User } from "@/features/users/domain/user";

export interface Tool {
  toolId: number;
  owner: User;
  title: string;
  description: string;
  categoryId: number;
  subCategoryId: number;
  brand: string;
  model: string;
  rentalPricePerDay: number;
  rentalPricePerWeek: number;
  isActive: boolean;
  statusId: number;
  imageUrl?: string;
}
