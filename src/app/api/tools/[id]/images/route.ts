import { NextResponse } from "next/server";
import { query } from "@/db";

const resolveTable = async (candidates: string[]) => {
  const parseIdent = (ident: string): { schema: string; table: string } => {
    const defSchema = "public";
    if (ident.includes(".")) {
      const [schemaRaw, tableRaw] = ident.split(".", 2);
      const unquote = (s: string) => s.replace(/^"|"$/g, "");
      return { schema: unquote(schemaRaw), table: unquote(tableRaw) };
    }
    return { schema: defSchema, table: ident.replace(/^"|"$/g, "") };
  };
  for (const cand of candidates) {
    const { schema, table } = parseIdent(cand!);
    const colsRes = await query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`,
      [schema, table]
    );
    if (colsRes.rows.length)
      return {
        schema,
        table,
        columns: colsRes.rows.map((r: any) => r.column_name as string),
      };
  }
  return null;
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const toolId = params.id;
    const imagesEnv = process.env.IMAGES_TABLE?.trim();
    const imgCandidates = [
      imagesEnv,
      // Common names
      "images",
      "Images",
      'public."Images"',
      "public.images",
      "image",
      "Image",
      'public."Image"',
      "public.image",
      // Tool-specific variants
      "toolimages",
      "ToolImages",
      'public."ToolImages"',
      "public.toolimages",
      "toolimage",
      "ToolImage",
      'public."ToolImage"',
      "public.toolimage",
      "tool_images",
      "Tool_Images",
      'public."Tool_Images"',
      "public.tool_images",
    ].filter(Boolean) as string[];
    const imgResolved = await resolveTable(imgCandidates);
    if (!imgResolved)
      return new NextResponse("Images table not found", { status: 500 });
    const { schema: ischema, table: itable, columns: icols } = imgResolved;
    const lowerMap: Record<string, string> = Object.fromEntries(
      icols.map((c) => [c.toLowerCase(), c])
    );
    const has = (...names: string[]) =>
      names.map((n) => lowerMap[n.toLowerCase()]).find(Boolean);
    const pk = has("imageid", "id", "image_id", "toolimageid", "tool_image_id");
    const toolCol = has("toolid", "tool_id", "toolid");
    const isPrimary = has(
      "isprimarytoolimage",
      "is_primary",
      "isprimary",
      "is_primary_tool_image"
    );
    if (!pk || !toolCol)
      return new NextResponse("Images schema invalid", { status: 500 });
    const q = (s: string) => `"${s}"`;
    const from = `${q(ischema)}.${q(itable)}`;
    const sql = `SELECT ${q(pk)} as id, ${q(
      isPrimary || pk
    )} as primary FROM ${from} WHERE ${q(toolCol)} = $1 ORDER BY ${q(
      pk
    )} DESC LIMIT 50`;
    const res = await query(sql, [toolId]);
    const images = res.rows.map((r: any) => ({
      id: r.id,
      isPrimary: Boolean(r.primary),
      url: `/api/images/${r.id}`,
    }));
    return NextResponse.json({ images });
  } catch (err: any) {
    console.error("/api/tools/[id]/images GET error:", err?.message || err);
    return new NextResponse("Failed to list images", { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const toolId = params.id;
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) return new NextResponse("Missing file", { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());

    const imagesEnv = process.env.IMAGES_TABLE?.trim();
    const imgCandidates = [
      imagesEnv,
      "images",
      "Images",
      'public."Images"',
      "public.images",
      "image",
      "Image",
      'public."Image"',
      "public.image",
      "toolimages",
      "ToolImages",
      'public."ToolImages"',
      "public.toolimages",
      "toolimage",
      "ToolImage",
      'public."ToolImage"',
      "public.toolimage",
      "tool_images",
      "Tool_Images",
      'public."Tool_Images"',
      "public.tool_images",
    ].filter(Boolean) as string[];
    const imgResolved = await resolveTable(imgCandidates);
    if (!imgResolved)
      return new NextResponse("Images table not found", { status: 500 });
    const { schema: ischema, table: itable, columns: icols } = imgResolved;
    const lowerMap: Record<string, string> = Object.fromEntries(
      icols.map((c) => [c.toLowerCase(), c])
    );
    const has = (...names: string[]) =>
      names.map((n) => lowerMap[n.toLowerCase()]).find(Boolean);
    const pk = has("imageid", "id", "image_id", "toolimageid", "tool_image_id");
    const bin = has(
      "imagebinary",
      "data",
      "binary",
      "blob",
      "content",
      "bytes",
      "file",
      "filedata"
    );
    const toolCol = has("toolid", "tool_id", "toolid");
    const isPrimary = has(
      "isprimarytoolimage",
      "is_primary",
      "isprimary",
      "is_primary_tool_image"
    );
    if (!pk || !bin || !toolCol)
      return new NextResponse("Images schema invalid", { status: 500 });
    const q = (s: string) => `"${s}"`;
    const from = `${q(ischema)}.${q(itable)}`;

    // If table tracks primary flag, make the first image for this tool primary
    let makePrimary = false;
    if (isPrimary) {
      const check = await query(
        `SELECT 1 FROM ${from} WHERE ${q(toolCol)}=$1 LIMIT 1`,
        [toolId]
      );
      makePrimary = check.rows.length === 0;
    }

    const cols = [q(bin), q(toolCol)];
    const values: any[] = [buf, toolId];
    if (isPrimary) {
      cols.push(q(isPrimary));
      values.push(makePrimary);
    }
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    const sql = `INSERT INTO ${from} (${cols.join(
      ","
    )}) VALUES (${placeholders.join(",")}) RETURNING ${q(pk)} as id`;
    const ins = await query(sql, values);
    const idNew = ins.rows[0]?.id;
    return NextResponse.json(
      { id: idNew, url: `/api/images/${idNew}`, isPrimary: makePrimary },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("/api/tools/[id]/images POST error:", err?.message || err);
    return new NextResponse("Failed to upload image", { status: 500 });
  }
}
