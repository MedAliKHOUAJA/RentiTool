// Script de test pour la génération de messages Gemini AI
// Usage: node test-gemini.js

const fetch = require('node-fetch');

async function testGemini() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const rentalId = process.argv[2] || 1; // Utilisez le premier argument ou 1 par défaut

  console.log('🧪 Test de génération de messages Gemini AI\n');
  console.log(`📍 URL: ${baseUrl}`);
  console.log(`🆔 Rental ID: ${rentalId}\n`);

  const tests = [
    { messageType: 'confirmation', language: 'fr', name: 'Confirmation' },
    { messageType: 'acceptance', language: 'fr', name: 'Acceptation' },
    { messageType: 'rejection', language: 'fr', name: 'Refus' },
    { messageType: 'reminder', language: 'fr', name: 'Rappel' }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const test of tests) {
    try {
      console.log(`📝 Test: ${test.name} (${test.messageType})...`);
      
      const response = await fetch(`${baseUrl}/api/ai/generate-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId: parseInt(rentalId),
          messageType: test.messageType,
          language: test.language
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Succès!');
        console.log(`📄 Message généré (${data.message.length} caractères):`);
        console.log('─'.repeat(60));
        console.log(data.message);
        console.log('─'.repeat(60));
        console.log('');
        successCount++;
      } else {
        console.log('❌ Erreur:', data.error || 'Unknown error');
        if (data.hint) {
          console.log('💡 Astuce:', data.hint);
        }
        console.log('');
        errorCount++;
      }
    } catch (error) {
      console.log('❌ Erreur de connexion:', error.message);
      console.log('💡 Assurez-vous que le serveur est démarré (npm run dev)');
      console.log('');
      errorCount++;
    }
  }

  // Résumé
  console.log('─'.repeat(60));
  console.log('📊 Résumé des tests:');
  console.log(`   ✅ Succès: ${successCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);
  console.log(`   📈 Taux de réussite: ${((successCount / tests.length) * 100).toFixed(1)}%`);
  console.log('─'.repeat(60));
}

// Exécuter les tests
testGemini().catch(console.error);

