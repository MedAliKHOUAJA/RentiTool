'use server';

import { CreateReviewUseCase } from "@/features/reviews/application/create-review.use-case";
import { PostgresReviewRepository } from "@/features/reviews/infrastructure/postgres-review.repository";
import { CreateReviewDto } from "@/features/reviews/types";

export async function createReview(reviewData: CreateReviewDto) {
  try {
    const reviewRepository = new PostgresReviewRepository();
    const createReviewUseCase = new CreateReviewUseCase(reviewRepository);
    const newReview = await createReviewUseCase.execute(reviewData);
    return { success: true, review: newReview };
  } catch (error: any) {
    console.error("Error creating review:", error);
    return { success: false, error: error.message };
  }
}
