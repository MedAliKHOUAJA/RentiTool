import { Review, CreateReviewDto, FeelingTypeReverseMap, mapDbSentimentToUI } from "@/features/reviews/types";
import { ReviewRepository } from "@/features/reviews/domain/review.repository";
import { db } from "@/app/lib/postgres";

export class PostgresReviewRepository implements ReviewRepository {
  async create(reviewData: CreateReviewDto): Promise<Review> {
    const {
      rentalId,
      raterId,
      ratedToolId,
      ratedUserId,
      ratedEntityTypeId,
      communication,
      toolStatus,
      ponctuality,
      fiability,
      comment,
      // Sentiment data from Azure (optional)
      feelingTypeId,
      feelingScorePositive,
      feelingScoreNegative,
      feelingScoreNeutral,
      feelingScoreMixed,
    } = reviewData as CreateReviewDto & {
      feelingTypeId?: number;
      feelingScorePositive?: number;
      feelingScoreNegative?: number;
      feelingScoreNeutral?: number;
      feelingScoreMixed?: number;
    };

    const query = `
      INSERT INTO "Ratings" (
        "RentalId",
        "RaterId",
        "RatedUserId",
        "Communication",
        "ToolStatus",
        "Ponctuality",
        "Fiability",
        "Comment",
        "FeelingTypeId",
        "FeelingScorePositive",
        "FeelingScoreNegative",
        "FeelingScoreNeutral",
        "FeelingScoreMixed",
        "RatedEntityTypeId",
        "RatedToolId",
        "CreatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING *;
    `;

    const values = [
      rentalId,
      raterId,
      ratedUserId || null,
      communication || null,
      toolStatus || null,
      ponctuality || null,
      fiability || null,
      comment,
      feelingTypeId || null,
      feelingScorePositive || null,
      feelingScoreNegative || null,
      feelingScoreNeutral || null,
      feelingScoreMixed || null,
      ratedEntityTypeId,
      ratedToolId || null,
    ];

    const result = await db.query(query, values);
    const newReview = result.rows[0];

    // Fetch reviewer information
    const reviewerQuery = `
      SELECT "userId", "FirstName", "LastName"
      FROM "User"
      WHERE "userId" = $1
    `;
    const reviewerResult = await db.query(reviewerQuery, [newReview.RaterId]);
    const reviewer = reviewerResult.rows[0];

    // Map database result to Review type
    const review: Review = {
      ratingId: newReview.RatingId,
      rentalId: newReview.RentalId,
      raterId: newReview.RaterId,
      ratedUserId: newReview.RatedUserId || undefined,
      ratedToolId: newReview.RatedToolId || undefined,
      ratedEntityTypeId: newReview.RatedEntityTypeId,
      reviewer: {
        id: newReview.RaterId,
        name: reviewer 
          ? `${reviewer.FirstName} ${reviewer.LastName}` 
          : "Utilisateur inconnu",
      },
      communication: newReview.Communication,
      toolStatus: newReview.ToolStatus,
      ponctuality: newReview.Ponctuality,
      fiability: newReview.Fiability,
      comment: newReview.Comment,
      feelingTypeId: newReview.FeelingTypeId,
      feelingScorePositive: newReview.FeelingScorePositive,
      feelingScoreNegative: newReview.FeelingScoreNegative,
      feelingScoreNeutral: newReview.FeelingScoreNeutral,
      feelingScoreMixed: newReview.FeelingScoreMixed,
      createdAt: newReview.CreatedAt,
    };

    // Map sentiment data for UI
    review.sentiment = mapDbSentimentToUI(review);

    return review;
  }

  async findByToolId(toolId: string): Promise<Review[]> {
    const query = `
      SELECT 
        r."RatingId",
        r."RentalId",
        r."RaterId",
        r."RatedUserId",
        r."RatedToolId",
        r."RatedEntityTypeId",
        r."Communication",
        r."ToolStatus",
        r."Ponctuality",
        r."Fiability",
        r."Comment",
        r."FeelingTypeId",
        r."FeelingScorePositive",
        r."FeelingScoreNegative",
        r."FeelingScoreNeutral",
        r."FeelingScoreMixed",
        r."CreatedAt",
        u."FirstName",
        u."LastName",
        u."userId"
      FROM "Ratings" r
      LEFT JOIN "User" u ON r."RaterId" = u."userId"
      WHERE r."RatedToolId" = $1 AND r."RatedEntityTypeId" = 1
      ORDER BY r."CreatedAt" DESC;
    `;

    const result = await db.query(query, [toolId]);
    return this.mapRowsToReviews(result.rows);
  }

