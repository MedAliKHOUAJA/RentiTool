
import { Review, CreateReviewDto } from "@/features/reviews/types";
import { ReviewRepository } from "@/features/reviews/domain/review.repository";

export class CreateReviewUseCase {
  constructor(private reviewRepository: ReviewRepository) {}

  async execute(reviewData: CreateReviewDto): Promise<Review> {
    // Add any business logic or validation here before creating the review
    return this.reviewRepository.create(reviewData);
  }
}
