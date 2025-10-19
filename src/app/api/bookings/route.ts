import { NextResponse } from "next/server";
import { query } from "@/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toolId, startDate, endDate, quantity } = body;

    // Validate required fields
    if (!toolId || !startDate || !endDate || !quantity) {
      return NextResponse.json({ 
        error: 'Missing required fields: toolId, startDate, endDate, quantity' 
      }, { status: 400 });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return NextResponse.json({ 
        error: 'Start date must be before end date' 
      }, { status: 400 });
    }

    if (start < new Date()) {
      return NextResponse.json({ 
        error: 'Start date cannot be in the past' 
      }, { status: 400 });
    }

    // Get tool information using dynamic table resolution
    let toolResult;
    try {
      // Try to find the tools table dynamically
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

      let resolvedTable = null;
      for (const cand of candidates) {
        const { schema, table } = parseIdent(cand!);
        const colsRes = await query(
          `SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`,
          [schema, table]
        );
        if (colsRes.rows.length) {
          resolvedTable = { schema, table };
          break;
        }
      }

      if (!resolvedTable) {
        return NextResponse.json({ 
          error: 'Tools table not found. Please ensure the database is properly set up with a tools table.' 
        }, { status: 500 });
      }

      // Get column mappings
      const colsRes = await query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`,
        [resolvedTable.schema, resolvedTable.table]
      );
      const columns = colsRes.rows.map((r: any) => r.column_name as string);
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

      const toolIdCol = has(['Toolid', 'ToolId', 'ToolID', 'Id', 'ID', 'id', 'toolid', 'tool_id']);
      const ownerCol = has(['Ownerid', 'OwnerId', 'ownerid', 'owner_id', 'UserId', 'userid', 'user_id']);
      const priceCol = has(['RentalPricePerDay', 'rentalpriceperday', 'rental_price_per_day', 'DailyPrice', 'dailyprice', 'daily_price', 'Price', 'price']);

      if (!toolIdCol || !ownerCol || !priceCol) {
        return NextResponse.json({ 
          error: 'Required columns not found in tools table. Please check table structure.' 
        }, { status: 500 });
      }

      const q = (name: string) => `"${name}"`;
      const sql = `
        SELECT ${q(toolIdCol)} as "ToolId", ${q(ownerCol)} as "OwnerId", ${q(priceCol)} as "RentalPricePerDay"
        FROM ${q(resolvedTable.schema)}.${q(resolvedTable.table)}
        WHERE ${q(toolIdCol)} = $1
      `;

      toolResult = await query(sql, [toolId]);
    } catch (dbError: any) {
      console.error("Database error when fetching tool:", dbError);
      return NextResponse.json({ 
        error: `Database error: Unable to fetch tool information. ${dbError.message}` 
      }, { status: 500 });
    }

    if (toolResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Tool not found' 
      }, { status: 404 });
    }

    const tool = toolResult.rows[0];
    const dailyPrice = tool.RentalPricePerDay || 0;
    
    // Calculate total price
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = dailyPrice * daysDiff * quantity;

    // Use the tool's owner ID (which should exist in your database)
    const ownerId = tool.OwnerId;
    
    // Get a valid renter ID from the User table
    let renterId;
    try {
      const userResult = await query(`
        SELECT "userId" 
        FROM "User" 
        LIMIT 1
      `);
      
      if (userResult.rows.length === 0) {
        return NextResponse.json({ 
          error: 'No users found in the system. Please ensure there are users in the User table.' 
        }, { status: 500 });
      }
      
      renterId = userResult.rows[0].userId;
    } catch (userError: any) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ 
        error: 'Unable to find a valid user for the rental. Please ensure the User table exists and has users.' 
      }, { status: 500 });
    }

    // Check for overlapping rentals for the same tool
    let overlapCheck;
    try {
      overlapCheck = await query(`
        SELECT "RentalId" FROM "Rentals" 
        WHERE "ToolId" = $1 
        AND "StatusId" IN (1, 2) -- Pending or Confirmed status
        AND (
          ("RentalDateStart" <= $2 AND "RentalDateEnd" > $2) OR
          ("RentalDateStart" < $3 AND "RentalDateEnd" >= $3) OR
          ("RentalDateStart" >= $2 AND "RentalDateEnd" <= $3)
        )
      `, [toolId, startDate, endDate]);
    } catch (dbError: any) {
      console.error("Database error when checking overlaps:", dbError);
      return NextResponse.json({ 
        error: 'Database error: Unable to check for overlapping rentals. Please ensure the Rentals table exists.' 
      }, { status: 500 });
    }

    if (overlapCheck.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Tool is not available for the selected dates' 
      }, { status: 409 });
    }

    // Create the rental
    let insertResult;
    try {
      insertResult = await query(`
      INSERT INTO "Rentals" (
        "ToolId", 
        "OwnerId", 
        "RenterId", 
        "TotalPrice", 
        "RentalDateStart", 
        "RentalDateEnd", 
        "StatusId"
      ) VALUES ($1, $2, $3, $4, $5, $6, 1)
      RETURNING "RentalId"
    `, [toolId, ownerId, renterId, totalPrice, startDate, endDate]);
    } catch (dbError: any) {
      console.error("Database error when creating rental:", dbError);
      return NextResponse.json({ 
        error: 'Database error: Unable to create rental. Please ensure the Rentals table exists and is properly set up.' 
      }, { status: 500 });
    }

    const rentalId = insertResult.rows[0].RentalId;

    return NextResponse.json({
      message: `Reservation created successfully! Rental ID: ${rentalId}`,
      rentalId,
      totalPrice,
      days: daysDiff
    });
  } catch (err: any) {
    console.error("/api/bookings POST error:", err?.message || err);
    return NextResponse.json({ 
      error: `Failed to create booking: ${err?.message || err}` 
    }, { status: 500 });
  }
}