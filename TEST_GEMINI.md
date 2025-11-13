# 🧪 Guide de Test - Génération de Messages Gemini AI

## 📋 Méthodes de test

### Méthode 1 : Test via l'interface (Recommandé)

#### Étape 1 : Démarrer le serveur
```bash
npm run dev
```

#### Étape 2 : Créer une réservation
1. Ouvrez votre application dans le navigateur : `http://localhost:3000`
2. Créez une nouvelle réservation
3. **Vérifiez la console du serveur** - Vous devriez voir :
   ```
   ✅ Message de confirmation généré pour la réservation #X
   ```

#### Étape 3 : Accepter/Rejeter une réservation
1. Allez sur la page de gestion des réservations : `/rental-management`
2. Acceptez ou rejetez une réservation
3. **Vérifiez la console du serveur** - Vous devriez voir :
   ```
   ✅ Message acceptance/rejection généré pour la réservation #X
   ```

---

### Méthode 2 : Test direct de l'API

#### Test avec curl (PowerShell)

```powershell
# Test 1 : Message de confirmation
curl -X POST http://localhost:3000/api/ai/generate-message `
  -H "Content-Type: application/json" `
  -d '{\"rentalId\": 1, \"messageType\": \"confirmation\", \"language\": \"fr\"}'

# Test 2 : Message d'acceptation
curl -X POST http://localhost:3000/api/ai/generate-message `
  -H "Content-Type: application/json" `
  -d '{\"rentalId\": 1, \"messageType\": \"acceptance\", \"language\": \"fr\"}'

# Test 3 : Message de refus
curl -X POST http://localhost:3000/api/ai/generate-message `
  -H "Content-Type: application/json" `
  -d '{\"rentalId\": 1, \"messageType\": \"rejection\", \"language\": \"fr\"}'
```

**Important :** Remplacez `1` par un ID de réservation existant dans votre base de données.

---

### Méthode 3 : Test avec un script Node.js

Créez un fichier `test-gemini.js` à la racine du projet :

```javascript
// test-gemini.js
const fetch = require('node-fetch');

async function testGemini() {
  const baseUrl = 'http://localhost:3000';
  const rentalId = 1; // Remplacez par un ID existant

  const tests = [
    { messageType: 'confirmation', language: 'fr' },
    { messageType: 'acceptance', language: 'fr' },
    { messageType: 'rejection', language: 'fr' },
    { messageType: 'reminder', language: 'fr' }
  ];

  console.log('🧪 Test de génération de messages Gemini AI\n');

  for (const test of tests) {
    try {
      console.log(`📝 Test: ${test.messageType} (${test.language})...`);
      
      const response = await fetch(`${baseUrl}/api/ai/generate-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId,
          messageType: test.messageType,
          language: test.language
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Succès!');
        console.log(`📄 Message généré:\n${data.message}\n`);
      } else {
        console.log('❌ Erreur:', data.error || 'Unknown error');
        console.log('');
      }
    } catch (error) {
      console.log('❌ Erreur de connexion:', error.message);
      console.log('');
    }
  }
}

testGemini();
```

Exécutez le script :
```bash
node test-gemini.js
```

---

### Méthode 4 : Test dans la console du navigateur

1. Ouvrez votre application dans le navigateur
2. Ouvrez la console développeur (F12)
3. Exécutez ce code :

```javascript
// Test de génération de message
async function testMessage() {
  const response = await fetch('/api/ai/generate-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rentalId: 1, // Remplacez par un ID existant
      messageType: 'confirmation',
      language: 'fr'
    })
  });
  
  const data = await response.json();
  console.log('Résultat:', data);
  return data;
}

// Exécuter le test
testMessage();
```

---

## ✅ Checklist de vérification

### Avant de tester :
- [ ] Le serveur est démarré (`npm run dev`)
- [ ] Le fichier `.env.local` existe avec `GEMINI_API_KEY`
- [ ] La clé API Gemini est valide
- [ ] Vous avez au moins une réservation dans la base de données

### Pendant le test :
- [ ] La console du serveur affiche les messages générés
- [ ] Aucune erreur dans la console
- [ ] Les messages sont générés en français (ou la langue choisie)
- [ ] Les messages sont personnalisés avec les détails de la réservation

### Résultats attendus :

#### ✅ Succès :
```
✅ Message de confirmation généré pour la réservation #1
```

#### ❌ Erreur (clé API manquante) :
```
Error: GEMINI_API_KEY is not set in environment variables
```
**Solution :** Vérifiez que `.env.local` existe et contient la clé API

#### ❌ Erreur (clé API invalide) :
```
Error: API key not valid
```
**Solution :** Vérifiez que votre clé API Gemini est correcte

#### ⚠️ Message de fallback :
Si vous voyez un message pré-défini (non généré par Gemini), cela signifie que :
- Gemini n'est pas disponible temporairement, OU
- La clé API n'est pas valide

Le système utilise automatiquement des messages de fallback pour ne pas bloquer le processus.

---

## 🔍 Vérification des logs

### Console du serveur (Terminal où vous avez lancé `npm run dev`)

Vous devriez voir :
```
✅ Message de confirmation généré pour la réservation #1
✅ Message acceptance généré pour la réservation #1
```

### Console du navigateur (F12)

Si vous testez via l'API, vous verrez la réponse JSON :
```json
{
  "success": true,
  "message": "Bonjour,\n\nVotre demande de réservation #1...",
  "context": {
    "rentalId": 1,
    "messageType": "confirmation",
    "language": "fr"
  }
}
```

---

## 🐛 Dépannage

### Le serveur ne démarre pas
- Vérifiez que le port 3000 n'est pas déjà utilisé
- Vérifiez les erreurs dans le terminal

### Erreur "GEMINI_API_KEY is not set"
- Vérifiez que `.env.local` existe à la racine du projet
- Redémarrez le serveur après avoir créé/modifié `.env.local`

### Erreur "Rental not found"
- Assurez-vous d'utiliser un `rentalId` qui existe dans votre base de données
- Vérifiez votre base de données

### Les messages ne sont pas générés
- Vérifiez la console du serveur pour les erreurs
- Vérifiez que la clé API Gemini est valide
- Testez l'API directement avec curl ou Postman

---

## 📊 Test de tous les types de messages

| Type | Description | Test |
|------|-------------|------|
| `confirmation` | Message de confirmation | Créez une réservation |
| `acceptance` | Message d'acceptation | Acceptez une réservation |
| `rejection` | Message de refus | Rejetez une réservation |
| `reminder` | Rappel | Testez via l'API |
| `completion` | Fin de réservation | Testez via l'API |
| `cancellation` | Annulation | Testez via l'API |

---

## 🎯 Test rapide (1 minute)

1. **Démarrez le serveur :**
   ```bash
   npm run dev
   ```

2. **Dans un autre terminal, testez l'API :**
   ```bash
   curl -X POST http://localhost:3000/api/ai/generate-message -H "Content-Type: application/json" -d "{\"rentalId\": 1, \"messageType\": \"confirmation\", \"language\": \"fr\"}"
   ```

3. **Vérifiez la réponse** - Vous devriez voir un message généré !

---

**Bon test ! 🚀**

