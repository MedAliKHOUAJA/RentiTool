import { NextResponse } from "next/server";
import { query } from "@/db";

const detectContentType = (buf: Buffer): string => {
  if (buf.length >= 8) {
    // PNG
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
    // JPEG
    if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
    // GIF
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
    // WebP "RIFF....WEBP"
    if (buf[0]===0x52 && buf[1]===0x49 && buf[2]===0x46 && buf[3]===0x46 && buf[8]===0x57 && buf[9]===0x45 && buf[10]===0x42 && buf[11]===0x50) return 'image/webp';
  }
  return 'application/octet-stream';
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const envTable = process.env.IMAGES_TABLE?.trim();
    const candidates = [
      envTable,
      'images','Images','public."Images"','public.images',
      'image','Image','public."Image"','public.image'
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
    if (!resolved) return new NextResponse('Images table not found', { status: 500 });
    const { schema, table, columns } = resolved;
    const lowerMap: Record<string,string> = Object.fromEntries(columns.map(c => [c.toLowerCase(), c]));
    const has = (...names: string[]) => names.map(n => lowerMap[n.toLowerCase()]).find(Boolean);
    const pk = has('imageid','id','image_id');
    const bin = has('imagebinary','data','binary','blob');
    if (!pk || !bin) return new NextResponse('Images schema missing PK or binary column', { status: 500 });
    const q = (s: string) => `"${s}"`;
    const from = `${q(schema)}.${q(table)}`;
    const sql = `SELECT ${q(bin)} AS bin FROM ${from} WHERE ${q(pk)} = $1`;
    const res = await query(sql, [id]);
    if (!res.rows.length) return new NextResponse('Not found', { status: 404 });
  const buf: Buffer = res.rows[0].bin;
  const ct = detectContentType(buf);
  const body = new Uint8Array(buf);
  return new NextResponse(body, { headers: { 'Content-Type': ct, 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } catch (err: any) {
    console.error('/api/images/[id] GET error:', err?.message || err);
    return new NextResponse('Failed to load image', { status: 500 });
  }
}
