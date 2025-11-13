import { NextResponse } from "next/server";
import { query } from "@/db";

export async function GET() {
  try {
    // Test 1: Vérifier la connexion à la base de données
    const connectionTest = await query('SELECT NOW() as current_time');
    
    // Test 2: Vérifier la structure de la table Rentals
    const rentalsStructure = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Rentals' 
      ORDER BY ordinal_position
    `);
    
    // Test 3: Vérifier la structure de la table Tools
    const toolsStructure = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Tools' 
      ORDER BY ordinal_position
    `);
    
    // Test 4: Vérifier les données de test
    const sampleRentals = await query(`
      SELECT "RentalId", "ToolId", "StatusId" 
      FROM "Rentals" 
      LIMIT 3
    `);
    
    const sampleTools = await query(`
      SELECT "ToolId", "StatusId" 
      FROM "Tools" 
      LIMIT 3
    `);
    
    // Test 5: Vérifier les triggers restants
    const remainingTriggers = await query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_name LIKE '%updated%' OR trigger_name LIKE '%update%'
    `);
    
    return NextResponse.json({
      success: true,
      tests: {
        connection: {
          status: 'OK',
          currentTime: connectionTest.rows[0]?.current_time
        },
        rentalsStructure: {
          status: 'OK',
          columns: rentalsStructure.rows
        },
        toolsStructure: {
          status: 'OK', 
          columns: toolsStructure.rows
        },
        sampleData: {
          rentals: sampleRentals.rows,
          tools: sampleTools.rows
        },
        triggers: {
          count: remainingTriggers.rows.length,
          triggers: remainingTriggers.rows
        }
      }
    });
    
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Debug test failed',
      stack: err?.stack
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rentalId, action } = body;
    
    console.log('Rental debug API called with:', { rentalId, action });
    
    // Test simple de mise à jour
    const testUpdate = await query(`
      UPDATE "Rentals" 
      SET "StatusId" = $1
      WHERE "RentalId" = $2
      RETURNING "RentalId", "StatusId"
    `, [action === 'accept' ? 2 : 3, rentalId]);
    
    return NextResponse.json({
      success: true,
      message: 'Debug test update successful',
      result: testUpdate.rows[0]
    });
    
  } catch (err: any) {
    console.error('Rental debug error:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Debug test update failed',
      stack: err?.stack
    }, { status: 500 });
  }
}
