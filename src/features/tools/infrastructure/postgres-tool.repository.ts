import { Tool } from "@/features/tools/domain/tool";
import { ToolRepository } from "@/features/tools/domain/tool.repository";
import { db } from "@/app/lib/postgres";
import { User } from "@/features/users/domain/user";

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
      u."LocationId"
    FROM "public"."Tools" t
    JOIN "public"."User" u ON t."Ownerid" = u."userId"
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    const result = await db.query(query);

    return result.rows.map((row) => this.mapRowToTool(row));
  }

  async findById(id: string): Promise<Tool | null> {
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
        t."Image_Url",
        u."UserId",
        u."FirstName",
        u."LastName",
        u."Email",
        u."Phone",
        u."RoleId",
        u."LocationId"
      FROM "public"."Tools" t
      JOIN "public"."User" u ON t."Ownerid" = u."UserId"
      WHERE t."Toolid" = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTool(result.rows[0]);
  }

  private mapRowToTool(row: any): Tool {
    const owner: User = {
      userId: row.UserId,
      firstName: row.FirstName,
      lastName: row.LastName,
      email: row.Email,
      phone: row.Phone,
      roleId: row.RoleId,
      locationId: row.LocationId,
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
    };
  }
}
