# Configuration Gemini AI pour la génération automatique de messages

## 🚀 Installation terminée !

L'intégration de Gemini AI pour la génération automatique de messages personnalisés est maintenant implémentée dans votre système de gestion de réservations.

---

## 📋 Configuration requise

### 1. Obtenir une clé API Gemini (GRATUIT)

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Create API Key"
4. Copiez votre clé API (elle commence par `AIza...`)

### 2. Configurer la variable d'environnement

Créez ou modifiez le fichier `.env.local` à la racine de votre projet :

```env
# Gemini AI Configuration
GEMINI_API_KEY=AIza...votre_cle_api_ici

# Base URL (pour les appels API internes)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Note:** Pour la production, utilisez `.env.production.local` avec votre URL de production.

---

## ✨ Fonctionnalités implémentées

### 1. Génération automatique de messages

Les messages sont automatiquement générés dans les cas suivants :

- ✅ **Création de réservation** → Message de confirmation
- ✅ **Acceptation de réservation** → Message d'acceptation
- ✅ **Rejet de réservation** → Message de refus

### 2. Types de messages disponibles

- `confirmation` - Message de confirmation lors de la création
- `acceptance` - Message d'acceptation par le propriétaire
- `rejection` - Message de refus par le propriétaire
- `reminder` - Rappel avant le début de la réservation
- `completion` - Message de fin de réservation
- `cancellation` - Message d'annulation

### 3. Langues supportées

- 🇫🇷 Français (par défaut)
- 🇬🇧 Anglais
- 🇸🇦 Arabe

---

## 📁 Fichiers créés

1. **`src/lib/gemini.ts`** - Configuration et fonctions Gemini
2. **`src/app/api/ai/generate-message/route.ts`** - API route pour générer les messages
3. **`src/utils/generateRentalMessage.ts`** - Utilitaire pour utiliser la génération de messages

---

## 🔧 Utilisation

### Utilisation automatique (déjà intégrée)

Les messages sont générés automatiquement lors des actions de réservation. Aucune action supplémentaire n'est nécessaire.

### Utilisation manuelle via API

```typescript
// Exemple: Générer un message de confirmation
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
console.log(data.message); // Message généré
```

### Utilisation dans un composant React

```typescript
import { generateRentalMessage } from '@/utils/generateRentalMessage';

// Dans votre composant
const handleGenerateMessage = async () => {
  const result = await generateRentalMessage({
    rentalId: 1,
    messageType: 'acceptance',
    language: 'fr'
  });
  
  if (result.success) {
    console.log('Message:', result.message);
    // Afficher ou envoyer le message
  }
};
```

---

## 🎯 Prochaines étapes (optionnel)

### 1. Envoyer les messages par email

Vous pouvez intégrer un service d'email (SendGrid, Resend, etc.) pour envoyer automatiquement les messages générés :

```typescript
// Dans src/lib/gemini.ts ou un nouveau fichier
async function sendMessageByEmail(message: string, recipientEmail: string) {
  // Intégrer votre service d'email ici
}
```

### 2. Envoyer des notifications push

Intégrez un service de notifications push pour informer les utilisateurs en temps réel.

### 3. Sauvegarder les messages dans la base de données

Créez une table `RentalMessages` pour stocker l'historique des messages générés.

---

## 🐛 Dépannage

### Erreur: "GEMINI_API_KEY is not set"

- Vérifiez que vous avez créé le fichier `.env.local`
- Vérifiez que la variable `GEMINI_API_KEY` est bien définie
- Redémarrez le serveur de développement (`npm run dev`)

### Les messages ne sont pas générés

- Vérifiez les logs de la console pour voir les erreurs
- Assurez-vous que votre clé API Gemini est valide
- Vérifiez que `NEXT_PUBLIC_BASE_URL` est correctement configuré

### Message de fallback utilisé

Si Gemini n'est pas disponible, le système utilise automatiquement des messages de fallback pré-définis. C'est normal et ne bloque pas le fonctionnement.

---

## 💰 Coûts

**Gemini API est GRATUIT** pour un usage raisonnable :
- 15 requêtes par minute (RPM)
- 1,500 requêtes par jour (RPD)
- Parfait pour la plupart des applications

Pour un usage plus important, consultez [la page de tarification Google AI](https://ai.google.dev/pricing).

---

## 📚 Documentation

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com/)

---

## ✅ Test

Pour tester l'intégration :

1. Créez une nouvelle réservation
2. Acceptez ou rejetez une réservation
3. Vérifiez les logs de la console pour voir les messages générés

Les messages sont actuellement loggés dans la console. Vous pouvez ensuite les intégrer dans votre système d'email/notifications.

---

**🎉 Félicitations ! Votre système de génération automatique de messages est maintenant opérationnel !**

