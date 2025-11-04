import { Tool } from "@/features/tools/domain/tool";
import { ToolRepository } from "@/features/tools/domain/tool.repository";
import { db } from "@/app/lib/postgres";
import { User } from "@/features/users/domain/user";
import { Review, getMainRating, mapDbSentimentToUI } from "@/features/reviews/types";
import { ToolDetails } from "@/features/tools/domain/tool-details";
import { ClassificationId, Image } from "@/features/tools/domain/image";
import { ToolFilters, ToolFormData } from "../domain/tool.types";

export class PostgresToolRepository implements ToolRepository {
  
  /**
   * Trouve tous les outils avec filtres optionnels
   */
  async findByFilters(filters: ToolFilters): Promise<Tool[]> {
    let query = `
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
        img."ImageId" as "imageId"
      FROM "public"."Tools" t
      JOIN "public"."User" u ON t."Ownerid" = u."userId"
      LEFT JOIN "public"."Images" img ON t."Toolid" = img."ToolId" AND img."IsPrimaryToolImage" = true AND img."ClassificationId" = 4
      LEFT JOIN "public"."Locations" l ON u."LocationId" = l."LocationId"
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramIndex = 1;

    // Filtrer par owner
    if (filters.ownerId) {
      query += ` AND t."Ownerid" = $${paramIndex}`;
      values.push(filters.ownerId);
      paramIndex++;
    }

    // Filtrer par catégorie
    if (filters.categoryId) {
      query += ` AND t."CategoryId" = $${paramIndex}`;
      values.push(filters.categoryId);
      paramIndex++;
    }

    // Filtrer par sous-catégorie
    if (filters.subCategoryId) {
      query += ` AND t."SubCategoryId" = $${paramIndex}`;
      values.push(filters.subCategoryId);
      paramIndex++;
    }

    // Filtrer par recherche textuelle
    if (filters.searchQuery?.trim()) {
      query += ` AND (
        t."Title" ILIKE $${paramIndex} OR 
        t."Description" ILIKE $${paramIndex} OR 
        t."Brand" ILIKE $${paramIndex} OR 
        t."Model" ILIKE $${paramIndex}
      )`;
      values.push(`%${filters.searchQuery.trim()}%`);
      paramIndex++;
    }

    // Filtrer par statut actif
    if (filters.isActive !== undefined) {
      query += ` AND t."IsActive" = $${paramIndex}`;
      values.push(filters.isActive);
      paramIndex++;
    }

    // Tri
    if (filters.sortKey) {
      const sortMap = this.getSortMapping(filters.sortKey);
      query += ` ORDER BY ${sortMap.orderBy} ${sortMap.order}`;
    } else {
      query += ` ORDER BY t."Toolid" DESC`;
    }

    // Limite
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(filters.limit);
    }

    const result = await db.query(query, values);
    return result.rows.map((row) => this.mapRowToTool(row));
  }

  /**
   * Met à jour un outil
   */
  async update(id: string, data: Partial<ToolFormData>): Promise<Tool> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Construire dynamiquement la requête UPDATE
    if (data.title !== undefined) {
      updates.push(`"Title" = $${paramIndex}`);
      values.push(data.title);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updates.push(`"Description" = $${paramIndex}`);
      values.push(data.description);
      paramIndex++;
    }

    if (data.brand !== undefined) {
      updates.push(`"Brand" = $${paramIndex}`);
      values.push(data.brand);
      paramIndex++;
    }

    if (data.model !== undefined) {
      updates.push(`"Model" = $${paramIndex}`);
      values.push(data.model);
      paramIndex++;
    }

    if (data.rentalPricePerDay !== undefined) {
      updates.push(`"RentalPricePerDay" = $${paramIndex}`);
      values.push(data.rentalPricePerDay);
      paramIndex++;
    }

    if (data.categoryId !== undefined) {
      updates.push(`"CategoryId" = $${paramIndex}`);
      values.push(data.categoryId);
      paramIndex++;
    }

    if (data.subCategoryId !== undefined) {
      updates.push(`"SubCategoryId" = $${paramIndex}`);
      values.push(data.subCategoryId);
      paramIndex++;
    }

    if (data.isActive !== undefined) {
      updates.push(`"IsActive" = $${paramIndex}`);
      values.push(data.isActive);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    // Ajouter le WHERE
    values.push(id);
    const query = `
      UPDATE "public"."Tools"
      SET ${updates.join(", ")}, "UpdatedAt" = NOW()
      WHERE "Toolid" = $${paramIndex}
      RETURNING "Toolid"
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Tool not found");
    }

