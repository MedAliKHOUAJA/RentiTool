import { NextResponse } from "next/server";
import { query } from "@/db";

export async function POST() {
  try {
    const results = [];
    
    // Create Rentals table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS "Rentals" (
          "RentalId" SERIAL PRIMARY KEY,
          "ToolId" INTEGER NOT NULL,
          "OwnerId" UUID NOT NULL,
          "RenterId" UUID NOT NULL,
          "TotalPrice" NUMERIC(10,2) NOT NULL,
          "RentalDateStart" DATE NOT NULL,
          "RentalDateEnd" DATE NOT NULL,
          "StatusId" INTEGER NOT NULL DEFAULT 1
        )
      `);
      results.push('✅ Rentals table created/verified');
    } catch (err: any) {
      results.push(`❌ Rentals table error: ${err.message}`);
    }

    // Create Tools table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS "Tools" (
          "ToolId" SERIAL PRIMARY KEY,
          "OwnerId" UUID NOT NULL,
          "Title" VARCHAR(255) NOT NULL,
          "Description" TEXT,
          "CategoryId" INTEGER,
          "SubCategoryId" INTEGER,
          "Brand" VARCHAR(100),
          "Model" VARCHAR(100),
          "RentalPricePerDay" NUMERIC(10,2),
          "RentalPricePerWeek" NUMERIC(10,2),
          "IsActive" BOOLEAN DEFAULT true,
          "StatusId" INTEGER DEFAULT 1
        )
      `);
      results.push('✅ Tools table created/verified');
    } catch (err: any) {
      results.push(`❌ Tools table error: ${err.message}`);
    }

    // Create RentalStatuses table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS "RentalStatuses" (
          "StatusId" SERIAL PRIMARY KEY,
          "StatusName" VARCHAR(50) NOT NULL UNIQUE,
          "Description" TEXT,
          "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      results.push('✅ RentalStatuses table created/verified');
    } catch (err: any) {
      results.push(`❌ RentalStatuses table error: ${err.message}`);
    }

    // Insert default rental statuses
    try {
      await query(`
        INSERT INTO "RentalStatuses" ("StatusName", "Description") VALUES
          ('Pending', 'Rental request is pending approval'),
          ('Confirmed', 'Rental has been confirmed'),
          ('Completed', 'Rental has been completed'),
          ('Cancelled', 'Rental has been cancelled'),
          ('Rejected', 'Rental request has been rejected')
        ON CONFLICT ("StatusName") DO NOTHING
      `);
      results.push('✅ Default rental statuses inserted');
    } catch (err: any) {
      results.push(`❌ RentalStatuses data error: ${err.message}`);
    }

    // Create indexes
    try {
      await query(`CREATE INDEX IF NOT EXISTS idx_rentals_tool_id ON "Rentals"("ToolId")`);
      await query(`CREATE INDEX IF NOT EXISTS idx_rentals_owner_id ON "Rentals"("OwnerId")`);
      await query(`CREATE INDEX IF NOT EXISTS idx_rentals_renter_id ON "Rentals"("RenterId")`);
      await query(`CREATE INDEX IF NOT EXISTS idx_rentals_status_id ON "Rentals"("StatusId")`);
      await query(`CREATE INDEX IF NOT EXISTS idx_rentals_dates ON "Rentals"("RentalDateStart", "RentalDateEnd")`);
      results.push('✅ Database indexes created');
    } catch (err: any) {
      results.push(`❌ Index creation error: ${err.message}`);
    }

    // Create trigger function for UpdatedAt
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
      results.push('✅ UpdatedAt trigger created for Rentals');
    } catch (err: any) {
      results.push(`❌ Trigger creation error: ${err.message}`);
    }

    return NextResponse.json({
      status: 'completed',
      results,
      message: 'Database setup completed. Check results for any errors.'
    });

  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      error: err?.message || 'Database setup failed',
      message: 'Please check your database connection and permissions'
    }, { status: 500 });
  }
}
