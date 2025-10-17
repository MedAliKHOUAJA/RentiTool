import { NextResponse } from "next/server";
import { query } from "@/db";
import { DEMO_TOOL_CATEGORIES } from "@/data/taxonomies";
import { DEMO_AUTHORS } from "@/data/authors";
import { ToolDataType } from "@/data/types";
import type { ToolEntity } from "@/data/tools";
import { Route } from "@/routers/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const ownerFilter = url.searchParams.get('ownerId') || undefined;
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
    const lowerMap: Record<string, string> = Object.fromEntries(
      columns.map((c: string) => [c.toLowerCase(), c])
    );
    const has = (names: string[]) => {
      for (const n of names) {
        const hit = lowerMap[n.toLowerCase()];
        if (hit) return hit;
      }
      return undefined;
    };
    // Try to detect the primary key column first
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
    // If still no id, heuristically pick a column that ends with 'id'
    if (!col.id) {
      col.id = columns.find((c) => c.toLowerCase().endsWith("id"));
    }
    // If still no id after heuristics, we'll synthesize one in SELECT using row_number()
    // Build SELECT with exact case quoting, aliasing to canonical names. For missing columns, use NULL/0 defaults in JS later, so we only select present columns.
    const q = (name: string) => `"${name}"`;
    const base = (name: string) => `t.${q(name)}`;
    const selectParts: string[] = [];
    if (col.id) {
      selectParts.push(`${base(col.id)} as "toolId"`);
    } else {
      // Fallback: generate a synthetic id so the list can render
      selectParts.push(`row_number() over()::int as "toolId"`);
    }
    if (col.owner) selectParts.push(`${base(col.owner)} as "ownerId"`);
    if (col.title) selectParts.push(`${base(col.title)} as "title"`);
    if (col.description)
      selectParts.push(`${base(col.description)} as "description"`);
    if (col.category) selectParts.push(`${base(col.category)} as "categoryId"`);
    if (col.subcategory)
      selectParts.push(`${base(col.subcategory)} as "subCategoryId"`);
    if (col.brand) selectParts.push(`${base(col.brand)} as "brand"`);
    if (col.model) selectParts.push(`${base(col.model)} as "model"`);
    if (col.priceDay)
      selectParts.push(`${base(col.priceDay)} as "rentalPricePerDay"`);
    if (col.priceWeek)
      selectParts.push(`${base(col.priceWeek)} as "rentalPricePerWeek"`);
    if (col.isActive) selectParts.push(`${base(col.isActive)} as "isActive"`);
    if (col.statusId) selectParts.push(`${base(col.statusId)} as "statusId"`);
    // Discover FKs for Category and SubCategory to fetch human-readable names
    const fkRows = await query(
      `SELECT kcu.column_name AS fk_column,
              ccu.table_schema AS ref_schema,
              ccu.table_name   AS ref_table,
              ccu.column_name  AS ref_column
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1 AND tc.table_name = $2`,
      [schema, table]
    );

  const fkFor = (colName?: string) => fkRows.rows.find((r: any) => r.fk_column === colName);
  const joins: string[] = [];
  const extraSelects: string[] = [];
  const qq = (name: string) => `"${name}"`;
  const qa = (alias: string, col: string) => `${alias}.${qq(col)}`;

    const addLabelJoin = async (
      toolCol: string | undefined,
      alias: string,
      outAlias: string,
      labelCandidates: string[]
    ) => {
      if (!toolCol) return;
      const fk = fkFor(toolCol);
      if (!fk) return;
      const refSchema = fk.ref_schema as string;
      const refTable = fk.ref_table as string;
      const refColumn = fk.ref_column as string;
      const pkRes = await query(
        `SELECT kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
         WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'PRIMARY KEY'
         ORDER BY kcu.ordinal_position`,
        [refSchema, refTable]
      );
      const refPk: string = pkRes.rows[0]?.column_name || refColumn;
      const colsRes = await query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`,
        [refSchema, refTable]
      );
      const refCols: string[] = colsRes.rows.map((r: any) => r.column_name);
      const lowerMap: Record<string, string> = Object.fromEntries(refCols.map(c => [c.toLowerCase(), c]));
      const labelCol = labelCandidates.map(n => lowerMap[n.toLowerCase()]).find(Boolean) || refPk;
  joins.push(`LEFT JOIN ${qq(refSchema)}.${qq(refTable)} ${alias} ON t.${qq(toolCol)} = ${alias}.${qq(refPk)}`);
      extraSelects.push(`${qa(alias, labelCol)} as ${q(outAlias)}`);
    };

    try {
      await addLabelJoin(col.category, 'cat', 'categoryName', ['CategoryName','name','title','label','description','category_name']);
    } catch (e) {
      console.warn('Category label join discovery failed, skipping');
    }
    try {
      await addLabelJoin(col.subcategory, 'subcat', 'subCategoryName', ['SubCategoryName','name','title','label','description','sub_category_name']);
    } catch (e) {
      console.warn('SubCategory label join discovery failed, skipping');
    }

    // Try to join images table to fetch primary image URL
    try {
      const imagesEnv = process.env.IMAGES_TABLE?.trim();
      const imgCandidates = [imagesEnv, 'images','Images','public."Images"','public.images','image','Image','public."Image"','public.image'].filter(Boolean) as string[];
      // Resolve images table
      for (const cand of imgCandidates) {
        const parseIdent = (ident: string): { schema: string; table: string } => {
          const defSchema = 'public';
          if (ident.includes('.')) { const [s,t] = ident.split('.',2); const unq=(x:string)=>x.replace(/^"|"$/g,''); return { schema: unq(s), table: unq(t) }; }
          return { schema: 'public', table: ident.replace(/^"|"$/g,'') };
        };
        const { schema: ischema, table: itable } = parseIdent(cand!);
        const colsRes = await query(`SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`, [ischema, itable]);
        if (!colsRes.rows.length) continue;
        const icols: string[] = colsRes.rows.map((r:any)=>r.column_name);
        const imap: Record<string,string> = Object.fromEntries(icols.map(c=>[c.toLowerCase(), c]));
        const ipk = imap['imageid'] || imap['id'] || imap['image_id'];
        const itool = imap['toolid'] || imap['tool_id'];
        const iprimary = imap['isprimarytoolimage'] || imap['is_primary'] || imap['isprimary'];
        if (!ipk || !itool) continue;
        // LATERAL subquery to pick preferred image id
        const lateral = `LEFT JOIN LATERAL (
          SELECT ${qq(ipk)} as img_id${iprimary ? `, ${qq(iprimary)} as is_primary` : ''}
          FROM ${qq(ischema)}.${qq(itable)} i
          WHERE i.${qq(itool)} = t.${qq(col.id!)}
          ORDER BY ${iprimary ? `i.${qq(iprimary)} DESC,` : ''} i.${qq(ipk)} DESC
          LIMIT 1
        ) img ON true`;
        joins.push(lateral);
        extraSelects.push(`img.img_id as ${q('imageId')}`);
        break;
      }
    } catch (e) {
      console.warn('Image join discovery failed, skipping');
    }

  const select = [selectParts.join(', '), ...extraSelects].filter(Boolean).join(', ');
  const from = `${qq(schema)}.${qq(table)} t`;
  const whereParts: string[] = [];
  const params: any[] = [];
  if (ownerFilter && col.owner) {
    whereParts.push(`t.${qq(col.owner)} = $${params.length + 1}`);
    params.push(ownerFilter);
  }
  const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
    const sql = `SELECT ${select} FROM ${from} ${joins.join(' ')} ${whereSql}`;
    let rows: any[];
    try {
      const res = await query(sql, params);
      rows = res.rows;
    } catch (e: any) {
      // Fallback: run without joins if label discovery caused an error
      console.warn('GET /api/tools join query failed, falling back without joins:', e?.message || e);
      const fallbackSql = `SELECT ${selectParts.join(', ')} FROM ${from} ${whereSql}`;
      const res2 = await query(fallbackSql, params);
      rows = res2.rows;
    }

  const tools: ToolDataType[] = (rows as unknown as ToolEntity[]).map(
      (r: ToolEntity) => {
  const baseCategory = DEMO_TOOL_CATEGORIES.find((c) => c.id === r.categoryId) || DEMO_TOOL_CATEGORIES[0];
  const categoryName = (r as any).categoryName ?? baseCategory.name;
  const category = { ...baseCategory, name: categoryName };

        // Simple deterministic author pick until users are DB-backed
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

        const imageId: number | null = (r as any).imageId ?? null;
        const featuredImage = imageId ? `/api/images/${imageId}` : "/images/placeholder-large.png";
        const tool: ToolDataType = {
          id: r.toolId,
          author,
          date: new Date().toISOString().slice(0, 10),
          href: `/listing-tool-detail?id=${r.toolId}` as Route,
          title,
          featuredImage,
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
        return tool;
      }
    );

    return NextResponse.json(tools);
  } catch (err: any) {
    console.error("/api/tools error:", err?.message || err);
    // Return the actual error message to help debugging while developing
    const msg = typeof err?.message === 'string' ? err.message : 'Failed to fetch tools';
    return new NextResponse(msg, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    if (!title || typeof title !== 'string' || !title.trim()) {
      return new NextResponse('Title is required', { status: 400 });
    }

    const envTable = process.env.TOOLS_TABLE?.trim();
    const candidates = [
      envTable,
      'tools', 'Tools', 'public."Tools"', 'public.tools',
      'tool', 'Tool', 'public."Tool"', 'public.tool',
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
    const lowerMap: Record<string, string> = Object.fromEntries(
      columns.map((c: string) => [c.toLowerCase(), c])
    );
    const has = (names: string[]) => {
      for (const n of names) {
        const hit = lowerMap[n.toLowerCase()];
        if (hit) return hit;
      }
      return undefined;
    };

    // Map body keys to actual DB columns when available
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

    const insertCols: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];
    const q = (name: string) => `"${name}"`;

    const addIf = (field: keyof typeof colMap, val: any) => {
      const colName = colMap[field];
      if (colName == null) return; // DB doesn't have this column
      if (val === undefined) return; // user didn't provide
      insertCols.push(q(colName));
      placeholders.push(`$${placeholders.length + 1}`);
      values.push(val);
    };

    addIf('title', String(title).trim());
    addIf('description', description ? String(description).trim() : undefined);
    addIf('brand', brand ? String(brand).trim() : undefined);
    addIf('model', model ? String(model).trim() : undefined);
    addIf('rentalPricePerDay', rentalPricePerDay != null ? Number(rentalPricePerDay) : undefined);
    addIf('rentalPricePerWeek', rentalPricePerWeek != null ? Number(rentalPricePerWeek) : undefined);
    addIf('categoryId', categoryId != null ? Number(categoryId) : undefined);
    addIf('subCategoryId', subCategoryId != null ? Number(subCategoryId) : undefined);
    // ownerId is UUID string
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const ownerUuid = typeof ownerId === 'string' && uuidRegex.test(ownerId) ? ownerId : ownerId === undefined ? undefined : null;
    if (ownerUuid === null) {
      return new NextResponse('Invalid ownerId: must be a UUID string', { status: 400 });
    }
    // Require ownerId if the table has a NOT NULL owner column
    if (colMap.ownerId && ownerUuid === undefined) {
      return new NextResponse('ownerId is required', { status: 400 });
    }
    addIf('ownerId', ownerUuid);
    addIf('isActive', isActive != null ? Boolean(isActive) : undefined);
    addIf('statusId', statusId != null ? Number(statusId) : undefined);

    if (!insertCols.length) {
      return new NextResponse('No insertable fields for this schema', { status: 400 });
    }

    const from = `"${schema}"."${table}"`;
    const returningRes = await query(
      `SELECT kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'PRIMARY KEY'
       ORDER BY kcu.ordinal_position`,
      [schema, table]
    );
    const pkCol: string | undefined = returningRes.rows[0]?.column_name;
    const returningList = [pkCol, colMap.title, colMap.description, colMap.brand, colMap.model, colMap.rentalPricePerDay, colMap.categoryId, colMap.subCategoryId]
      .filter(Boolean)
      .map((c) => q(c as string))
      .join(', ');

    const sql = `INSERT INTO ${from} (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING ${returningList || '*'}`;
    const ins = await query(sql, values);
    const r: any = ins.rows[0] || {};

    // Map back to UI type
    const createdId = pkCol ? r[pkCol] : undefined;
    const ui = {
      id: createdId ?? null,
      title: r[colMap.title as string] ?? title,
      description: r[colMap.description as string] ?? description ?? undefined,
      brand: r[colMap.brand as string] ?? brand ?? undefined,
      model: r[colMap.model as string] ?? model ?? undefined,
      rentalPricePerDay: r[colMap.rentalPricePerDay as string] ?? rentalPricePerDay ?? 0,
    };

    return NextResponse.json(ui, { status: 201 });
  } catch (err: any) {
    console.error('/api/tools POST error:', err?.message || err);
    return new NextResponse('Failed to create tool', { status: 500 });
  }
}
