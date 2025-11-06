
import { User } from "@/features/users/domain/user";
import { Review } from "@/features/reviews/types";
import { Route } from "@/routers/types"; // Import Route
import { Image } from "./image";

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
  image?: Image;
  reviews?: Review[];
  href: Route<string>; // Add href property
}