    // Récupérer l'outil mis à jour
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
        l."Governorate" || ', ' || l."Delegation" as "LocationName",
        img."ImageId" as "imageId"
      FROM "public"."Tools" t
      JOIN "public"."User" u ON t."Ownerid" = u."userId"
      LEFT JOIN "public"."Images" img ON t."Toolid" = img."ToolId" AND img."IsPrimaryToolImage" = true AND img."ClassificationId" = 4
      LEFT JOIN "public"."Locations" l ON u."LocationId" = l."LocationId"
      WHERE t."Toolid" = $1
    `;

    const toolResult = await db.query(selectQuery, [id]);
    return this.mapRowToTool(toolResult.rows[0]);
  }

  /**
   * Supprime un outil
   */
  async delete(id: string): Promise<boolean> {
    // Supprimer d'abord les images associées
    const deleteImagesQuery = `
      DELETE FROM "public"."Images"
      WHERE "ToolId" = $1 AND "ClassificationId" = 4
    `;
    await db.query(deleteImagesQuery, [id]);

    // Supprimer l'outil
    const deleteToolQuery = `
      DELETE FROM "public"."Tools"
      WHERE "Toolid" = $1
      RETURNING "Toolid"
    `;
    const result = await db.query(deleteToolQuery, [id]);

    return result.rows.length > 0;
  }

  /**
   * Ajoute une image à un outil
   */
  async addImage(toolId: string, imageUrl: string): Promise<void> {
    // Vérifier si c'est la première image (sera primaire)
    const countQuery = `
      SELECT COUNT(*) as count
      FROM "public"."Images"
      WHERE "ToolId" = $1 AND "ClassificationId" = 4
    `;
    const countResult = await db.query(countQuery, [toolId]);
    const isPrimary = parseInt(countResult.rows[0].count) === 0;

    const insertQuery = `
      INSERT INTO "public"."Images" (
        "ImageBinary", "ToolId", "ClassificationId", "IsPrimaryToolImage"
      ) VALUES ($1, $2, $3, $4)
    `;

    await db.query(insertQuery, [
      Buffer.from(imageUrl), // Ou stocker directement le Buffer si c'est un fichier uploadé
      toolId,
      ClassificationId.ToolImage,
      isPrimary
    ]);
  }

  /**
   * Supprime une image d'un outil
   */
  async removeImage(toolId: string, imageId: string): Promise<void> {
    // Vérifier si c'est l'image primaire
    const checkQuery = `
      SELECT "IsPrimaryToolImage"
      FROM "public"."Images"
      WHERE "ImageId" = $1 AND "ToolId" = $2 AND "ClassificationId" = 4
    `;
    const checkResult = await db.query(checkQuery, [imageId, toolId]);

    if (checkResult.rows.length === 0) {
      throw new Error("Image not found");
    }

    const wasPrimary = checkResult.rows[0].IsPrimaryToolImage;

    // Supprimer l'image
    const deleteQuery = `
      DELETE FROM "public"."Images"
      WHERE "ImageId" = $1 AND "ToolId" = $2 AND "ClassificationId" = 4
    `;
    await db.query(deleteQuery, [imageId, toolId]);

    // Si c'était l'image primaire, définir une autre image comme primaire
    if (wasPrimary) {
      const setNewPrimaryQuery = `
        UPDATE "public"."Images"
        SET "IsPrimaryToolImage" = true
        WHERE "ToolId" = $1 
          AND "ClassificationId" = 4
          AND "ImageId" = (
            SELECT "ImageId"
            FROM "public"."Images"
            WHERE "ToolId" = $1 AND "ClassificationId" = 4
            LIMIT 1
          )
      `;
      await db.query(setNewPrimaryQuery, [toolId]);
    }
  }

  /**
   * Définit une image comme primaire
   */
  async setPrimaryImage(toolId: string, imageId: string): Promise<void> {
    // Désactiver toutes les images primaires pour cet outil
    const resetQuery = `
      UPDATE "public"."Images"
      SET "IsPrimaryToolImage" = false
      WHERE "ToolId" = $1 AND "ClassificationId" = 4
    `;
    await db.query(resetQuery, [toolId]);

    // Définir la nouvelle image primaire
    const setPrimaryQuery = `
      UPDATE "public"."Images"
      SET "IsPrimaryToolImage" = true
      WHERE "ImageId" = $1 AND "ToolId" = $2 AND "ClassificationId" = 4
      RETURNING "ImageId"
    `;
    const result = await db.query(setPrimaryQuery, [imageId, toolId]);

    if (result.rows.length === 0) {
      throw new Error("Image not found");
    }
  }

  /**
   * Trouve tous les outils (avec limite optionnelle)
   */
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
        img."ImageId" as "imageId"
      FROM "public"."Tools" t
      JOIN "public"."User" u ON t."Ownerid" = u."userId"
      LEFT JOIN "public"."Images" img ON t."Toolid" = img."ToolId" AND img."IsPrimaryToolImage" = true AND img."ClassificationId" = 4
      LEFT JOIN "public"."Locations" l ON u."LocationId" = l."LocationId"
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    const result = await db.query(query);

    return result.rows.map((row) => this.mapRowToTool(row));
  }

  /**
   * Trouve les outils d'un propriétaire
   */
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
        img."ImageId" as "imageId"
      FROM "public"."Tools" t
      JOIN "public"."User" u ON t."Ownerid" = u."userId"
      LEFT JOIN "public"."Images" img ON t."Toolid" = img."ToolId" AND img."IsPrimaryToolImage" = true AND img."ClassificationId" = 4
      LEFT JOIN "public"."Locations" l ON u."LocationId" = l."LocationId"
      WHERE t."Ownerid" = $1
    `;
    const result = await db.query(query, [ownerId]);

