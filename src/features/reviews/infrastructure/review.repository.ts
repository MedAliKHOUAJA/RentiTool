import db, { query } from "@/db";
import { Review } from "../types";

export async function getReviewsByOwnerId(ownerId: string): Promise<Review[]> {
  const res = await query(
    `
    SELECT
        r."RatingId" as ratingId,
        r."RentalId" as rentalId,
        r."RaterId" as raterId,
        r."RatedUserId" as ratedUserId,
        r."RatedToolId" as ratedToolId,
        r."RatedEntityTypeId" as ratedEntityTypeId,
        r."Communication" as communication,
        r."ToolStatus" as toolStatus,
        r."Ponctuality" as ponctuality,
        r."Fiability" as fiability,
        r."Comment" as comment,
        r."FeelingTypeId" as feelingTypeId,
        r."FeelingScorePositive" as feelingScorePositive,
        r."FeelingScoreNegative" as feelingScoreNegative,
        r."FeelingScoreNeutral" as feelingScoreNeutral,
        r."FeelingScoreMixed" as feelingScoreMixed,
        r."CreatedAt" as createdAt,
        rr."ResponseTexte" as response,
        rr."ResponderId" as responderId,
        u_rater."FirstName" as raterFirstName,
        u_rater."LastName" as raterLastName,
        t."Title" as toolTitle
    FROM
        "Ratings" r
    JOIN
        "Tools" t ON r."RatedToolId" = t."Toolid"
    LEFT JOIN
        "RatingsResponses" rr ON r."RatingId" = rr."RatingId"
    JOIN
        "User" u_rater ON r."RaterId" = u_rater."userId"
    WHERE
        t."Ownerid" = $1 AND r."RatedEntityTypeId" = 1;
    `,
    [ownerId]
  );

  return res.rows.map(row => ({
    ratingId: row.ratingid,
    rentalId: row.rentalid,
    raterId: row.raterid,
    ratedUserId: row.rateduserid,
    ratedToolId: row.ratedtoolid,
    ratedEntityTypeId: row.ratedentitytypeid,
    communication: row.communication,
    toolStatus: row.toolstatus,
    ponctuality: row.ponctuality,
    fiability: row.fiability,
    comment: row.comment,
    feelingTypeId: row.feelingtypeid,
    feelingScorePositive: row.feelingscorepositive,
    feelingScoreNegative: row.feelingscorenegative,
    feelingScoreNeutral: row.feelingscoreneutral,
    feelingScoreMixed: row.feelingscoremixed,
    createdAt: new Date(row.createdat),
    response: row.responsetexte,
    responderId: row.responderid,
    respondedAt: row.respondedat ? new Date(row.respondedat) : undefined,
    reviewer: {
      id: row.raterid,
      name: `${row.raterfirstname} ${row.raterlastname}`,
    },
    toolTitle: row.tooltitle,
  }));
}

export async function upsertReviewReply(
  ratingId: number,
  responderId: string,
  responseText: string
): Promise<void> {
  const existingResponse = await query(
    `SELECT "ResponseId" FROM "RatingsResponses" WHERE "RatingId" = $1`,
    [ratingId]
  );

  if (existingResponse.rows.length > 0) {
    await query(
      `
      UPDATE "RatingsResponses"
      SET "ResponseTexte" = $1, "ResponderId" = $2
      WHERE "RatingId" = $3;
      `,
      [responseText, responderId, ratingId]
    );
  } else {
    await query(
      `
      INSERT INTO "RatingsResponses" ("RatingId", "ResponderId", "ResponseTexte")
      VALUES ($1, $2, $3);
      `,
      [ratingId, responderId, responseText]
    );
  }
}

