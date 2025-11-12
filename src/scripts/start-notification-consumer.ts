#!/usr/bin/env tsx

// ✅ Charger les variables d'environnement EN PREMIER
import { closePool, testConnection } from '@/db';
import { ServiceBusConsumerService } from '@/features/notifications/infrastructure/service-bus-consumer.service';
import dotenv from 'dotenv';
import path from 'path';

// Charger .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Puis importer le reste


/**
 * Script pour démarrer le consumer de notifications
 * Lance un process qui écoute en continu la queue Azure Service Bus
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   🚀 RentiTool - Notification Consumer            ║');
  console.log('║   📡 Starting Service Bus listener...             ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');

  // ✅ Afficher la configuration (sans les secrets)
  console.log('⚙️  Configuration:');
  console.log(`   - PostgreSQL User: ${process.env.POSTGRES_USER || '❌ Missing'}`);
  console.log(`   - PostgreSQL Host: ${process.env.POSTGRES_HOST || '❌ Missing'}`);
  console.log(`   - PostgreSQL Database: ${process.env.POSTGRES_DATABASE || '❌ Missing'}`);
  console.log(`   - PostgreSQL Port: ${process.env.POSTGRES_PORT || '❌ Missing'}`);
  console.log(`   - Service Bus: ${process.env.AZURE_SERVICE_BUS_CONNECTION_STRING ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`   - Email Config: ${process.env.AZURE_EMAIL_FROM_ADDRESS ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`   - Queue: ${process.env.AZURE_SERVICE_BUS_QUEUE_NAME || 'notifications-queue'}`);
  console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   - Time: ${new Date().toISOString()}`);
  console.log('');

  // ✅ Vérifier les variables PostgreSQL
  const requiredPostgresVars = ['POSTGRES_USER', 'POSTGRES_HOST', 'POSTGRES_DATABASE', 'POSTGRES_PASSWORD', 'POSTGRES_PORT'];
  const missingPostgresVars = requiredPostgresVars.filter(v => !process.env[v]);

  if (missingPostgresVars.length > 0) {
    console.error('❌ ERROR: Missing PostgreSQL variables:', missingPostgresVars.join(', '));
    console.error('   Please set them in .env.local');
    process.exit(1);
  }

  // ✅ Vérifier les variables Azure
  if (!process.env.AZURE_SERVICE_BUS_CONNECTION_STRING) {
    console.error('❌ ERROR: AZURE_SERVICE_BUS_CONNECTION_STRING is not set in .env.local');
    process.exit(1);
  }

  if (!process.env.AZURE_COMMUNICATION_CONNECTION_STRING) {
    console.error('❌ ERROR: AZURE_COMMUNICATION_CONNECTION_STRING is not set in .env.local');
    process.exit(1);
  }

  if (!process.env.AZURE_EMAIL_FROM_ADDRESS) {
    console.error('❌ ERROR: AZURE_EMAIL_FROM_ADDRESS is not set in .env.local');
    process.exit(1);
  }

  // ✅ Tester la connexion PostgreSQL
  console.log('🔌 Testing database connection...');
  const isDbConnected = await testConnection();
  
  if (!isDbConnected) {
    console.error('❌ ERROR: Could not connect to PostgreSQL');
    console.error('   Please check your PostgreSQL service is running');
    process.exit(1);
  }
  console.log('');

  const queueName = process.env.AZURE_SERVICE_BUS_QUEUE_NAME || 'notifications-queue';

  const consumer = new ServiceBusConsumerService();

  // Démarrer l'écoute
  await consumer.startListening(queueName);

  console.log('');
  console.log('✅ Notification Consumer is running');
  console.log('📡 Listening for messages...');
  console.log('');
  console.log('💡 Press Ctrl+C to stop');
  console.log('');

  // Gérer l'arrêt propre (Ctrl+C)
  process.on('SIGINT', async () => {
    console.log('');
    console.log('🛑 Received SIGINT, stopping consumer...');
    await consumer.stopListening();
    await closePool();
    console.log('👋 Goodbye!');
    process.exit(0);
  });

  // Gérer l'arrêt propre (kill)
  process.on('SIGTERM', async () => {
    console.log('');
    console.log('🛑 Received SIGTERM, stopping consumer...');
    await consumer.stopListening();
    await closePool();
    console.log('👋 Goodbye!');
    process.exit(0);
  });

  // Gérer les erreurs non attrapées
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Ne pas exit, continuer à écouter
  });

  process.on('uncaughtException', async (error) => {
    console.error('❌ Uncaught Exception:', error);
    await consumer.stopListening();
    await closePool();
    process.exit(1);
  });
}

// Lancer le consumer
main().catch(async (error) => {
  console.error('❌ Fatal error starting consumer:', error);
  await closePool();
  process.exit(1);
});