  async findByUserId(userId: string): Promise<Review[]> {
    const query = `
      SELECT 
        r."RatingId",
        r."RentalId",
        r."RaterId",
        r."RatedUserId",
        r."RatedToolId",
        r."RatedEntityTypeId",
        r."Communication",
        r."ToolStatus",
        r."Ponctuality",
        r."Fiability",
        r."Comment",
        r."FeelingTypeId",
        r."FeelingScorePositive",
        r."FeelingScoreNegative",
        r."FeelingScoreNeutral",
        r."FeelingScoreMixed",
        r."CreatedAt",
        u."FirstName",
        u."LastName",
        u."userId"
      FROM "Ratings" r
      LEFT JOIN "User" u ON r."RaterId" = u."userId"
      WHERE r."RatedUserId" = $1 AND r."RatedEntityTypeId" IN (2, 3)
      ORDER BY r."CreatedAt" DESC;
    `;

    const result = await db.query(query, [userId]);
    return this.mapRowsToReviews(result.rows);
  }

  async findByRentalId(rentalId: number): Promise<Review[]> {
    const query = `
      SELECT 
        r."RatingId",
        r."RentalId",
        r."RaterId",
        r."RatedUserId",
        r."RatedToolId",
        r."RatedEntityTypeId",
        r."Communication",
        r."ToolStatus",
        r."Ponctuality",
        r."Fiability",
        r."Comment",
        r."FeelingTypeId",
        r."FeelingScorePositive",
        r."FeelingScoreNegative",
        r."FeelingScoreNeutral",
        r."FeelingScoreMixed",
        r."CreatedAt",
        u."FirstName",
        u."LastName",
        u."userId"
      FROM "Ratings" r
      LEFT JOIN "User" u ON r."RaterId" = u."userId"
      WHERE r."RentalId" = $1
      ORDER BY r."CreatedAt" DESC;
    `;

    const result = await db.query(query, [rentalId]);
    return this.mapRowsToReviews(result.rows);
  }

  async findById(ratingId: number): Promise<Review | null> {
    const query = `
      SELECT 
        r."RatingId",
        r."RentalId",
        r."RaterId",
        r."RatedUserId",
        r."RatedToolId",
        r."RatedEntityTypeId",
        r."Communication",
        r."ToolStatus",
        r."Ponctuality",
        r."Fiability",
        r."Comment",
        r."FeelingTypeId",
        r."FeelingScorePositive",
        r."FeelingScoreNegative",
        r."FeelingScoreNeutral",
        r."FeelingScoreMixed",
        r."CreatedAt",
        u."FirstName",
        u."LastName",
        u."userId"
      FROM "Ratings" r
      LEFT JOIN "User" u ON r."RaterId" = u."userId"
      WHERE r."RatingId" = $1
      LIMIT 1;
    `;

    const result = await db.query(query, [ratingId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const reviews = this.mapRowsToReviews(result.rows);
    return reviews[0];
  }

  private mapRowsToReviews(rows: any[]): Review[] {
    return rows.map((row) => {
      const review: Review = {
        ratingId: row.RatingId,
        rentalId: row.RentalId,
        raterId: row.RaterId,
        ratedUserId: row.RatedUserId || undefined,
        ratedToolId: row.RatedToolId || undefined,
        ratedEntityTypeId: row.RatedEntityTypeId,
        reviewer: {
          id: row.userId,
          name: row.FirstName && row.LastName 
            ? `${row.FirstName} ${row.LastName}` 
            : "Utilisateur inconnu",
          avatar: undefined, // TODO: Add avatar if available
        },
        communication: row.Communication,
        toolStatus: row.ToolStatus,
        ponctuality: row.Ponctuality,
        fiability: row.Fiability,
        comment: row.Comment,
        feelingTypeId: row.FeelingTypeId,
        feelingScorePositive: row.FeelingScorePositive,
        feelingScoreNegative: row.FeelingScoreNegative,
        feelingScoreNeutral: row.FeelingScoreNeutral,
        feelingScoreMixed: row.FeelingScoreMixed,
        createdAt: row.CreatedAt,
      };

      // Map sentiment data for UI
      review.sentiment = mapDbSentimentToUI(review);

      return review;
    });
  }
}