export async function getReviewsForOwner(ownerId: string): Promise<Review[]> {
  const res = await query(
    `
    SELECT
        r."RatingId" as ratingId,
        r."RentalId" as rentalId,
        r."RaterId" as raterId,
        r."RatedUserId" as ratedUserId,
        r."RatedToolId" as ratedToolId,
        r."RatedEntityTypeId" as ratedEntityTypeId,
        r."Communication" as communication,
        r."ToolStatus" as toolStatus,
        r."Ponctuality" as ponctuality,
        r."Fiability" as fiability,
        r."Comment" as comment,
        r."FeelingTypeId" as feelingTypeId,
        r."FeelingScorePositive" as feelingScorePositive,
        r."FeelingScoreNegative" as feelingScoreNegative,
        r."FeelingScoreNeutral" as feelingScoreNeutral,
        r."FeelingScoreMixed" as feelingScoreMixed,
        r."CreatedAt" as createdAt,
        rr."ResponseTexte" as response,
        rr."ResponderId" as responderId,
        u_rater."FirstName" as raterFirstName,
        u_rater."LastName" as raterLastName
    FROM
        "Ratings" r
    LEFT JOIN
        "RatingsResponses" rr ON r."RatingId" = rr."RatingId"
    JOIN
        "User" u_rater ON r."RaterId" = u_rater."userId"
    WHERE
        r."RatedUserId" = $1 AND r."RatedEntityTypeId" = 3;
    `,
    [ownerId]
  );

  // Note: This mapping is simplified as we don't have a tool title here
  return res.rows.map(row => ({
    ratingId: row.ratingid,
    rentalId: row.rentalid,
    raterId: row.raterid,
    ratedUserId: row.rateduserid,
    ratedToolId: row.ratedtoolid,
    ratedEntityTypeId: row.ratedentitytypeid,
    communication: row.communication,
    toolStatus: row.toolstatus,
    ponctuality: row.ponctuality,
    fiability: row.fiability,
    comment: row.comment,
    feelingTypeId: row.feelingtypeid,
    feelingScorePositive: row.feelingscorepositive,
    feelingScoreNegative: row.feelingscorenegative,
    feelingScoreNeutral: row.feelingscoreneutral,
    feelingScoreMixed: row.feelingscoremixed,
    createdAt: new Date(row.createdat),
    response: row.responsetexte,
    responderId: row.responderid,
    respondedAt: row.respondedat ? new Date(row.respondedat) : undefined,
    reviewer: {
      id: row.raterid,
      name: `${row.raterfirstname} ${row.raterlastname}`,
    },
  }));
}
/**
 * Récupère les détails d'un review pour envoyer une notification
 */
export async function getReviewDetailsForNotification(reviewId: number) {
  try {
    console.log(`[REPOSITORY] Fetching review details for reviewId: ${reviewId}`);

    const res = await query(
      `
      SELECT 
        r."RatingId" as rating_id,
        r."RaterId" as reviewer_user_id,
        r."Comment" as original_comment,
        r."Communication" as communication,
        r."ToolStatus" as tool_status,
        r."Ponctuality" as ponctuality,
        r."Fiability" as fiability,
        r."RatedToolId" as tool_id,
        t."Title" as tool_name,
        t."Ownerid" as owner_id,
        owner."FirstName" as owner_first_name,
        owner."LastName" as owner_last_name,
        CONCAT(owner."FirstName", ' ', owner."LastName") as owner_name,
        reviewer."Email" as reviewer_email,
        reviewer."FirstName" as reviewer_first_name
      FROM "Ratings" r
      INNER JOIN "Tools" t ON r."RatedToolId" = t."Toolid"
      INNER JOIN "User" owner ON t."Ownerid" = owner."userId"
      LEFT JOIN "User" reviewer ON r."RaterId" = reviewer."userId"
      WHERE r."RatingId" = $1 AND r."RatedEntityTypeId" = 1
      `,
      [reviewId]
    );

    if (!res.rows || res.rows.length === 0) {
      console.error(`[REPOSITORY] Review not found: ${reviewId}`);
      return null;
    }

    const row = res.rows[0];

    const details = {
      reviewId: row.rating_id,
      reviewerUserId: row.reviewer_user_id,
      reviewerEmail: row.reviewer_email,
      reviewerFirstName: row.reviewer_first_name,
      originalComment: row.original_comment || '',
      communication: row.communication,
      toolStatus: row.tool_status,
      ponctuality: row.ponctuality,
      fiability: row.fiability,
      toolId: row.tool_id,
      toolName: row.tool_name,
      ownerId: row.owner_id,
      ownerName: row.owner_name || 'Propriétaire',
    };

    console.log(`[REPOSITORY] Review details fetched successfully:`, details);
    return details;
  } catch (error) {
    console.error('[REPOSITORY] Error fetching review details for notification:', error);
    throw error;
  }
}