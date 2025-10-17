import { NextResponse } from "next/server";
import { query } from "@/db";

// Utilities
const q = (s: string) => `"${s}"`;
const parseIdent = (ident: string): { schema: string; table: string } => {
  const defSchema = "public";
  if (ident.includes(".")) {
    const [schemaRaw, tableRaw] = ident.split(".", 2);
    const unq = (x: string) => x.replace(/^"|"$/g, "");
    return { schema: unq(schemaRaw), table: unq(tableRaw) };
  }
  return { schema: defSchema, table: ident.replace(/^"|"$/g, "") };
};

async function resolveImages() {
  const imagesEnv = process.env.IMAGES_TABLE?.trim();
  const candidates = [
    imagesEnv,
    "images",
    "Images",
    'public."Images"',
    "public.images",
    "image",
    "Image",
    'public."Image"',
    "public.image",
  ].filter(Boolean) as string[];

  for (const cand of candidates) {
    const { schema, table } = parseIdent(cand!);
    const colsRes = await query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`,
      [schema, table]
    );
    if (!colsRes.rows.length) continue;
    const cols: string[] = colsRes.rows.map((r: any) => r.column_name);
    const m = Object.fromEntries(cols.map((c) => [c.toLowerCase(), c]));
    const pk = m["imageid"] || m["id"] || m["image_id"];
    const toolCol = m["toolid"] || m["tool_id"];
    const primaryCol = m["isprimarytoolimage"] || m["is_primary"] || m["isprimary"];
    if (!pk || !toolCol) continue;
    return { schema, table, pk, toolCol, primaryCol } as const;
  }
  return null;
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const { id: toolId, imageId } = params;
    const resolved = await resolveImages();
    if (!resolved) return new NextResponse("Images table not found", { status: 500 });
    const { schema, table, pk, toolCol } = resolved;
    const from = `${q(schema)}.${q(table)}`;
    const sql = `DELETE FROM ${from} WHERE ${q(pk)}=$1 AND ${q(toolCol)}=$2`;
    const res = await query(sql, [imageId, toolId]);
    return new NextResponse(null, { status: res.rowCount ? 204 : 404 });
  } catch (err: any) {
    console.error('/api/tools/[id]/images/[imageId] DELETE error:', err?.message || err);
    return new NextResponse('Failed to delete image', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const { id: toolId, imageId } = params;
    const resolved = await resolveImages();
    if (!resolved) return new NextResponse('Images table not found', { status: 500 });
    const { schema, table, pk, toolCol, primaryCol } = resolved;
    if (!primaryCol) return new NextResponse('Images schema invalid: missing primary flag column', { status: 500 });
    const from = `${q(schema)}.${q(table)}`;
    // 1) Set target image as primary; if not found, don't alter others
    const setTarget = await query(
      `UPDATE ${from} SET ${q(primaryCol)}=true WHERE ${q(pk)}=$1 AND ${q(toolCol)}=$2`,
      [imageId, toolId]
    );
    if (!setTarget.rowCount) return new NextResponse(null, { status: 404 });
    // 2) Clear primary from other images of the same tool
    await query(
      `UPDATE ${from} SET ${q(primaryCol)}=false WHERE ${q(toolCol)}=$1 AND ${q(pk)}<>$2`,
      [toolId, imageId]
    );
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error('/api/tools/[id]/images/[imageId] PUT error:', err?.message || err);
    return new NextResponse('Failed to set primary image', { status: 500 });
  }
}
