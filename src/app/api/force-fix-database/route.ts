import { NextResponse } from "next/server";
import { query } from "@/db";

export async function POST() {
  try {
    const results = [];
    
    // 1. Supprimer TOUS les triggers de TOUTES les tables
    const allTables = [
      '"Tools"', '"Rentals"', '"RentalsConfirmation"', '"RentalsMessages"', 
      '"RentalsPayments"', '"RentalsPaymentStatus"', '"RentalsPaymentType"',
      '"StatusRentals"', '"StatusTools"', '"RentalsConfirmationStatus"'
    ];
    
    const allTriggerNames = [
      'update_updated_at_column',
      'update_tools_updated_at',
      'update_rentals_updated_at',
      'update_updated_at',
      'trigger_updated_at',
      'update_updated_at_trigger',
      'updated_at_trigger'
    ];
    
    for (const table of allTables) {
      for (const triggerName of allTriggerNames) {
        try {
          await query(`DROP TRIGGER IF EXISTS ${triggerName} ON ${table} CASCADE`);
          results.push(`✅ Trigger ${triggerName} supprimé de ${table}`);
        } catch (err: any) {
          results.push(`⚠️ ${triggerName} sur ${table}: ${err.message}`);
        }
      }
    }
    
    // 2. Supprimer TOUTES les fonctions qui pourraient causer des problèmes
    const allFunctionNames = [
      'update_updated_at_column',
      'update_updated_at',
      'trigger_updated_at',
      'update_updated_at_trigger',
      'updated_at_trigger',
      'update_updated_at_column()',
      'update_updated_at()',
      'trigger_updated_at()'
    ];
    
    for (const funcName of allFunctionNames) {
      try {
        await query(`DROP FUNCTION IF EXISTS ${funcName} CASCADE`);
        results.push(`✅ Fonction ${funcName} supprimée`);
      } catch (err: any) {
        results.push(`⚠️ Fonction ${funcName}: ${err.message}`);
      }
    }
    
    // 3. Vérifier s'il reste des triggers problématiques
    try {
      const remainingTriggers = await query(`
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_name LIKE '%updated%' OR trigger_name LIKE '%update%'
      `);
      
      if (remainingTriggers.rows.length > 0) {
        results.push('⚠️ Triggers restants détectés:');
        remainingTriggers.rows.forEach(trigger => {
          results.push(`   - ${trigger.trigger_name} sur ${trigger.event_object_table}`);
        });
      } else {
        results.push('✅ Aucun trigger problématique restant');
      }
    } catch (err: any) {
      results.push(`⚠️ Vérification triggers: ${err.message}`);
    }
    
    // 4. Vérifier les fonctions restantes
    try {
      const remainingFunctions = await query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_name LIKE '%updated%' OR routine_name LIKE '%update%'
      `);
      
      if (remainingFunctions.rows.length > 0) {
        results.push('⚠️ Fonctions restantes détectées:');
        remainingFunctions.rows.forEach(func => {
          results.push(`   - ${func.routine_name}`);
        });
      } else {
        results.push('✅ Aucune fonction problématique restante');
      }
    } catch (err: any) {
      results.push(`⚠️ Vérification fonctions: ${err.message}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Nettoyage radical des triggers UpdatedAt terminé',
      results
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to force fix database'
    }, { status: 500 });
  }
}