    return result.rows.map((row) => this.mapRowToTool(row));
  }

  /**
   * Crée un nouvel outil
   */
  async create(data: ToolFormData): Promise<Tool> {
    const {
      title,
      description,
      categoryId,
      subCategoryId,
      brand,
      model,
      rentalPricePerDay,
      isActive,
      ownerId,
    } = data;

    // Calculer le prix par semaine (exemple: 6 jours pour le prix de 7)
    const rentalPricePerWeek = rentalPricePerDay ? rentalPricePerDay * 6 : null;

    // Insérer l'outil
    const insertToolQuery = `
      INSERT INTO "public"."Tools" (
        "Title", "Description", "CategoryId", "SubCategoryId", "Brand", "Model",
        "RentalPricePerDay", "RentalPricePerWeek", "IsActive", "StatusId", "Ownerid"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING "Toolid"
    `;
    const toolValues = [
      title,
      description || null,
      categoryId || null,
      subCategoryId || null,
      brand || null,
      model || null,
      rentalPricePerDay || null,
      rentalPricePerWeek,
      isActive,
      1, // StatusId = 1 (Available by default)
      ownerId
    ];

    const toolResult = await db.query(insertToolQuery, toolValues);
    const newToolId = toolResult.rows[0].Toolid;

    // Récupérer l'outil complet
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

  /**
   * Trouve un outil par ID avec tous ses détails
   */
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
  
    // ✅ Récupérer SEULEMENT les IDs des images (PAS les binaires)
    const imagesQuery = `
      SELECT
        "ImageId",
        "IsPrimaryToolImage",
        "ClassificationId"
      FROM "public"."Images"
      WHERE "ToolId" = $1 AND "ClassificationId" = 4
      ORDER BY "IsPrimaryToolImage" DESC, "ImageId" ASC
    `;
    const imagesResult = await db.query(imagesQuery, [id]);
  
    // ✅ Créer des objets Image avec buffer vide (les binaires seront chargés via /api/images/[id])
    const images: Image[] = imagesResult.rows.map((row: any): Image => ({
      imageId: row.ImageId,
      imageBinary: Buffer.from([]), // ⚠️ Buffer vide - les données seront servies par /api/images/[id]
      userId: null,
      businessCardId: null,
      toolId: parseInt(id, 10),
      ratingId: null,
      isPrimaryToolImage: row.IsPrimaryToolImage,
      classificationId: row.ClassificationId as ClassificationId,
    }));
  
    const imagePrimary = images.find(img => img.isPrimaryToolImage) || images[0] || undefined;
  
    // Récupérer les reviews du tool
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
  
    // Récupérer les reviews du propriétaire
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
      },
      images, // ✅ Array d'objets Image (sans binaires)
      imagePrimary, // ✅ Objet Image (sans binaire)
    };
  
    return toolDetails;
  }

  /**
   * Mapping des clés de tri vers les colonnes SQL
   */
  private getSortMapping(sortKey: string): { orderBy: string; order: "ASC" | "DESC" } {
    const sortMappings: Record<string, { orderBy: string; order: "ASC" | "DESC" }> = {
      newest: { orderBy: 't."Toolid"', order: "DESC" },
      oldest: { orderBy: 't."Toolid"', order: "ASC" },
      title_asc: { orderBy: 't."Title"', order: "ASC" },
      title_desc: { orderBy: 't."Title"', order: "DESC" },
      price_asc: { orderBy: 't."RentalPricePerDay"', order: "ASC" },
      price_desc: { orderBy: 't."RentalPricePerDay"', order: "DESC" },
      brand_asc: { orderBy: 't."Brand"', order: "ASC" },
      brand_desc: { orderBy: 't."Brand"', order: "DESC" },
      model_asc: { orderBy: 't."Model"', order: "ASC" },
      model_desc: { orderBy: 't."Model"', order: "DESC" },
      category_asc: { orderBy: 't."CategoryId"', order: "ASC" },
      category_desc: { orderBy: 't."CategoryId"', order: "DESC" },
    };

    return sortMappings[sortKey] || { orderBy: 't."Toolid"', order: "DESC" };
  }

  /**
   * Mappe une ligne SQL vers un objet Tool
   */
  private mapRowToTool(row: any): Tool {
    const owner: User = {
      userId: row.userId,
      firstName: row.FirstName || row.firstName,
      lastName: row.LastName || row.lastName,
      email: row.Email,
      phone: row.Phone,
      roleId: row.RoleId,
      locationId: row.LocationId,
      locationName: row.LocationName,
    };
  
    // ✅ Créer un objet Image avec buffer vide (pas de binaire)
    const image: Image | undefined = row.imageId ? {
      imageId: row.imageId,
      imageBinary: Buffer.from([]), // ⚠️ Buffer vide - sera chargé via /api/images/[id]
      userId: null,
      businessCardId: null,
      toolId: row.Toolid,
      ratingId: null,
      isPrimaryToolImage: true,
      classificationId: 4 as ClassificationId, // ToolImage
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

  /**
   * Mappe une ligne SQL vers un objet Review
   */
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