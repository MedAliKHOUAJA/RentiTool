import { NextResponse } from "next/server";
import { query } from "@/db";

// Returns subcategory options filtered by a given categoryId.
// It discovers the SubCategory FK on the Tools table dynamically and
// figures out the SubCategory table + label column, then filters by its CategoryId column.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const rawCategoryId = url.searchParams.get("categoryId");
    if (!rawCategoryId) {
      return new NextResponse("Missing categoryId", { status: 400 });
    }

    // CategoryId from screenshots is an integer; attempt number, but pass as text if not numeric
    const categoryIdNumeric = /^-?\d+$/.test(rawCategoryId) ? Number(rawCategoryId) : rawCategoryId;

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

    // Find the FK from Tools to SubCategory table
    const fkRes = await query(
      `SELECT kcu.column_name AS fk_column,
              ccu.table_schema AS ref_schema,
              ccu.table_name   AS ref_table,
              ccu.column_name  AS ref_column
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY'
         AND tc.table_schema = $1
         AND tc.table_name = $2`,
      [schema, table]
    );

    const fkRows: Array<{ fk_column: string; ref_schema: string; ref_table: string; ref_column: string }> = fkRes.rows;
    const subFk = fkRows.find(r => /sub\s*_?category/i.test(r.fk_column) || /sub\s*_?category/i.test(r.ref_table));
    if (!subFk) {
      return NextResponse.json({ valueType: 'number', options: [] });
    }

    const refSchema = subFk.ref_schema;
    const refTable = subFk.ref_table;

    // Determine PK of SubCategory table and a label column
    const pkRes = await query(
      `SELECT kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'PRIMARY KEY'
       ORDER BY kcu.ordinal_position`,
      [refSchema, refTable]
    );
    const refPk: string = pkRes.rows[0]?.column_name || subFk.ref_column;

    const colsRes = await query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`,
      [refSchema, refTable]
    );
    const cols = colsRes.rows as Array<{ column_name: string; data_type: string }>;
    const lowerMap: Record<string, string> = Object.fromEntries(cols.map(c => [c.column_name.toLowerCase(), c.column_name]));

    const labelCandidateNames = ['subcategoryname','name','title','label','description','sub_category_name'];
    const labelCol = labelCandidateNames.map(n => lowerMap[n]).find(Boolean) || refPk;

    // Find the CategoryId column on SubCategory table
    const catIdCandidateNames = ['categoryid','category_id','category'];
    const categoryRefCol = catIdCandidateNames.map(n => lowerMap[n]).find(Boolean);
    if (!categoryRefCol) {
      return new NextResponse('Category reference column not found on SubCategory table', { status: 500 });
    }

    // Determine value type based on PK type
    const pkTypeRow = cols.find(c => c.column_name === refPk);
    const valueType: 'number'|'string' = pkTypeRow && /int|numeric|double|real|decimal/i.test(pkTypeRow.data_type) ? 'number' : 'string';

    const qq = (x: string) => `"${x}"`;
    const fromRef = `${qq(refSchema)}.${qq(refTable)}`;

    // Filter by category id
    const optsRes = await query(
      `SELECT ${qq(refPk)} as value, ${qq(labelCol)} as label
       FROM ${fromRef}
       WHERE ${qq(categoryRefCol)} = $1
       ORDER BY ${qq(labelCol)} ASC
       LIMIT 200`,
      [categoryIdNumeric as any]
    );
    const options = optsRes.rows.map((r: any) => ({ value: r.value, label: String(r.label ?? r.value) }));

    return NextResponse.json({ valueType, options });
  } catch (err: any) {
    console.error('/api/tools/meta/subcategories error:', err?.message || err);
    return new NextResponse('Failed to load subcategories', { status: 500 });
  }
}
