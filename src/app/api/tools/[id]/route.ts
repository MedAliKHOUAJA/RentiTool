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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // Don't force number; let PG coerce when possible
  const rawId: any = id;
  try {
    const envTable = process.env.TOOLS_TABLE?.trim();
    const candidates = [
      envTable,
      'tools','Tools','public."Tools"','public.tools',
      'tool','Tool','public."Tool"','public.tool',
    ].filter(Boolean) as string[];

    const parseIdent = (ident: string): { schema: string; table: string } => {
      const defSchema = 'public';
      if (ident.includes('.')) {
        const [schemaRaw, tableRaw] = ident.split('.', 2);
        const unquote = (s: string) => s.replace(/^"|"$/g, '');
        return { schema: unquote(schemaRaw), table: unquote(tableRaw) };
      }
      return { schema: defSchema, table: ident.replace(/^"|"$/g, '') };
    };

    const tryResolve = async () => {
      for (const cand of candidates) {
        const { schema, table } = parseIdent(cand!);
        const colsRes = await query(
          `SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`,
          [schema, table]
        );
        if (colsRes.rows.length) {
          return { schema, table };
        }
      }
      return null;
    };

    const resolved = await tryResolve();
    if (!resolved) {
      return new NextResponse('Tools table not found. Set TOOLS_TABLE env.', { status: 500 });
    }
    const { schema, table } = resolved;

    // Detect primary key
    const pkRes = await query(
      `SELECT kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'PRIMARY KEY'
       ORDER BY kcu.ordinal_position`,
      [schema, table]
    );
    const pkCol: string | undefined = pkRes.rows[0]?.column_name;
    if (!pkCol) {
      return new NextResponse('Primary key not found for tools table', { status: 500 });
    }

    const q = (s: string) => `"${s}"`;
    const from = `${q(schema)}.${q(table)}`;
    const sql = `DELETE FROM ${from} WHERE ${q(pkCol)} = $1`;
    const res = await query(sql, [rawId]);
    // res.rowCount is number of deleted rows for pg
    return new NextResponse(null, { status: res.rowCount ? 204 : 404 });
  } catch (err: any) {
    console.error(`/api/tools/${id} DELETE error:`, err?.message || err);
    return new NextResponse('Failed to delete tool', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const body = await request.json().catch(() => ({}));
    const {
      title,
      description,
      brand,
      model,
      rentalPricePerDay,
      rentalPricePerWeek,
      categoryId,
      subCategoryId,
      ownerId,
      isActive,
      statusId,
    } = body || {};

    const envTable = process.env.TOOLS_TABLE?.trim();
    const candidates = [
      envTable,
      'tools','Tools','public."Tools"','public.tools',
      'tool','Tool','public."Tool"','public.tool',
    ].filter(Boolean) as string[];

    const parseIdent = (ident: string): { schema: string; table: string } => {
      const defSchema = 'public';
      if (ident.includes('.')) {
        const [schemaRaw, tableRaw] = ident.split('.', 2);
        const unquote = (s: string) => s.replace(/^"|"$/g, '');
        return { schema: unquote(schemaRaw), table: unquote(tableRaw) };
      }
      return { schema: defSchema, table: ident.replace(/^"|"$/g, '') };
    };

    const tryResolve = async () => {
      for (const cand of candidates) {
        const { schema, table } = parseIdent(cand!);
        const colsRes = await query(
          `SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`,
          [schema, table]
        );
        if (colsRes.rows.length) {
          return { schema, table, columns: colsRes.rows.map((r: any) => r.column_name as string) };
        }
      }
      return null;
    };

    const resolved = await tryResolve();
    if (!resolved) {
      return new NextResponse('Tools table not found. Set TOOLS_TABLE env.', { status: 500 });
    }
    const { schema, table, columns } = resolved;
    const lowerMap: Record<string, string> = Object.fromEntries(columns.map((c: string) => [c.toLowerCase(), c]));
    const has = (names: string[]) => {
      for (const n of names) {
        const hit = lowerMap[n.toLowerCase()];
        if (hit) return hit;
      }
      return undefined;
    };

    // Detect PK
    const pkRes = await query(
      `SELECT kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'PRIMARY KEY'
       ORDER BY kcu.ordinal_position`,
      [schema, table]
    );
    const pkCol: string | undefined = pkRes.rows[0]?.column_name;
    if (!pkCol) {
      return new NextResponse('Primary key not found for tools table', { status: 500 });
    }

    const colMap: Record<string, string | undefined> = {
      title: has(['Title','title','Name','name']),
      description: has(['Description','description','Details','details']),
      brand: has(['Brand','brand']),
      model: has(['Model','model']),
      rentalPricePerDay: has(['RentalPricePerDay','rentalpriceperday','rental_price_per_day','DailyPrice','dailyprice','daily_price','Price','price']),
      rentalPricePerWeek: has(['RentalPricePerWeek','rentalpriceperweek','rental_price_per_week']),
      categoryId: has(['CategoryId','categoryid','category_id']),
      subCategoryId: has(['SubCategoryId','subcategoryid','sub_category_id']),
      ownerId: has(['OwnerId','ownerid','owner_id','UserId','userid','user_id']),
      isActive: has(['IsActive','isactive','is_active','Active','active']),
      statusId: has(['StatusId','statusid','status_id']),
    };

    const sets: string[] = [];
    const values: any[] = [];
    const q = (s: string) => `"${s}"`;
    const addIf = (field: keyof typeof colMap, val: any) => {
      const colName = colMap[field];
      if (!colName) return;
      if (val === undefined) return;
      sets.push(`${q(colName)} = $${values.length + 1}`);
      values.push(val);
    };

    addIf('title', title != null ? String(title).trim() : undefined);
    addIf('description', description != null ? String(description).trim() : undefined);
    addIf('brand', brand != null ? String(brand).trim() : undefined);
    addIf('model', model != null ? String(model).trim() : undefined);
    addIf('rentalPricePerDay', rentalPricePerDay != null ? Number(rentalPricePerDay) : undefined);
    addIf('rentalPricePerWeek', rentalPricePerWeek != null ? Number(rentalPricePerWeek) : undefined);
    addIf('categoryId', categoryId != null ? Number(categoryId) : undefined);
    addIf('subCategoryId', subCategoryId != null ? Number(subCategoryId) : undefined);
    if (ownerId !== undefined) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const ownerUuid = typeof ownerId === 'string' && uuidRegex.test(ownerId) ? ownerId : null;
      if (ownerUuid === null) {
        return new NextResponse('Invalid ownerId: must be a UUID string', { status: 400 });
      }
      addIf('ownerId', ownerUuid);
    }
    addIf('isActive', isActive != null ? Boolean(isActive) : undefined);
    addIf('statusId', statusId != null ? Number(statusId) : undefined);

    if (!sets.length) {
      return new NextResponse('No updatable fields provided', { status: 400 });
    }

    const from = `${q(schema)}.${q(table)}`;
    const sql = `UPDATE ${from} SET ${sets.join(', ')} WHERE ${q(pkCol)} = $${values.length + 1} RETURNING ${q(pkCol)}`;
    const res = await query(sql, [...values, id]);
    if (!res.rowCount) {
      return new NextResponse('Tool not found', { status: 404 });
    }
    return NextResponse.json({ id: res.rows[0][pkCol] });
  } catch (err: any) {
    console.error(`/api/tools/${id} PUT error:`, err?.message || err);
    return new NextResponse('Failed to update tool', { status: 500 });
  }
}
