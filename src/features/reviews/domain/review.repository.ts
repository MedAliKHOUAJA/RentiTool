
import { Review, CreateReviewDto } from "../types";

export interface ReviewRepository {
  create(review: CreateReviewDto): Promise<Review>;
}
