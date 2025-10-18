import { Tool } from "@/features/tools/domain/tool";
import { ToolRepository } from "@/features/tools/domain/tool.repository";
import { db } from "@/app/lib/postgres";
import { User } from "@/features/users/domain/user";
import { Review, getMainRating, mapDbSentimentToUI } from "@/features/reviews/types";
import { ToolDetails } from "@/features/tools/domain/tool-details";

export class PostgresToolRepository implements ToolRepository {
  async findAll(limit?: number): Promise<Tool[]> {
    const query = `
    SELECT
      t."Toolid",
      t."Title",
      t."Description",
      t."CategoryId",
      t."SubCategoryId",
      t."Brand",
      t."Model",
      t."RentalPricePerDay",
      t."RentalPricePerWeek",
      t."IsActive",
      t."StatusId",
      u."userId",
      u."FirstName",
      u."LastName",
      u."Email",
      u."Phone",
      u."RoleId",
      u."LocationId",
      l."Governorate" || ', ' || l."Delegation" as "LocationName"
    FROM "public"."Tools" t
    JOIN "public"."User" u ON t."Ownerid" = u."userId"
    LEFT JOIN "public"."Locations" l ON u."LocationId" = l."LocationId"
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    const result = await db.query(query);

    return result.rows.map((row) => this.mapRowToTool(row));
  }

  async findById(id: string): Promise<ToolDetails | null> {
    const toolQuery = `
      SELECT
        t."Toolid",
        t."Title",
        t."Description",
        t."CategoryId",
        t."SubCategoryId",
        t."Brand",
        t."Model",
        t."RentalPricePerDay",
        t."RentalPricePerWeek",
        t."IsActive",
        t."StatusId",
        u."userId",
        u."FirstName" as "firstName",
        u."LastName" as "lastName",
        u."Email",
        u."Phone",
        u."RoleId",
        u."LocationId",
        l."Governorate" || ', ' || l."Delegation" as "LocationName"
      FROM "public"."Tools" t
      JOIN "public"."User" u ON t."Ownerid" = u."userId"
      LEFT JOIN "public"."Locations" l ON u."LocationId" = l."LocationId"
      WHERE t."Toolid" = $1
    `;
    const toolResult = await db.query(toolQuery, [id]);

    if (toolResult.rows.length === 0) {
      return null;
    }

    const tool = this.mapRowToTool(toolResult.rows[0]);

    // ✅ CORRECTION : Ajout de RatedEntityTypeId et tous les champs sentiment
    const toolReviewsQuery = `
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
        u."userId",
        u."FirstName",
        u."LastName"
      FROM "public"."Ratings" r
      JOIN "public"."User" u ON r."RaterId" = u."userId"
      WHERE r."RatedToolId" = $1 AND r."RatedEntityTypeId" = 1
      ORDER BY r."CreatedAt" DESC
    `;
    const toolReviewsResult = await db.query(toolReviewsQuery, [id]);

    // ✅ CORRECTION : Ajout de RatedEntityTypeId et tous les champs sentiment
    const ownerReviewsQuery = `
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
        rater_u."userId" as "rater_userId",
        rater_u."FirstName" as "rater_firstName",
        rater_u."LastName" as "rater_lastName",
        rated_u."userId" as "rated_userId",
        rated_u."FirstName" as "rated_firstName",
        rated_u."LastName" as "rated_lastName"
      FROM "public"."Ratings" r
      JOIN "public"."User" rater_u ON r."RaterId" = rater_u."userId"
      JOIN "public"."User" rated_u ON r."RatedUserId" = rated_u."userId"
      WHERE r."RatedUserId" = $1 AND r."RatedEntityTypeId" = 3
      ORDER BY r."CreatedAt" DESC
    `;
    const ownerReviewsResult = await db.query(ownerReviewsQuery, [tool.owner.userId]);

    const ownerReviews = ownerReviewsResult.rows.map((row) => this.mapRowToReview(row));
    const ownerStarRating = ownerReviews.length > 0 
      ? ownerReviews.reduce((acc, review) => acc + getMainRating(review), 0) / ownerReviews.length 
      : 0;

    const toolDetails: ToolDetails = {
      ...tool,
      toolReviews: toolReviewsResult.rows.map((row) => this.mapRowToReview(row)),
      ownerReviews,
      owner: {
        ...tool.owner,
        starRating: ownerStarRating,
      }
    };

    return toolDetails;
  }

  private mapRowToTool(row: any): Tool {
    const owner: User = {
      userId: row.userId,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.Email,
      phone: row.Phone,
      roleId: row.RoleId,
      locationId: row.LocationId,
      locationName: row.LocationName,
    };

    return {
      toolId: row.Toolid,
      owner,
      title: row.Title,
      description: row.Description,
      categoryId: row.CategoryId,
      subCategoryId: row.SubCategoryId,
      brand: row.Brand,
      model: row.Model,
      rentalPricePerDay: row.RentalPricePerDay,
      rentalPricePerWeek: row.RentalPricePerWeek,
      isActive: row.IsActive,
      statusId: row.StatusId,
      imageUrl: row.Image_Url,
      href: `/listing-tool-detail?id=${row.Toolid}`,
    };
  }

  private mapRowToReview(row: any): Review {
    return {
      ratingId: row.RatingId,
      rentalId: row.RentalId,
      raterId: row.RaterId,
      ratedUserId: row.RatedUserId || undefined,
      ratedToolId: row.RatedToolId || undefined,
      ratedEntityTypeId: row.RatedEntityTypeId, // ✅ Maintenant disponible
      reviewer: {
        id: row.rater_userId || row.userId,
        name: row.rater_firstName && row.rater_lastName
          ? `${row.rater_firstName} ${row.rater_lastName}`
          : row.FirstName && row.LastName
          ? `${row.FirstName} ${row.LastName}`
          : "Utilisateur inconnu",
      },
      communication: row.Communication || undefined,
      toolStatus: row.ToolStatus || undefined,
      ponctuality: row.Ponctuality || undefined,
      fiability: row.Fiability || undefined,
      comment: row.Comment || undefined,
      feelingTypeId: row.FeelingTypeId || undefined,
      feelingScorePositive: row.FeelingScorePositive || undefined,
      feelingScoreNegative: row.FeelingScoreNegative || undefined,
      feelingScoreNeutral: row.FeelingScoreNeutral || undefined,
      feelingScoreMixed: row.FeelingScoreMixed || undefined,
      sentiment: mapDbSentimentToUI({
        feelingTypeId: row.FeelingTypeId,
        feelingScorePositive: row.FeelingScorePositive,
        feelingScoreNegative: row.FeelingScoreNegative,
        feelingScoreNeutral: row.FeelingScoreNeutral,
        toolStatus: row.ToolStatus,
        fiability: row.Fiability,
        communication: row.Communication,
        ponctuality: row.Ponctuality,
        ratedEntityTypeId: row.RatedEntityTypeId,
      } as Review),
      createdAt: row.CreatedAt,
    };
  }
}