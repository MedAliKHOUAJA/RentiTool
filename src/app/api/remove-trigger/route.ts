import { NextResponse } from "next/server";
import { query } from "@/db";

export async function POST() {
  try {
    const results = [];
    
    // 1. Supprimer la fonction update_updated_at_column spécifiquement
    try {
      await query(`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`);
      results.push('✅ Fonction update_updated_at_column supprimée avec CASCADE');
    } catch (err: any) {
      results.push(`❌ Erreur suppression fonction: ${err.message}`);
    }
    
    // 2. Supprimer tous les triggers qui utilisent cette fonction
    const tables = ['"Tools"', '"Rentals"', '"RentalsConfirmation"', '"RentalsMessages"', '"RentalsPayments"'];
    
    for (const table of tables) {
      try {
        await query(`DROP TRIGGER IF EXISTS update_updated_at_column ON ${table} CASCADE`);
        results.push(`✅ Trigger update_updated_at_column supprimé de ${table}`);
      } catch (err: any) {
        results.push(`⚠️ Trigger sur ${table}: ${err.message}`);
      }
    }
    
    // 3. Vérifier qu'il ne reste plus de triggers problématiques
    try {
      const remainingTriggers = await query(`
        SELECT trigger_name, event_object_table, action_statement
        FROM information_schema.triggers 
        WHERE trigger_name LIKE '%updated%' OR action_statement LIKE '%UpdatedAt%'
      `);
      
      if (remainingTriggers.rows.length > 0) {
        results.push('⚠️ Triggers restants détectés:');
        remainingTriggers.rows.forEach(trigger => {
          results.push(`   - ${trigger.trigger_name} sur ${trigger.event_object_table}`);
          results.push(`     Action: ${trigger.action_statement}`);
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
        SELECT routine_name, routine_definition
        FROM information_schema.routines 
        WHERE routine_name LIKE '%updated%' OR routine_definition LIKE '%UpdatedAt%'
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
      message: 'Suppression du trigger update_updated_at_column terminée',
      results
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to remove trigger'
    }, { status: 500 });
  }
}


