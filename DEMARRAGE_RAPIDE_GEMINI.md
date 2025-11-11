# 🚀 Démarrage Rapide - Gemini AI Messages Personnalisés

## ✅ Configuration terminée !

Votre clé API Gemini a été configurée avec succès dans le fichier `.env.local`.

---

## 🎯 Test rapide

### 1. Redémarrer le serveur de développement

```bash
npm run dev
```

**Important :** Vous devez redémarrer le serveur pour que les variables d'environnement soient chargées.

### 2. Tester l'API directement

Une fois le serveur démarré, vous pouvez tester l'API :

```bash
# Test avec curl (remplacez 1 par un ID de réservation existant)
curl -X POST http://localhost:3000/api/ai/generate-message \
  -H "Content-Type: application/json" \
  -d '{
    "rentalId": 1,
    "messageType": "confirmation",
    "language": "fr"
  }'
```

### 3. Tester via l'interface

1. Créez une nouvelle réservation dans votre application
2. Vérifiez la console du serveur - vous devriez voir :
   ```
   ✅ Message de confirmation généré pour la réservation #X
   ```

3. Acceptez ou rejetez une réservation
4. Vérifiez la console - vous devriez voir :
   ```
   ✅ Message acceptance/rejection généré pour la réservation #X
   ```

---

## 📋 Types de messages disponibles

| Type | Description | Quand |
|------|-------------|-------|
| `confirmation` | Message de confirmation | Lors de la création d'une réservation |
| `acceptance` | Message d'acceptation | Quand le propriétaire accepte |
| `rejection` | Message de refus | Quand le propriétaire rejette |
| `reminder` | Rappel | Avant le début de la réservation |
| `completion` | Fin de réservation | Quand la réservation se termine |
| `cancellation` | Annulation | Quand une réservation est annulée |

---

## 🔧 Utilisation dans votre code

### Exemple 1 : Générer un message manuellement

```typescript
import { generateRentalMessage } from '@/utils/generateRentalMessage';

const result = await generateRentalMessage({
  rentalId: 1,
  messageType: 'acceptance',
  language: 'fr'
});

if (result.success) {
  console.log('Message généré:', result.message);
  // Envoyer par email, SMS, notification, etc.
}
```

### Exemple 2 : Utiliser l'API directement

```typescript
const response = await fetch('/api/ai/generate-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rentalId: 1,
    messageType: 'confirmation',
    language: 'fr'
  })
});

const data = await response.json();
console.log(data.message);
```

---

## 🐛 Dépannage

### Erreur : "GEMINI_API_KEY is not set"

**Solution :**
1. Vérifiez que le fichier `.env.local` existe à la racine du projet
2. Vérifiez que la clé API est correcte dans `.env.local`
3. **Redémarrez le serveur** (`npm run dev`)

### Les messages ne sont pas générés

**Vérifications :**
1. Vérifiez les logs de la console du serveur
2. Assurez-vous que la clé API Gemini est valide
3. Vérifiez que `NEXT_PUBLIC_BASE_URL` est correctement configuré

### Message de fallback utilisé

Si vous voyez un message de fallback (message pré-défini), cela signifie que :
- Gemini n'est pas disponible temporairement, OU
- La clé API n'est pas valide

Le système utilise automatiquement des messages de fallback pour ne pas bloquer le processus.

---

## 📊 Où sont les messages générés ?

Actuellement, les messages sont :
- ✅ Générés automatiquement lors des actions de réservation
- ✅ Loggés dans la console du serveur
- ⚠️ **Pas encore envoyés automatiquement** (email, SMS, etc.)

### Prochaines étapes (optionnel)

Pour envoyer les messages automatiquement :

1. **Intégrer un service d'email** (SendGrid, Resend, etc.)
2. **Intégrer un service SMS** (Twilio, etc.)
3. **Créer des notifications push** dans l'application
4. **Sauvegarder les messages** dans la base de données

---

## ✅ Checklist de vérification

- [x] Package `@google/generative-ai` installé
- [x] Fichier `.env.local` créé avec la clé API
- [x] Fichier `src/lib/gemini.ts` créé
- [x] API route `/api/ai/generate-message` créée
- [x] Intégration automatique dans `rental-requests/route.ts`
- [x] Intégration automatique dans `rental-bookings/route.ts`
- [ ] Serveur redémarré avec `npm run dev`
- [ ] Test d'une réservation effectué

---

## 🎉 Félicitations !

Votre système de génération automatique de messages personnalisés avec Gemini AI est maintenant **opérationnel** !

Les messages seront générés automatiquement lors de :
- ✅ Création de réservation
- ✅ Acceptation de réservation
- ✅ Rejet de réservation

**Prochaine étape :** Redémarrez votre serveur et testez !

```bash
npm run dev
```

