import { NextResponse } from "next/server";
import { query } from "@/db";

export async function POST() {
  try {
    const results = [];
    
    // 1. Mettre à jour tous les outils avec StatusId NULL vers Available (1)
    try {
      const updateResult = await query(`
        UPDATE "Tools" 
        SET "StatusId" = 1 
        WHERE "StatusId" IS NULL
        RETURNING "ToolId", "StatusId"
      `);
      
      results.push(`✅ ${updateResult.rows.length} outils mis à jour vers StatusId = 1 (Available)`);
    } catch (err: any) {
      results.push(`❌ Erreur mise à jour outils: ${err.message}`);
    }
    
    // 2. Vérifier les outils avec des StatusId invalides
    try {
      const invalidStatusResult = await query(`
        SELECT "ToolId", "StatusId" 
        FROM "Tools" 
        WHERE "StatusId" NOT IN (1, 2, 3, 4, 5, 6) OR "StatusId" IS NULL
      `);
      
      if (invalidStatusResult.rows.length > 0) {
        results.push(`⚠️ ${invalidStatusResult.rows.length} outils avec StatusId invalide:`, invalidStatusResult.rows);
      } else {
        results.push('✅ Tous les outils ont des StatusId valides');
      }
    } catch (err: any) {
      results.push(`❌ Erreur vérification: ${err.message}`);
    }
    
    // 3. Afficher le résumé des StatusId
    try {
      const summaryResult = await query(`
        SELECT "StatusId", COUNT(*) as count
        FROM "Tools" 
        GROUP BY "StatusId"
        ORDER BY "StatusId"
      `);
      
      results.push('📊 Résumé des StatusId des outils:');
      summaryResult.rows.forEach(row => {
        const statusName = row.statusid === 1 ? 'Available' : 
                          row.statusid === 2 ? 'Reserved' : 
                          row.statusid === 3 ? 'Rented Out' : 
                          row.statusid === 4 ? 'Under Maintenance' : 
                          row.statusid === 5 ? 'Out of Service' : 
                          row.statusid === 6 ? 'Damaged' : 'Unknown';
        results.push(`   StatusId ${row.statusid} (${statusName}): ${row.count} outils`);
      });
    } catch (err: any) {
      results.push(`❌ Erreur résumé: ${err.message}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Correction des StatusId des outils terminée',
      results
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to fix tools status'
    }, { status: 500 });
  }
}


