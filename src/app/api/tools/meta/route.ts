import { NextResponse } from "next/server";
import { query } from "@/db";

export async function GET() {
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
          return { schema, table };
        }
      }
      return null;
    };

    const resolved = await tryResolve();
    if (!resolved) {
      return new NextResponse("Tools table not found. Set TOOLS_TABLE env.", {
        status: 500,
      });
    }

    const { schema, table } = resolved;

    // Discover foreign keys on tools table
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

    const result: Record<
      string,
      {
        valueType: "number" | "string";
        options: Array<{ value: any; label: string }>;
      }
    > = {};

    for (const row of fkRes.rows) {
      const fkColumn = row.fk_column as string;
      const refSchema = row.ref_schema as string;
      const refTable = row.ref_table as string;
      const refColumn = row.ref_column as string;

      // Determine PK of referenced table and a label column
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
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`,
        [refSchema, refTable]
      );
      const cols = colsRes.rows as Array<{
        column_name: string;
        data_type: string;
      }>;
      const lowerMap: Record<string, string> = Object.fromEntries(
        cols.map((c) => [c.column_name.toLowerCase(), c.column_name])
      );
      const labelCandidateNames = [
        "categoryname",
        "subcategoryname",
        "name",
        "title",
        "label",
        "description",
        "category_name",
        "sub_category_name",
      ];
      let labelCol =
        labelCandidateNames.map((n) => lowerMap[n]).find(Boolean) || refPk;

      // Determine value type for UI based on referencing column type
      const refTypeRes = await query(
        `SELECT data_type FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 AND column_name=$3`,
        [schema, table, fkColumn]
      );
      const dataType: string = refTypeRes.rows[0]?.data_type || "";
      const valueType: "number" | "string" =
        /int|numeric|double|real|decimal/i.test(dataType) ? "number" : "string";

      // Fetch options (limit to 200)
      const q = (x: string) => `"${x}"`;
      const refFrom = `"${refSchema}"."${refTable}"`;
      const optSql = `SELECT ${q(refPk)} as value, ${q(
        labelCol
      )} as label FROM ${refFrom} ORDER BY ${q(labelCol)} ASC LIMIT 200`;
      const optsRes = await query(optSql);
      const options = optsRes.rows.map((r: any) => ({
        value: r.value,
        label: String(r.label ?? r.value),
      }));

      result[fkColumn] = { valueType, options };
    }

    return NextResponse.json({ foreignKeys: result });
  } catch (err: any) {
    console.error("/api/tools/meta error:", err?.message || err);
    return new NextResponse("Failed to load tool metadata", { status: 500 });
  }
}
