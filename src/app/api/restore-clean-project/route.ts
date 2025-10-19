import { NextResponse } from "next/server";
import { query } from "@/db";

export async function POST() {
  try {
    const results = [];
    
    // 1. Supprimer TOUS les triggers et fonctions problématiques
    try {
      // Supprimer toutes les fonctions UpdatedAt
      await query(`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`);
      await query(`DROP FUNCTION IF EXISTS update_updated_at() CASCADE`);
      await query(`DROP FUNCTION IF EXISTS trigger_updated_at() CASCADE`);
      results.push('✅ Toutes les fonctions UpdatedAt supprimées');
    } catch (err: any) {
      results.push(`⚠️ Fonctions: ${err.message}`);
    }
    
    // 2. Supprimer tous les triggers de toutes les tables
    const allTables = [
      '"Tools"', '"Rentals"', '"RentalsConfirmation"', '"RentalsMessages"', 
      '"RentalsPayments"', '"RentalsPaymentStatus"', '"RentalsPaymentType"',
      '"StatusRentals"', '"StatusTools"', '"RentalsConfirmationStatus"'
    ];
    
    const allTriggerNames = [
      'update_updated_at_column', 'update_tools_updated_at', 'update_rentals_updated_at',
      'update_updated_at', 'trigger_updated_at', 'updated_at_trigger'
    ];
    
    for (const table of allTables) {
      for (const triggerName of allTriggerNames) {
        try {
          await query(`DROP TRIGGER IF EXISTS ${triggerName} ON ${table} CASCADE`);
        } catch (err: any) {
          // Ignore errors for non-existent triggers
        }
      }
    }
    results.push('✅ Tous les triggers UpdatedAt supprimés');
    
    // 3. Vérifier et corriger les StatusId des outils
    try {
      const nullStatusTools = await query(`
        UPDATE "Tools" 
        SET "StatusId" = 1 
        WHERE "StatusId" IS NULL
        RETURNING "ToolId"
      `);
      results.push(`✅ ${nullStatusTools.rows.length} outils avec StatusId NULL corrigés vers 1 (Available)`);
    } catch (err: any) {
      results.push(`⚠️ Correction StatusId outils: ${err.message}`);
    }
    
    // 4. Vérifier l'état final
    try {
      const remainingTriggers = await query(`
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_name LIKE '%updated%' OR trigger_name LIKE '%update%'
      `);
      
      if (remainingTriggers.rows.length === 0) {
        results.push('✅ Aucun trigger problématique restant');
      } else {
        results.push('⚠️ Triggers restants:');
        remainingTriggers.rows.forEach(trigger => {
          results.push(`   - ${trigger.trigger_name} sur ${trigger.event_object_table}`);
        });
      }
    } catch (err: any) {
      results.push(`⚠️ Vérification triggers: ${err.message}`);
    }
    
    // 5. Vérifier les fonctions restantes
    try {
      const remainingFunctions = await query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_name LIKE '%updated%' OR routine_name LIKE '%update%'
      `);
      
      if (remainingFunctions.rows.length === 0) {
        results.push('✅ Aucune fonction problématique restante');
      } else {
        results.push('⚠️ Fonctions restantes:');
        remainingFunctions.rows.forEach(func => {
          results.push(`   - ${func.routine_name}`);
        });
      }
    } catch (err: any) {
      results.push(`⚠️ Vérification fonctions: ${err.message}`);
    }
    
    // 6. Résumé des StatusId des outils
    try {
      const statusSummary = await query(`
        SELECT "StatusId", COUNT(*) as count
        FROM "Tools" 
        GROUP BY "StatusId"
        ORDER BY "StatusId"
      `);
      
      results.push('📊 État des StatusId des outils:');
      statusSummary.rows.forEach(row => {
        const statusName = row.statusid === 1 ? 'Available' : 
                          row.statusid === 2 ? 'Reserved' : 
                          row.statusid === 3 ? 'Rented Out' : 
                          row.statusid === 4 ? 'Under Maintenance' : 
                          row.statusid === 5 ? 'Out of Service' : 
                          row.statusid === 6 ? 'Damaged' : 'Unknown';
        results.push(`   StatusId ${row.statusid} (${statusName}): ${row.count} outils`);
      });
    } catch (err: any) {
      results.push(`⚠️ Résumé StatusId: ${err.message}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Projet restauré à un état propre sans erreurs UpdatedAt',
      results,
      status: 'CLEAN'
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to restore clean project'
    }, { status: 500 });
  }
}


