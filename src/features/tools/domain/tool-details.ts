
import { Tool } from "./tool";
import { Image, ImageDto } from "./image";
import { Review } from "@/features/reviews/types";

export interface ToolDetails extends Tool {
  toolReviews: Review[];
  ownerReviews: Review[];
  images?: Image[];
  imagePrimary?: Image;
}