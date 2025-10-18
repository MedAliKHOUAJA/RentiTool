
import { Tool } from "./tool";
import { Review } from "@/features/reviews/types";

export interface ToolDetails extends Tool {
  toolReviews: Review[];
  ownerReviews: Review[];
}
