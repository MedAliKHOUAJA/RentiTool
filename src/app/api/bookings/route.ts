import { NextResponse } from "next/server";
import { query } from "@/db";
import { NotificationService } from "@/features/notifications/application/services/notification.service";
import { AzureServiceBusService } from "@/features/notifications/infrastructure/azure-service-bus.service";
import { NotificationType, NotificationPriority } from "@/features/notifications/domain/notification.types";
import { PostgresNotificationRepository } from "@/features/notifications/infrastructure/postgres-notification.repository";

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
      const titleCol = has(['Title', 'title', 'Name', 'name', 'ToolName', 'toolname', 'tool_name']);

      if (!toolIdCol || !ownerCol || !priceCol) {
        return NextResponse.json({ 
          error: 'Required columns not found in tools table. Please check table structure.' 
        }, { status: 500 });
      }

      const q = (name: string) => `"${name}"`;
      const sql = `
        SELECT 
          ${q(toolIdCol)} as "ToolId", 
          ${q(ownerCol)} as "OwnerId", 
          ${q(priceCol)} as "RentalPricePerDay"
          ${titleCol ? `, ${q(titleCol)} as "Title"` : ''}
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
    let renterName = '';
    try {
      const userResult = await query(`
        SELECT "userId", "FirstName", "LastName" 
        FROM "User" 
        LIMIT 1
      `);
      
      if (userResult.rows.length === 0) {
        return NextResponse.json({ 
          error: 'No users found in the system. Please ensure there are users in the User table.' 
        }, { status: 500 });
      }
      
      renterId = userResult.rows[0].userId;
      renterName = `${userResult.rows[0].FirstName} ${userResult.rows[0].LastName}`;
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

    //  Envoyer la notification au propriétaire
    try {
      console.log('🔔 [Booking] Starting notification process...');
      console.log('   - Owner ID:', ownerId);
      console.log('   - Renter:', renterName);
      console.log('   - Tool:', tool.Title);
      console.log('   - Rental ID:', rentalId);
    
      // Initialiser les services
      console.log('📦 [Booking] Initializing services...');
      const repository = new PostgresNotificationRepository();
      const serviceBusService = new AzureServiceBusService();
      const notificationService = new NotificationService(repository, serviceBusService);
    
      console.log('✅ [Booking] Services initialized');
    
      // Envoyer la notification
      console.log('📤 [Booking] Calling sendNotification...');
      
      await notificationService.sendNotification({
        type: NotificationType.BOOKING_REQUESTED,
        userId: ownerId,
        title: '📅 Nouvelle demande de réservation',
        message: `${renterName} souhaite réserver votre outil "${tool.Title || 'Outil'}" du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}.`,
        data: {
          toolId,
          toolName: tool.Title || 'Outil',
          renterName,
          renterId,
          startDate: startDate,
          endDate: endDate,
          totalPrice,
          days: daysDiff,
          quantity,
          rentalId,
        },
        priority: NotificationPriority.HIGH,
        toolId: parseInt(toolId),
        rentalId: rentalId,
      });
    
      console.log('✅ [Booking] sendNotification completed');
      console.log('✅ [Booking] Notification sent to owner:', ownerId);
    } catch (notifError: any) {
      // Ne pas bloquer la création de réservation si la notification échoue
      console.error('❌ [Booking] Failed to send notification:', notifError);
      console.error('❌ [Booking] Error stack:', notifError.stack);
      console.error('❌ [Booking] Error details:', JSON.stringify(notifError, null, 2));
    }
    
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