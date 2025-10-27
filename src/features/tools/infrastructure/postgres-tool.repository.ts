import { Tool } from "@/features/tools/domain/tool";
import { ToolRepository } from "@/features/tools/domain/tool.repository";
import { db } from "@/app/lib/postgres";
import { User } from "@/features/users/domain/user";
import { Review, getMainRating, mapDbSentimentToUI } from "@/features/reviews/types";
import { ToolDetails } from "@/features/tools/domain/tool-details";
import { ClassificationId, Image } from "@/features/tools/domain/image";

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
      l."Governorate" || ', ' || l."Delegation" as "LocationName",
      img."ImageId" as "imageId",
      img."ImageBinary" as "imageBinary",
      img."IsPrimaryToolImage" as "isPrimaryToolImage",
      img."ClassificationId" as "classificationId"
    FROM "public"."Tools" t
    JOIN "public"."User" u ON t."Ownerid" = u."userId"
    LEFT JOIN "public"."Images" img ON t."Toolid" = img."ToolId" AND img."IsPrimaryToolImage" = true AND img."ClassificationId" = 4
    LEFT JOIN "public"."Locations" l ON u."LocationId" = l."LocationId"
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    const result = await db.query(query);

    return result.rows.map((row) => this.mapRowToTool(row));
  }

  async findByOwnerId(ownerId: string): Promise<Tool[]> {
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
      l."Governorate" || ', ' || l."Delegation" as "LocationName",
      img."ImageId" as "imageId",
      img."ImageBinary" as "imageBinary",
      img."IsPrimaryToolImage" as "isPrimaryToolImage",
      img."ClassificationId" as "classificationId"
    FROM "public"."Tools" t
    JOIN "public"."User" u ON t."Ownerid" = u."userId"
    LEFT JOIN "public"."Images" img ON t."Toolid" = img."ToolId" AND img."IsPrimaryToolImage" = true AND img."ClassificationId" = 4
    LEFT JOIN "public"."Locations" l ON u."LocationId" = l."LocationId"
    WHERE t."Ownerid" = $1
    `;
    const result = await db.query(query, [ownerId]);

    return result.rows.map((row) => this.mapRowToTool(row));
  }

  async create(
    tool: Omit<Tool, 'toolId' | 'href' | 'owner'> & { 
      ownerId: string;
      images?: Buffer[];
    }
  ): Promise<Tool> {
    const {
      title,
      description,
      categoryId,
      subCategoryId,
      brand,
      model,
      rentalPricePerDay,
      rentalPricePerWeek,
      isActive,
      statusId,
      ownerId,
      images = [], 
    } = tool;
  
    // 1. Insérer l'outil
    const insertToolQuery = `
      INSERT INTO "public"."Tools" (
        "Title", "Description", "CategoryId", "SubCategoryId", "Brand", "Model",
        "RentalPricePerDay", "RentalPricePerWeek", "IsActive", "StatusId", "Ownerid"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING "Toolid"
    `;
    const toolValues = [
      title, description, categoryId, subCategoryId, brand, model,
      rentalPricePerDay, rentalPricePerWeek, isActive, statusId, ownerId
    ];
  
    const toolResult = await db.query(insertToolQuery, toolValues);
    const newToolId = toolResult.rows[0].Toolid;
  
    // 2. Insérer les images (si présentes)
    if (images.length > 0) {
      const insertImageQuery = `
        INSERT INTO "public"."Image" (
          "imageBinary", "toolId", "classificationId", "isPrimaryToolImage"
        ) VALUES ($1, $2, $3, $4)
      `;
  
      // Insérer chaque image
      for (let i = 0; i < images.length; i++) {
        const isPrimary = i === 0; // Première image = principale
        const imageValues = [
          images[i],               // Buffer
          newToolId,               // toolId
          ClassificationId.ToolImage, // = 4
          isPrimary
        ];
        await db.query(insertImageQuery, imageValues);
      }
    }
  
    // 3. Récupérer l'outil complet avec owner et images (si nécessaire)
    const selectQuery = `
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
      WHERE t."Toolid" = $1
    `;
    const newToolResult = await db.query(selectQuery, [newToolId]);
  
    return this.mapRowToTool(newToolResult.rows[0]);
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

      const toolImagesQuery = `
      SELECT 
        "ImageId",
        "ImageBinary",
        "UserId",
        "BusinessCardId",
        "ToolId",
        "RatingId",
        "IsPrimaryToolImage",
        "ClassificationId"
      FROM public."Images"
      WHERE "ToolId" = $1 AND "ClassificationId" = 4
    `;
    const toolImagesResult = await db.query(toolImagesQuery, [id]);

    const primaryImage = toolImagesResult.rows.find(img => img.IsPrimaryToolImage);

    const otherImages = toolImagesResult.rows.filter(img => !img.IsPrimaryToolImage);

    const toolDetails: ToolDetails = {
      ...tool,
      toolReviews: toolReviewsResult.rows.map((row) => this.mapRowToReview(row)),
      ownerReviews,
      owner: {
        ...tool.owner,
        starRating: ownerStarRating,
      },
      images: otherImages.map(img => ({
        imageId: img.ImageId,
        imageBinary: img.ImageBinary,
        userId: img.UserId,
        businessCardId: img.BusinessCardId,
        toolId: img.ToolId,
        ratingId: img.RatingId,
        isPrimaryToolImage: img.IsPrimaryToolImage,
        classificationId: img.ClassificationId,
      })),
     imagePrimary: primaryImage
    };

    return toolDetails;
  }

  private mapRowToTool(row: any): Tool {
    const owner: User = {
      userId: row.userId,
      firstName: row.FirstName,
      lastName: row.LastName,
      email: row.Email,
      phone: row.Phone,
      roleId: row.RoleId,
      locationId: row.LocationId,
      locationName: row.LocationName,
    };

    const image: Image | undefined = row.imageId ? {
      imageId: row.imageId,
      imageBinary: row.imageBinary,
      isPrimaryToolImage: row.isPrimaryToolImage,
      classificationId: row.classificationId,
      userId: undefined,
      businessCardId: undefined,
      toolId: row.Toolid,
      ratingId: undefined
    } : undefined;

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
      image,
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
      ratedEntityTypeId: row.RatedEntityTypeId, 
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
