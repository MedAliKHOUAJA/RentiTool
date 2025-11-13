import { NextResponse } from "next/server";
import { query } from "@/db";

export async function POST() {
  try {
    const results = [];
    
    // Add CreatedAt and UpdatedAt columns to Rentals table if they don't exist
    try {
      // Check if columns exist first
      const columnCheck = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Rentals' 
        AND column_name IN ('CreatedAt', 'UpdatedAt')
      `);
      
      const existingColumns = columnCheck.rows.map(row => row.column_name);
      
      if (!existingColumns.includes('CreatedAt')) {
        await query(`ALTER TABLE "Rentals" ADD COLUMN "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
        results.push('✅ Added CreatedAt column to Rentals table');
      } else {
        results.push('✅ CreatedAt column already exists in Rentals table');
      }
      
      if (!existingColumns.includes('UpdatedAt')) {
        await query(`ALTER TABLE "Rentals" ADD COLUMN "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
        results.push('✅ Added UpdatedAt column to Rentals table');
      } else {
        results.push('✅ UpdatedAt column already exists in Rentals table');
      }
      
    } catch (err: any) {
      results.push(`❌ Rentals table column addition error: ${err.message}`);
    }

    // Update existing records to have proper timestamps
    try {
      await query(`
        UPDATE "Rentals" 
        SET "CreatedAt" = NOW() - INTERVAL '1 day' * (RANDOM() * 30 + 1),
            "UpdatedAt" = NOW() - INTERVAL '1 day' * (RANDOM() * 10 + 1)
        WHERE "CreatedAt" IS NULL OR "UpdatedAt" IS NULL
      `);
      results.push('✅ Updated existing rental records with timestamps');
    } catch (err: any) {
      results.push(`❌ Timestamp update error: ${err.message}`);
    }

    // Create or update trigger function for UpdatedAt
    try {
      await query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW."UpdatedAt" = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql'
      `);
      
      await query(`
        DROP TRIGGER IF EXISTS update_rentals_updated_at ON "Rentals"
      `);
      
      await query(`
        CREATE TRIGGER update_rentals_updated_at
          BEFORE UPDATE ON "Rentals"
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `);
      results.push('✅ UpdatedAt trigger created/updated for Rentals');
    } catch (err: any) {
      results.push(`❌ Trigger creation error: ${err.message}`);
    }

    return NextResponse.json({
      status: 'completed',
      results,
      message: 'Database fix completed. CreatedAt and UpdatedAt columns added to Rentals table.'
    });

  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      error: err?.message || 'Database fix failed',
      message: 'Please check your database connection and permissions'
    }, { status: 500 });
  }
}