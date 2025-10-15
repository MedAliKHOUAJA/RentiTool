import { NextResponse } from "next/server";
import { query } from "@/db";
import { DEMO_TOOL_CATEGORIES } from "@/data/taxonomies";
import { DEMO_AUTHORS } from "@/data/authors";
import { ToolDataType } from "@/data/types";
import type { ToolEntity } from "@/data/tools";
import { Route } from "@/routers/types";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const toolId = Number(id);
  if (Number.isNaN(toolId)) {
    return new NextResponse("Invalid id", { status: 400 });
  }

  try {
    const envTable = process.env.TOOLS_TABLE?.trim();
    const candidates = [
      envTable,
      "tools",
      "Tools",
      'public."Tools"',
      "public.tools",
      "tool",
      "Tool",
      'public."Tool"',
      "public.tool",
    ].filter(Boolean) as string[];

    // Resolve actual table and columns using information_schema
    const parseIdent = (ident: string): { schema: string; table: string } => {
      const defSchema = "public";
      if (ident.includes(".")) {
        const [schemaRaw, tableRaw] = ident.split(".", 2);
        const unquote = (s: string) => s.replace(/^"|"$/g, "");
        return { schema: unquote(schemaRaw), table: unquote(tableRaw) };
      }
      return { schema: defSchema, table: ident.replace(/^"|"$/g, "") };
    };

    const tryResolve = async () => {
      for (const cand of candidates) {
        const { schema, table } = parseIdent(cand!);
        const colsRes = await query(
          `SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`,
          [schema, table]
        );
        if (colsRes.rows.length) {
          return {
            schema,
            table,
            columns: colsRes.rows.map((r: any) => r.column_name as string),
          };
        }
      }
      return null;
    };

    const resolved = await tryResolve();
    if (!resolved) {
      const tried = candidates.join(", ");
      console.error(
        `No tools table found via information_schema. Tried: ${tried}`
      );
      return new NextResponse(
        "Tools table not found. Set TOOLS_TABLE env to your exact table name.",
        { status: 500 }
      );
    }

    const { schema, table, columns } = resolved;
    const has = (names: string[]) => names.find((n) => columns.includes(n));
    // Detect primary key column
    const pkRes = await query(
      `SELECT kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'PRIMARY KEY'
       ORDER BY kcu.ordinal_position`,
      [schema, table]
    );
    const pkCol: string | undefined = pkRes.rows[0]?.column_name;
    const col = {
      id:
        pkCol ||
        has(["ToolId", "ToolID", "Id", "ID", "id", "toolid", "tool_id"]),
      owner: has([
        "OwnerId",
        "ownerid",
        "owner_id",
        "UserId",
        "userid",
        "user_id",
      ]),
      title: has(["Title", "title", "Name", "name"]),
      description: has(["Description", "description", "Details", "details"]),
      category: has(["CategoryId", "categoryid", "category_id"]),
      subcategory: has(["SubCategoryId", "subcategoryid", "sub_category_id"]),
      brand: has(["Brand", "brand"]),
      model: has(["Model", "model"]),
      priceDay: has([
        "RentalPricePerDay",
        "rentalpriceperday",
        "rental_price_per_day",
        "DailyPrice",
        "dailyprice",
        "daily_price",
        "Price",
        "price",
      ]),
      priceWeek: has([
        "RentalPricePerWeek",
        "rentalpriceperweek",
        "rental_price_per_week",
      ]),
      isActive: has(["IsActive", "isactive", "is_active", "Active", "active"]),
      statusId: has(["StatusId", "statusid", "status_id"]),
    };
    if (!col.id) {
      col.id = columns.find((c) => c.toLowerCase().endsWith("id"));
    }
    if (!col.id) {
      return new NextResponse(
        `Tools table found (${schema}.${table}), but no id column detected (PRIMARY KEY|ToolId|ToolID|Id|ID|id|toolid|tool_id).`,
        { status: 500 }
      );
    }

    // Build SELECT with exact case quoting, aliasing to canonical names
    const q = (name: string) => `"${name}"`;
    const selectParts: string[] = [];
    selectParts.push(`${q(col.id)} as "toolId"`);
    if (col.owner) selectParts.push(`${q(col.owner)} as "ownerId"`);
    if (col.title) selectParts.push(`${q(col.title)} as "title"`);
    if (col.description)
      selectParts.push(`${q(col.description)} as "description"`);
    if (col.category) selectParts.push(`${q(col.category)} as "categoryId"`);
    if (col.subcategory)
      selectParts.push(`${q(col.subcategory)} as "subCategoryId"`);
    if (col.brand) selectParts.push(`${q(col.brand)} as "brand"`);
    if (col.model) selectParts.push(`${q(col.model)} as "model"`);
    if (col.priceDay)
      selectParts.push(`${q(col.priceDay)} as "rentalPricePerDay"`);
    if (col.priceWeek)
      selectParts.push(`${q(col.priceWeek)} as "rentalPricePerWeek"`);
    if (col.isActive) selectParts.push(`${q(col.isActive)} as "isActive"`);
    if (col.statusId) selectParts.push(`${q(col.statusId)} as "statusId"`);
    const select = selectParts.join(", ");

    const from = `"${schema}"."${table}"`;
    const sql = `SELECT ${select} FROM ${from} WHERE ${q(col.id)} = $1`;
    const { rows } = await query(sql, [toolId]);
    if (!rows.length) {
      return new NextResponse("Tool not found", { status: 404 });
    }

    const r = rows[0] as unknown as ToolEntity;
    const category =
      DEMO_TOOL_CATEGORIES.find((c) => c.id === r.categoryId) ||
      DEMO_TOOL_CATEGORIES[0];

    const ownerSeed = Array.from(String(r.ownerId || "0")).reduce(
      (a, ch) => a + ch.charCodeAt(0),
      0
    );
    const authorIndex = Math.abs(ownerSeed) % DEMO_AUTHORS.length;
    const author = DEMO_AUTHORS[authorIndex];

    const priceStr =
      r.rentalPricePerDay != null ? String(r.rentalPricePerDay) : "0";
    const title =
      r.title && String(r.title).trim().length > 0
        ? r.title
        : `Tool #${r.toolId}`;

    const tool: ToolDataType = {
      id: r.toolId,
      author,
      date: new Date().toISOString().slice(0, 10),
      href: `/listing-tool-detail?id=${r.toolId}` as Route,
      title,
      featuredImage: "/images/placeholder-large.png",
      desc: r.description ?? undefined,
      commentCount: 0,
      viewCount: 0,
      address: "",
      reviewStart: 0,
      reviewCount: 0,
      like: false,
      galleryImgs: ["/images/placeholder-large.png"],
      price: priceStr,
      listingCategory: category,
      saleOff: null,
      isAds: null,
      map: { lat: 0, lng: 0 },
    };

    return NextResponse.json(tool);
  } catch (err: any) {
    console.error(`/api/tools/${id} error:`, err?.message || err);
    return new NextResponse("Failed to fetch tool", { status: 500 });
  }
}
