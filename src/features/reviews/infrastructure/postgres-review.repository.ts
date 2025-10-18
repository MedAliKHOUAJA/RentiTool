import { Review, CreateReviewDto } from "@/features/reviews/types";
import { ReviewRepository } from "@/features/reviews/domain/review.repository";
import { db } from "@/app/lib/postgres";

export class PostgresReviewRepository implements ReviewRepository {
  async create(reviewData: CreateReviewDto): Promise<Review> {
    const {
      bookingId,
      toolId,
      revieweeId,
      rating,
      communication,
      toolCondition,
      punctuality,
      comment,
    } = reviewData;

    // Determine RatedEntityTypeId based on whether it's a tool or user review
    // Assuming 1 for tool, 3 for user (from db.txt RatedEntityType)
    const ratedEntityTypeId = toolId ? 1 : 3;
    const ratedToolId = toolId || null; // Set to null if not a tool review
    const ratedUserId = revieweeId || null; // Set to null if not a user review

    const query = `
      INSERT INTO "public"."Ratings" (
        "RentalId",
        "RaterId",
        "RatedUserId",
        "Communication",
        "ToolStatus",
        "Ponctuality",
        "Fiability",
        "Comment",
        "RatedEntityTypeId",
        "RatedToolId",
        "CreatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *;
    `;

    // Placeholder for RaterId - this should come from the authenticated user
    const raterId = "420430c2-0338-4612-aa74-65f0a82900fe"; // TODO: Replace with actual authenticated user ID

    const values = [
      bookingId,
      raterId,
      ratedUserId,
      communication,
      toolCondition,
      punctuality,
      rating,
      comment,
      ratedEntityTypeId,
      ratedToolId,
    ];

    const result = await db.query(query, values);
    const newReview = result.rows[0];

    return {
      id: newReview.RatingId,
      bookingId: newReview.RentalId,
      toolId: newReview.RatedToolId,
      reviewer: {
        id: newReview.RaterId,
        name: "Unknown Reviewer", // TODO: Fetch reviewer name
      },
      rating: newReview.Fiability,
      communication: newReview.Communication,
      toolCondition: newReview.ToolStatus,
      punctuality: newReview.Ponctuality,
      comment: newReview.Comment,
      createdAt: newReview.CreatedAt,
    };
  }
}