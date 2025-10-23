
import { Tool } from "./tool";
import { Image } from "./image";
import { Review } from "@/features/reviews/types";

export interface ToolDetails extends Tool {
  toolReviews: Review[];
  ownerReviews: Review[];
  images?: Image[];        
  imagePrimary?: Image;
}
