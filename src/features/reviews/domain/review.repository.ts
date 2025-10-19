import { Review, CreateReviewDto } from "@/features/reviews/types";

export interface ReviewRepository {
  create(reviewData: CreateReviewDto): Promise<Review>;
  findByToolId(toolId: string): Promise<Review[]>;
  findByUserId(userId: string): Promise<Review[]>;
  findByRentalId(rentalId: number): Promise<Review[]>;
  findById(ratingId: number): Promise<Review | null>;
}